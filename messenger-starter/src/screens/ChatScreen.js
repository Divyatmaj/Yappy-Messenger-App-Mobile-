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
import SearchBar from '../components/SearchBar';
import Toast from '../components/Toast';
import useMessages from '../hooks/useMessages';
import { messageKey } from '../api';
import {
  longPressFeedback,
  successFeedback,
  tapFeedback,
} from '../haptics';
import { composeReply, isQuotedMessage, parseReply } from '../utils/reply';
import { useThemedStyles } from '../theme';

const GROUP_NAME = 'Scalar';
// How close (in px) to the bottom still counts as "reading the latest".
const NEAR_BOTTOM_PX = 80;
// How long a message stays outlined after jumping to it from a reply.
const FLASH_MS = 1600;

let toastCounter = 0;

function matchesQuery(message, q) {
  return (
    (message.text ?? '').toLowerCase().includes(q) ||
    (message.user ?? '').toLowerCase().includes(q)
  );
}

export default function ChatScreen({ me, onChangeName }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const {
    messages,
    loaded,
    online,
    fromCache,
    send,
    retry,
    discard,
    refresh,
  } = useMessages(me);
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
    if (isNear) setUnread(0);
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
    } else if (sentByMe || (nearBottom.current && !searching)) {
      scrollToLatest(true);
    } else {
      const fromOthers = messages
        .slice(-added)
        .filter((m) => m.user !== me).length;
      setUnread((n) => n + fromOthers);
    }
  }, [messages, me, searching, scrollToLatest]);

  const jumpToLatest = () => {
    setUnread(0);
    scrollToLatest(true);
  };

  // Tapping a quote scrolls to the newest earlier message it matches.
  const flashTimer = useRef(null);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const jumpToQuoted = (index) => {
    const { quote } = parseReply(messages[index]?.text);
    for (let i = index - 1; i >= 0; i--) {
      if (isQuotedMessage(quote, messages[i])) {
        listRef.current?.scrollToIndex({
          index: i,
          viewPosition: 0.5,
          animated: true,
        });
        setFlashIndex(i);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlashIndex(-1), FLASH_MS);
        return;
      }
    }
    showToast('Original message is no longer available');
  };

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

  // Everyone who has posted, most recently active first. Used for member
  // counts, @mention highlighting and composer suggestions.
  const members = useMemo(() => {
    const seen = new Set();
    for (let i = messages.length - 1; i >= 0; i--) {
      const user = messages[i].user?.trim();
      if (user) seen.add(user);
    }
    return [...seen];
  }, [messages]);

  const renderItem = ({ item, index }) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    return (
      <MessageBubble
        message={item}
        me={me}
        members={members}
        isMine={item.user === me}
        isFirstInGroup={!prev || prev.user !== item.user}
        isLastInGroup={!next || next.user !== item.user}
        onRetry={() => retry(item.localId)}
        onDiscard={() => discard(item.localId)}
        onLongPress={() => openActions(item)}
        onQuotePress={() => jumpToQuoted(index)}
        query={normalizedQuery}
        isActiveMatch={index === activeIndex || index === flashIndex}
      />
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
            title={GROUP_NAME}
            subtitle={
              fromCache && online
                ? 'Updating…'
                : `${members.length || 'No'} member${
                    members.length === 1 ? '' : 's'
                  } · Group conversation`
            }
            onSearchPress={() => setSearching(true)}
            onMenuPress={() => setInfoOpen(true)}
          />
        )}

        <ConnectionBanner
          visible={!online}
          showingSaved={fromCache}
          onRetry={refresh}
        />

        <View style={styles.flex}>
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={messages}
            extraData={`${normalizedQuery}|${activeIndex}|${flashIndex}`}
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
              <ChatPlaceholder loading={!loaded} groupName={GROUP_NAME} />
            }
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          <JumpToLatestButton
            visible={showJump && messages.length > 0}
            unreadCount={unread}
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
            placeholder={`Message ${GROUP_NAME}...`}
            me={me}
            onChangeName={onChangeName}
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
        groupName={GROUP_NAME}
        messages={messages}
        me={me}
        onChangeName={onChangeName}
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
