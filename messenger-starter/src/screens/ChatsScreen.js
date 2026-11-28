import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import ChatListItem from '../components/ChatListItem';
import SettingsSheet from '../components/SettingsSheet';
import { chatTitle } from '../chats';
import { useMyChats } from '../hooks/useChats';
import { useUsers } from '../hooks/useUsers';
import { isChatUnread, subscribeReadMarks } from '../readMarks';
import { useSession } from '../session';
import { useThemedStyles } from '../theme';

/** Home screen: every conversation you're in, most recent first. */
export default function ChatsScreen({
  problem: sessionProblem,
  onOpenChat,
  onNewChat,
}) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const { me, uid } = useSession();
  const { usersById } = useUsers();
  const { chats, problem: chatsProblem } = useMyChats(uid);
  const [readMarks, setReadMarks] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const problem = sessionProblem ?? chatsProblem;

  useEffect(() => subscribeReadMarks(setReadMarks), []);

  const unreadCount = (chats ?? []).filter((chat) =>
    isChatUnread(chat, uid, readMarks),
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {unreadCount > 0
              ? `${unreadCount} unread · ${me}`
              : `Chatting as ${me}`}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          onPress={() => setSettingsOpen(true)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.actionText}>⚙︎</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {problem && !chats?.length ? (
          <View style={styles.center}>
            <Text style={styles.emoji}>🛠️</Text>
            <Text style={styles.emptyTitle}>Setup needed</Text>
            <Text style={styles.emptyBody}>{problem}</Text>
          </View>
        ) : chats === null ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyBody}>Loading chats…</Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(chat) => chat.id}
            renderItem={({ item }) => (
              <ChatListItem
                chat={item}
                title={chatTitle(item, uid, usersById)}
                uid={uid}
                unread={isChatUnread(item, uid, readMarks)}
                onPress={() => onOpenChat(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emoji}>💬</Text>
                <Text style={styles.emptyTitle}>No chats yet</Text>
                <Text style={styles.emptyBody}>
                  Tap ＋ to start a chat or create a group.
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}

        {uid && (
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { bottom: insets.bottom + 20 },
              pressed && styles.fabPressed,
            ]}
            onPress={onNewChat}
            accessibilityRole="button"
            accessibilityLabel="New chat"
          >
            <Text style={styles.fabText}>＋</Text>
          </Pressable>
        )}
      </View>

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.header,
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: colors.onPrimary,
      fontSize: 26,
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },
    subtitle: {
      color: colors.headerSubtle,
      fontSize: 13,
      marginTop: 2,
    },
    action: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    actionText: {
      color: colors.onPrimary,
      fontSize: 22,
    },
    body: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      flexGrow: 1,
      paddingTop: 6,
      paddingBottom: 100,
    },
    fab: {
      position: 'absolute',
      right: 20,
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    fabPressed: {
      transform: [{ scale: 0.94 }],
    },
    fabText: {
      color: colors.onPrimary,
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: -2,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emoji: {
      fontSize: 44,
    },
    emptyTitle: {
      color: colors.textStrong,
      fontSize: 17,
      fontWeight: 'bold',
      marginTop: 14,
    },
    emptyBody: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 20,
    },
  });
