import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import HighlightedText from './HighlightedText';
import { colors, colorForUser, radius } from '../theme';

const AVATAR_SIZE = 32;

/**
 * isFirstInGroup / isLastInGroup describe a run of consecutive messages
 * from the same sender. The sender name shows on the first bubble of a
 * run and the avatar on the last, like most chat apps.
 */
export default function MessageBubble({
  message,
  isMine,
  isFirstInGroup,
  isLastInGroup,
  onRetry,
  onDiscard,
  query = '',
  isActiveMatch = false,
}) {
  const { status } = message;
  const failed = status === 'failed';

  return (
    <View>
      <View
        style={[
          styles.row,
          isMine ? styles.myRow : styles.otherRow,
          isFirstInGroup ? styles.groupStart : styles.groupContinue,
        ]}
      >
        {!isMine &&
          (isLastInGroup ? (
            <View style={styles.avatarSlot}>
              <Avatar name={message.user} size={AVATAR_SIZE} />
            </View>
          ) : (
            <View style={styles.avatarSlot} />
          ))}

        <View
          style={[
            styles.bubble,
            isMine ? styles.mine : styles.others,
            isMine && !isLastInGroup && styles.mineContinued,
            status === 'sending' && styles.sending,
            failed && styles.failed,
            !isMine && !isLastInGroup && styles.othersContinued,
            isActiveMatch && styles.activeMatch,
          ]}
        >
          {!isMine && isFirstInGroup && (
            <HighlightedText
              text={message.user}
              query={query}
              style={[styles.sender, { color: colorForUser(message.user).fg }]}
              highlightStyle={styles.highlight}
            />
          )}

          <HighlightedText
            text={message.text}
            query={query}
            style={[styles.text, isMine && styles.myText]}
            highlightStyle={styles.highlight}
          />
        </View>
      </View>

      {status === 'sending' && <Text style={styles.statusText}>Sending…</Text>}
      {failed && (
        <View style={styles.failedRow}>
          <Text style={[styles.statusText, styles.failedText]}>
            Not sent ·{' '}
          </Text>
          <Pressable onPress={onRetry} hitSlop={6}>
            <Text style={[styles.statusText, styles.action]}>Retry</Text>
          </Pressable>
          <Text style={styles.statusText}> · </Text>
          <Pressable onPress={onDiscard} hitSlop={6}>
            <Text style={[styles.statusText, styles.action]}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  groupStart: {
    marginTop: 10,
  },
  groupContinue: {
    marginTop: 2,
  },
  avatarSlot: {
    width: AVATAR_SIZE,
    marginRight: 8,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.bubble,
  },
  mine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.tail,
  },
  mineContinued: {
    borderBottomRightRadius: radius.bubble,
  },
  others: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.tail,
    borderWidth: 1,
    borderColor: colors.border,
  },
  othersContinued: {
    borderBottomLeftRadius: radius.bubble,
  },
  activeMatch: {
    borderWidth: 2,
    borderColor: '#F5B700',
  },
  highlight: {
    backgroundColor: '#FFE066',
    color: '#30364B',
  },
  sending: {
    opacity: 0.6,
  },
  failed: {
    backgroundColor: '#E5484D',
  },
  statusText: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
    marginRight: 4,
  },
  failedRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  failedText: {
    color: '#E5484D',
    marginRight: 0,
  },
  action: {
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 0,
  },
  sender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  myText: {
    color: colors.onPrimary,
  },
});
