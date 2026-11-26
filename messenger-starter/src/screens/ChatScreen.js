import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatHeader from '../components/ChatHeader';
import Composer from '../components/Composer';
import MessageBubble from '../components/MessageBubble';
import { fetchMessages, messageKey, postMessage } from '../api';
import { colors } from '../theme';

const POLL_INTERVAL_MS = 2000;
const GROUP_NAME = 'Scalar';

export default function ChatScreen({ me }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await fetchMessages());
    } catch (error) {
      console.log('Error loading messages:', error);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      await postMessage(me, trimmed);
      setText('');
      await loadMessages();
    } catch (error) {
      console.log('Error sending message:', error);
    }
  };

  // Keep the newest message in view when new ones arrive.
  const previousCount = useRef(0);
  useEffect(() => {
    if (messages.length > previousCount.current) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: previousCount.current > 0 })
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

        <FlatList
          ref={listRef}
          style={styles.flex}
          data={messages}
          keyExtractor={messageKey}
          renderItem={renderItem}
          ListHeaderComponent={
            <Text style={styles.dateLabel}>MESSAGES</Text>
          }
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.surface }}>
          <Composer
            value={text}
            onChangeText={setText}
            onSend={sendMessage}
            placeholder={`Message ${GROUP_NAME}...`}
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
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },
});
