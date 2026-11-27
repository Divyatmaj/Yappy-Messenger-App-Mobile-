import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import HighlightedText from './HighlightedText';
import { parseReply } from '../utils/reply';
import { useThemedStyles, colorForUser, radius } from '../theme';

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
  onLongPress,
  onQuotePress,
  query = '',
  isActiveMatch = false,
}) {
  const { styles, isDark } = useThemedStyles(makeStyles);
  const { status } = message;
  const failed = status === 'failed';
  const { quote, body } = parseReply(message.text);

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

        <Pressable
          onLongPress={onLongPress}
          delayLongPress={280}
          accessibilityHint="Long press for reply and copy"
          style={({ pressed }) => [
            styles.bubble,
            isMine ? styles.mine : styles.others,
            isMine && !isLastInGroup && styles.mineContinued,
            status === 'sending' && styles.sending,
            failed && styles.failed,
            !isMine && !isLastInGroup && styles.othersContinued,
            isActiveMatch && styles.activeMatch,
            pressed && styles.pressed,
          ]}
        >
          {!isMine && isFirstInGroup && (
            <HighlightedText
              text={message.user}
              query={query}
              style={[
                styles.sender,
                { color: colorForUser(message.user, isDark).fg },
              ]}
              highlightStyle={styles.highlight}
            />
          )}

          {quote && (
            <Pressable
              onPress={onQuotePress}
              style={[
                styles.quote,
                isMine ? styles.myQuote : styles.otherQuote,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Reply to ${quote.user}. Show original`}
            >
              <Text
                style={[
                  styles.quoteUser,
                  isMine
                    ? styles.myText
                    : { color: colorForUser(quote.user, isDark).fg },
                ]}
                numberOfLines={1}
              >
                {quote.user}
              </Text>
              <Text
                style={[styles.quoteText, isMine && styles.myQuoteText]}
                numberOfLines={2}
              >
                {quote.snippet}
              </Text>
            </Pressable>
          )}

          <HighlightedText
            text={body}
            query={query}
            style={[styles.text, isMine && styles.myText]}
            highlightStyle={styles.highlight}
          />
        </Pressable>
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

const makeStyles = (colors) =>
  StyleSheet.create({
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
      borderColor: colors.activeMatch,
    },
    pressed: {
      opacity: 0.85,
    },
    quote: {
      borderLeftWidth: 3,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginBottom: 6,
      marginTop: 2,
    },
    myQuote: {
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderLeftColor: 'rgba(255,255,255,0.7)',
    },
    otherQuote: {
      backgroundColor: colors.surfaceMuted,
      borderLeftColor: colors.primary,
    },
    quoteUser: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    quoteText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 1,
    },
    myQuoteText: {
      color: 'rgba(255,255,255,0.85)',
    },
    highlight: {
      backgroundColor: colors.highlight,
      color: colors.onHighlight,
    },
    sending: {
      opacity: 0.6,
    },
    failed: {
      backgroundColor: colors.danger,
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
      color: colors.danger,
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
