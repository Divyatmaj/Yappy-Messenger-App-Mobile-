import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import ChatHeader from '../components/ChatHeader';
import ChatPlaceholder from '../components/ChatPlaceholder';
import Composer from '../components/Composer';
import GroupInfoSheet from '../components/GroupInfoSheet';
import ConnectionBanner from '../components/ConnectionBanner';
import JumpToLatestButton from '../components/JumpToLatestButton';
import MessageActionsSheet from '../components/MessageActionsSheet';
import MessageBubble from '../components/MessageBubble';
import NewMessagesDivider from '../components/NewMessagesDivider';
import SearchBar from '../components/SearchBar';
import Toast from '../components/Toast';
import { chatTitle } from '../chats';
import { useChat } from '../hooks/useChats';
import useIncomingMessages from '../hooks/useIncomingMessages';
import useMessages from '../hooks/useMessages';
import useReadState from '../hooks/useReadState';
import { useUsers } from '../hooks/useUsers';
import { useSession } from '../session';
import { messageKey } from '../api';
import {
  longPressFeedback,
  successFeedback,
  tapFeedback,
} from '../haptics';
import {
  composeReply,
  isQuotedMessage,
  makeSnippet,
  parseReply,
} from '../utils/reply';
import { mentionsUser } from '../utils/richText';
import { useThemedStyles } from '../theme';

// How close (in px) to the bottom still counts as "reading the latest".
const NEAR_BOTTOM_PX = 80;
// How long a message stays outlined after jumping to it from a reply.
const FLASH_MS = 1600;
// New-message toasts stay up a little longer than plain notices.
const INCOMING_TOAST_MS = 3500;

let toastCounter = 0;

// Who sent a message: by uid, or by name for older messages without one.
const senderOf = (message) => message?.uid ?? message?.user;

function matchesQuery(message, q) {
  return (
    (message.text ?? '').toLowerCase().includes(q) ||
    (message.user ?? '').toLowerCase().includes(q)
  );
}

