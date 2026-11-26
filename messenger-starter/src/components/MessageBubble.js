import { StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
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
}) {
  return (
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
          !isMine && !isLastInGroup && styles.othersContinued,
        ]}
      >
        {!isMine && isFirstInGroup && (
          <Text
            style={[styles.sender, { color: colorForUser(message.user).fg }]}
          >
            {message.user}
          </Text>
        )}

        <Text style={[styles.text, isMine && styles.myText]}>
          {message.text}
        </Text>
      </View>
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
