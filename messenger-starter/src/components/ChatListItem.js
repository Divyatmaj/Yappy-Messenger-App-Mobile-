import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { formatChatTime } from '../utils/time';
import { useThemedStyles } from '../theme';

export default function ChatListItem({ chat, title, uid, unread, onPress }) {
  const { styles } = useThemedStyles(makeStyles);
  const last = chat.lastMessage;
  const isGroup = chat.type === 'group';

  let preview = isGroup ? `${chat.members.length} members` : 'Say hi 👋';
  if (last) {
    const sender =
      last.uid === uid ? 'You' : isGroup ? last.user : null;
    preview = sender ? `${sender}: ${last.text}` : last.text;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${unread ? ', unread messages' : ''}`}
    >
      <Avatar name={title} size={50} group={isGroup} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text
            style={[styles.title, unread && styles.unreadText]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.time, unread && styles.unreadTime]}>
            {formatChatTime(last?.createdAt ?? chat.updatedAt)}
          </Text>
        </View>
        <View style={styles.bottomLine}>
          <Text
            style={[styles.preview, unread && styles.unreadPreview]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {unread && <View style={styles.dot} />}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: colors.background,
    },
    pressed: {
      backgroundColor: colors.surfaceMuted,
    },
    body: {
      flex: 1,
      marginLeft: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 11,
      marginBottom: -11,
    },
    topLine: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      color: colors.textStrong,
      fontSize: 16,
      fontWeight: '600',
    },
    time: {
      color: colors.textMuted,
      fontSize: 12,
      marginLeft: 8,
    },
    bottomLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    preview: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 14,
    },
    unreadText: {
      fontWeight: 'bold',
    },
    unreadTime: {
      color: colors.primary,
      fontWeight: '600',
    },
    unreadPreview: {
      color: colors.text,
      fontWeight: '500',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
  });