export default function ChatScreen({ chatId, initialChat, onBack }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const { me, uid, changeName } = useSession();
  const { usersById } = useUsers();
  const chat = useChat(chatId, initialChat);
  const title = chatTitle(chat, uid, usersById);
  const isGroup = chat?.type !== 'direct';
  const isMine = useCallback(
    (message) => (message.uid ? message.uid === uid : message.user === me),
    [uid, me],
  );
  const {
    messages,
    loaded,
    online,
    fromCache,
    problem,
    send,
    retry,
    discard,
    refresh,
  } = useMessages(chatId, me, uid);
  const {
    dividerKey,
    unreadAtOpen,
    ready: readReady,
    markRead,
    clearDivider,
  } = useReadState(messages, isMine, loaded, chatId);
  const [text, setText] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [flashIndex, setFlashIndex] = useState(-1);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((toastText, extra = {}) => {
    setToast({ id: ++toastCounter, text: toastText, ...extra });
  }, []);

  const sendMessage = () => {
    const body = text.trim();
    if (!body) return;
    send(replyTo ? composeReply(replyTo, body) : body);
    setText('');
    setReplyTo(null);
    clearDivider();
    tapFeedback();
  };

  // ---- Message actions --------------------------------------------------
  const openActions = (message) => {
    longPressFeedback();
    setActionTarget(message);
  };

  const startReply = (message) => {
    setReplyTo(message);
    // Wait for the actions sheet to close before focusing the input.
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const copyMessage = async (message) => {
    try {
      await Clipboard.setStringAsync(parseReply(message.text).body);
      successFeedback();
      showToast('Copied to clipboard');
    } catch {
      showToast("Couldn't copy message");
    }
  };

  const actionsFor = (message) => {
    if (!message) return [];
    if (message.status === 'failed') {
      return [
        {
          key: 'retry',
          icon: '↻',
          label: 'Retry sending',
          onPress: () => retry(message.localId),
        },
        {
          key: 'copy',
          icon: '⧉',
          label: 'Copy text',
          onPress: () => copyMessage(message),
        },
        {
          key: 'delete',
          icon: '🗑',
          label: 'Delete',
          destructive: true,
          onPress: () => discard(message.localId),
        },
      ];
    }
    return [
      {
        key: 'reply',
        icon: '↩',
        label: 'Reply',
        onPress: () => startReply(message),
      },
      {
        key: 'copy',
        icon: '⧉',
        label: 'Copy text',
        onPress: () => copyMessage(message),
      },
    ];
  };

  // ---- Search -----------------------------------------------------------
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [matchPos, setMatchPos] = useState(0);
  const normalizedQuery = searching ? query.trim().toLowerCase() : '';

  // Indices (into `messages`) of every message that matches, oldest first.
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    const result = [];
    messages.forEach((m, i) => {
      if (matchesQuery(m, normalizedQuery)) result.push(i);
    });
    return result;
  }, [messages, normalizedQuery]);

  // A new query starts at the most recent match.
  useEffect(() => {
    setMatchPos(Math.max(matches.length - 1, 0));
    // Only re-run when the query changes, not when new messages arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery]);

  const safeMatchPos = Math.min(matchPos, Math.max(matches.length - 1, 0));
  const activeIndex = matches.length ? matches[safeMatchPos] : -1;

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.scrollToIndex({
      index: activeIndex,
      viewPosition: 0.5,
      animated: true,
    });
  }, [activeIndex]);

  const goToMatch = (delta) => {
    if (!matches.length) return;
    setMatchPos((pos) => (pos + delta + matches.length) % matches.length);
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };

  // ---- Scroll position & jump to latest -----------------------------------
  const nearBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mentionPending, setMentionPending] = useState(false);

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  const handleScroll = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distance =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const isNear = distance < NEAR_BOTTOM_PX;
    nearBottom.current = isNear;
    setShowJump(!isNear);
    if (isNear) {
      setUnread(0);
      setMentionPending(false);
      markRead();
    }
  };

  // Follow new messages only when the user is already at the bottom (or just
  // sent one). Otherwise count them so the jump button can show a badge.
  const previousCount = useRef(0);
  useEffect(() => {
    const added = messages.length - previousCount.current;
    const firstLoad = previousCount.current === 0;
    previousCount.current = messages.length;
    if (added <= 0) return;

    const last = messages[messages.length - 1];
    const sentByMe = last?.localId != null;

    if (firstLoad) {
      scrollToLatest(false);
    } else if (!readReady) {
      // First server sync after showing cached messages: where to scroll
      // is decided once the unread position is known (see below).
    } else if (sentByMe || (nearBottom.current && !searching)) {
      scrollToLatest(true);
      markRead();
    } else {
      const fromOthers = messages
        .slice(-added)
        .filter((m) => !isMine(m)).length;
      setUnread((n) => n + fromOthers);
    }
  }, [messages, isMine, searching, scrollToLatest, readReady, markRead]);

  const jumpToLatest = useCallback(() => {
    setUnread(0);
    setMentionPending(false);
    scrollToLatest(true);
  }, [scrollToLatest]);

  // Scrolls a message into view and briefly outlines it.
  const flashTimer = useRef(null);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const scrollToMessage = useCallback((index, { flash = true } = {}) => {
    listRef.current?.scrollToIndex({
      index,
      viewPosition: flash ? 0.5 : 0.1,
      animated: true,
    });
    if (!flash) return;
    setFlashIndex(index);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashIndex(-1), FLASH_MS);
  }, []);

  // Tapping a quote scrolls to the newest earlier message it matches.
  const jumpToQuoted = (index) => {
    const { quote } = parseReply(messages[index]?.text);
    for (let i = index - 1; i >= 0; i--) {
      if (isQuotedMessage(quote, messages[i])) {
        scrollToMessage(i);
        return;
      }
    }
    showToast('Original message is no longer available');
  };

  const indexOfKey = (key) =>
    messages.findIndex((m, i) => !m.localId && messageKey(m, i) === key);

  // Once we know where unread messages start, open the chat there.
  // Otherwise go to the latest message and count it as read.
  useEffect(() => {
    if (!readReady) return;
    const index = dividerKey ? indexOfKey(dividerKey) : -1;
    if (index === -1) {
      scrollToLatest(true);
      markRead();
      return;
    }
    nearBottom.current = false;
    setUnread(unreadAtOpen);
    setTimeout(() => scrollToMessage(index, { flash: false }), 60);
    // Runs once, when the read state becomes ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readReady]);

  // ---- In-app alerts for new messages -------------------------------------
  // Shown only when the new message isn't already on screen.
  useIncomingMessages(messages, isMine, readReady, (fresh) => {
    if (nearBottom.current && !searching) return;

    const mention = [...fresh]
      .reverse()
      .find(({ message }) =>
        mentionsUser(parseReply(message.text).body, me),
      );
    if (mention) {
      const key = messageKey(mention.message, mention.index);
      setMentionPending(true);
      longPressFeedback();
      showToast(
        `${mention.message.user} mentioned you: ${makeSnippet(
          mention.message.text,
        )}`,
        {
          duration: INCOMING_TOAST_MS,
          onPress: () => {
            const index = indexOfKey(key);
            if (index !== -1) scrollToMessage(index);
          },
        },
      );
      return;
    }

    const [{ message }] = fresh.slice(-1);
    showToast(
      fresh.length === 1
        ? `${message.user}: ${makeSnippet(message.text)}`
        : `${fresh.length} new messages`,
      { duration: INCOMING_TOAST_MS, onPress: jumpToLatest },
    );
  });

  // Item heights vary, so scrollToIndex may target an unmeasured row.
  // Scroll roughly there first so it gets rendered, then retry.
  const handleScrollToIndexFailed = ({ index, averageItemLength }) => {
    listRef.current?.scrollToOffset({
      offset: averageItemLength * index,
      animated: false,
    });
    setTimeout(() => {
      if (index < messages.length) {
        listRef.current?.scrollToIndex({
          index,
          viewPosition: 0.5,
          animated: true,
        });
      }
    }, 120);
  };

  // Names for @mention highlighting and suggestions: recent senders first,
  // then the other members of the chat.
  const memberIds = chat?.members ?? [];
  const members = useMemo(() => {
    const seen = new Set();
    for (let i = messages.length - 1; i >= 0; i--) {
      const user = messages[i].user?.trim();
      if (user) seen.add(user);
    }
    for (const id of memberIds) {
      const name = usersById.get(id);
      if (name) seen.add(name);
    }
    return [...seen];
  }, [messages, memberIds, usersById]);

  const renderItem = ({ item, index }) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const isDividerAt = (message, i) =>
      dividerKey != null &&
      message != null &&
      !message.localId &&
      messageKey(message, i) === dividerKey;
    const showDivider = isDividerAt(item, index);
    const dividerBelow = isDividerAt(next, index + 1);
    return (
      <View>
        {showDivider && <NewMessagesDivider />}
        <MessageBubble
          message={item}
          me={me}
          members={members}
          isMine={isMine(item)}
          isFirstInGroup={
            showDivider || !prev || senderOf(prev) !== senderOf(item)
          }
          isLastInGroup={
            dividerBelow || !next || senderOf(next) !== senderOf(item)
          }
          onRetry={() => retry(item.localId)}
          onDiscard={() => discard(item.localId)}
          onLongPress={() => openActions(item)}
          onQuotePress={() => jumpToQuoted(index)}
          query={normalizedQuery}
          isActiveMatch={index === activeIndex || index === flashIndex}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {searching ? (
          <SearchBar
            query={query}
            onChangeQuery={setQuery}
            matchCount={matches.length}
            currentMatch={safeMatchPos}
            onPrevious={() => goToMatch(-1)}
            onNext={() => goToMatch(1)}
            onClose={closeSearch}
          />
        ) : (
          <ChatHeader
            title={title}
            isGroup={isGroup}
            onBack={onBack}
            subtitle={
              fromCache && online
                ? 'Updating…'
                : isGroup
                  ? `${memberIds.length || 'No'} member${
                      memberIds.length === 1 ? '' : 's'
                    } · Group`
                  : 'Direct message'
            }
            onSearchPress={() => setSearching(true)}
            onMenuPress={() => setInfoOpen(true)}
          />
        )}

        <ConnectionBanner
          visible={!online}
          showingSaved={fromCache}
          problem={problem}
          onRetry={refresh}
        />

        <View style={styles.flex}>
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={messages}
            extraData={[
              normalizedQuery,
              activeIndex,
              flashIndex,
              dividerKey,
            ].join('|')}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            keyExtractor={(item, index) =>
              item.localId ?? messageKey(item, index)
            }
            renderItem={renderItem}
            ListHeaderComponent={
              messages.length > 0 ? (
                <Text style={styles.dateLabel}>MESSAGES</Text>
              ) : null
            }
            ListEmptyComponent={
              <ChatPlaceholder
                loading={!loaded && !problem}
                problem={problem}
                groupName={title}
              />
            }
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          <JumpToLatestButton
            visible={showJump && messages.length > 0}
            unreadCount={unread}
            mentioned={mentionPending}
            onPress={jumpToLatest}
          />

          <Toast toast={toast} onHide={() => setToast(null)} />
        </View>

        <View
          style={{
            paddingBottom: insets.bottom,
            backgroundColor: colors.surface,
          }}
        >
          <Composer
            value={text}
            onChangeText={setText}
            onSend={sendMessage}
            placeholder={`Message ${title}...`}
            me={me}
            onChangeName={changeName}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            inputRef={inputRef}
            members={members}
          />
        </View>
      </KeyboardAvoidingView>

      <MessageActionsSheet
        message={actionTarget}
        actions={actionsFor(actionTarget)}
        onClose={() => setActionTarget(null)}
      />

      <GroupInfoSheet
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={title}
        isGroup={isGroup}
        memberIds={memberIds}
        usersById={usersById}
        messages={messages}
        uid={uid}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.header,
    },
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    dateLabel: {
      alignSelf: 'center',
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 2,
      marginTop: 4,
      marginBottom: 6,
    },
    messagesContent: {
      flexGrow: 1,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 14,
    },
  });
