import { useEffect, useRef, useState } from 'react';
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
import ConnectionBanner from '../components/ConnectionBanner';
import MessageBubble from '../components/MessageBubble';
import useMessages from '../hooks/useMessages';
import { messageKey } from '../api';
import { colors } from '../theme';

const GROUP_NAME = 'Scalar';

export default function ChatScreen({ me, onChangeName }) {
  const { messages, loaded, online, send, retry, discard, refresh } =
    useMessages(me);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  const sendMessage = () => {
    if (!text.trim()) return;
    send(text);
    setText('');
  };

  // Keep the newest message in view when new ones arrive.
  const previousCount = useRef(0);
  useEffect(() => {
    if (messages.length > previousCount.current) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: previousCount.current > 0 }),
      );
    }
    previousCount.current = messages.length;
  }, [messages.length]);

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
        <ChatHeader
          title={GROUP_NAME}
          subtitle={`${participants.size || 'No'} member${
            participants.size === 1 ? '' : 's'
          } · Group conversation`}
        />

        <ConnectionBanner visible={!online} onRetry={refresh} />

        <FlatList
          ref={listRef}
          style={styles.flex}
          data={messages}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
