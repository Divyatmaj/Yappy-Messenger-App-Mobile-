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
import MessageBubble from '../components/MessageBubble';
import SearchBar from '../components/SearchBar';
import useMessages from '../hooks/useMessages';
import { messageKey } from '../api';
import { useThemedStyles } from '../theme';

const GROUP_NAME = 'Scalar';
// How close (in px) to the bottom still counts as "reading the latest".
const NEAR_BOTTOM_PX = 80;

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
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  const sendMessage = () => {
    if (!text.trim()) return;
    send(text);
    setText('');
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

  const participants = new Set(messages.map((m) => m.user).filter(Boolean));

  const renderItem = ({ item, index }) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    return (
      <MessageBubble
        message={item}
        isMine={item.user === me}
        isFirstInGroup={!prev || prev.user !== item.user}
        isLastInGroup={!next || next.user !== item.user}
        onRetry={() => retry(item.localId)}
        onDiscard={() => discard(item.localId)}
        query={normalizedQuery}
        isActiveMatch={index === activeIndex}
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
                : `${participants.size || 'No'} member${
                    participants.size === 1 ? '' : 's'
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
            extraData={`${normalizedQuery}|${activeIndex}`}
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
          />
        </View>
      </KeyboardAvoidingView>

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
