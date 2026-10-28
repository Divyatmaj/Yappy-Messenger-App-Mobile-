
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ME = "Newton";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const URL = 'https://messenger-yzgf.onrender.com/';

  const loadMessage = async () => {
    try {
      const response = await fetch(URL + 'messages');

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const res = await response.json();
      setMessages(res);
    } catch (error) {
      console.log('Error loading messages:', error);
    }
  };

  useEffect(() => {
    loadMessage();

    const interval = setInterval(loadMessage, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const response = await fetch(URL + 'messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: ME,
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setText('');
      await loadMessage();
    } catch (error) {
      console.log('Error sending message:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.user === ME;

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.myRow : styles.otherRow,
        ]}
      >
        {!isMine && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.user?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isMine ? styles.mine : styles.others,
          ]}
        >
          {!isMine && (
            <Text style={styles.sender}>{item.user}</Text>
          )}

          <Text
            style={[
              styles.messageText,
              isMine && styles.myMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>S</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.title}>Scalar</Text>

            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>
                Group conversation
              </Text>
            </View>
          </View>

          <View style={styles.headerMenu}>
            <Text style={styles.menuText}>•••</Text>
          </View>
        </View>

        {/* Messages */}
        <View style={styles.chatArea}>
          <Text style={styles.dateLabel}>MESSAGES</Text>

          <FlatList
            data={messages}
            keyExtractor={(item, index) =>
              String(item.id ?? item._id ?? index)
            }
            renderItem={renderItem}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message Scalar..."
              placeholderTextColor="#9299A6"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
            />

            <Pressable
              style={[
                styles.button,
                !text.trim() && styles.buttonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!text.trim()}
            >
              <Text style={styles.buttonText}>↑</Text>
            </Pressable>
          </View>

          <Text style={styles.footerText}>
            Chat with your people ✨
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    backgroundColor: '#252B48',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  headerIconText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5CE0A0',
    marginRight: 6,
  },

  statusText: {
    color: '#C4C9DC',
    fontSize: 12,
  },

  headerMenu: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  menuText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },

  chatArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
  },

  dateLabel: {
    alignSelf: 'center',
    color: '#9299A6',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 16,
  },

  messagesContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },

  myRow: {
    justifyContent: 'flex-end',
  },

  otherRow: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#DCD9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#554BC8',
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },

  mine: {
    backgroundColor: '#6558F5',
    borderBottomRightRadius: 5,
  },

  others: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#E9ECF3',
  },

  sender: {
    color: '#6558F5',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  messageText: {
    color: '#30364B',
    fontSize: 15,
    lineHeight: 21,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  inputContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEDF4',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F9',
    borderRadius: 25,
    paddingLeft: 17,
    paddingRight: 6,
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E6E9F1',
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#252B48',
    paddingVertical: 10,
    maxHeight: 100,
  },

  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6558F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  buttonDisabled: {
    backgroundColor: '#B8B4E8',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: -3,
  },

  footerText: {
    textAlign: 'center',
    color: '#A0A6B5',
    fontSize: 11,
    marginTop: 9,
    marginBottom: 2,
  },
});
