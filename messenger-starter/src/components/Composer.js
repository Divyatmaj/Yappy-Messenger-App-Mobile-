import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MentionSuggestions from './MentionSuggestions';
import { makeSnippet } from '../utils/reply';
import { findMentionQuery, suggestMembers } from '../utils/richText';
import { useThemedStyles, radius } from '../theme';

const MAX_LENGTH = 2000;

export default function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
  me,
  onChangeName,
  replyTo,
  onCancelReply,
  inputRef,
  members = [],
}) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const canSend = value.trim().length > 0;
  const nearLimit = value.length > MAX_LENGTH - 200;

  // ---- @mention autocomplete ----------------------------------------------
  const [cursor, setCursor] = useState(0);
  // Position of an "@" whose suggestions were used or dismissed, so they
  // don't pop up again for the mention that was just inserted.
  const [dismissedAt, setDismissedAt] = useState(-1);
  const mention = findMentionQuery(value, Math.min(cursor, value.length));
  const suggestions =
    mention && mention.start !== dismissedAt
      ? suggestMembers(members, mention.query, me)
      : [];

  const pickMention = (name) => {
    const end = mention.start + 1 + mention.query.length;
    const inserted = `@${name} `;
    onChangeText(value.slice(0, mention.start) + inserted + value.slice(end));
    setDismissedAt(mention.start);
    setCursor(mention.start + inserted.length);
  };

  return (
    <View style={styles.container}>
      {replyTo && (
        <View style={styles.reply}>
          <View style={styles.replyText}>
            <Text style={styles.replyLabel} numberOfLines={1}>
              Replying to{' '}
              <Text style={styles.replyUser}>
                {replyTo.user === me ? 'yourself' : replyTo.user}
              </Text>
            </Text>
            <Text style={styles.replySnippet} numberOfLines={1}>
              {makeSnippet(replyTo.text)}
            </Text>
          </View>
          <Pressable
            onPress={onCancelReply}
            hitSlop={10}
            style={styles.replyClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
          >
            <Text style={styles.replyCloseText}>✕</Text>
          </Pressable>
        </View>
      )}

      <MentionSuggestions names={suggestions} onPick={pickMention} />

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onSelectionChange={({ nativeEvent }) =>
            setCursor(nativeEvent.selection.end)
          }
          multiline
          maxLength={MAX_LENGTH}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canSend && styles.buttonDisabled,
            pressed && canSend && styles.buttonPressed,
          ]}
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.buttonText}>↑</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        {me ? (
          <Text style={styles.identity} numberOfLines={1}>
            Chatting as <Text style={styles.identityName}>{me}</Text>
            {onChangeName && (
              <Text
                style={styles.changeLink}
                onPress={onChangeName}
                accessibilityRole="link"
              >
                {'  ·  Change'}
              </Text>
            )}
          </Text>
        ) : (
          <View />
        )}

        {nearLimit && (
          <Text style={styles.counter}>
            {value.length}/{MAX_LENGTH}
          </Text>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    reply: {
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      paddingVertical: 7,
      paddingLeft: 10,
      paddingRight: 6,
      marginBottom: 8,
    },
    replyText: {
      flex: 1,
    },
    replyLabel: {
      color: colors.textMuted,
      fontSize: 12,
    },
    replyUser: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    replySnippet: {
      color: colors.text,
      fontSize: 13,
      marginTop: 2,
    },
    replyClose: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    replyCloseText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: 'bold',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.pill,
      paddingLeft: 17,
      paddingRight: 6,
      paddingVertical: 6,
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.textStrong,
      paddingTop: 8,
      paddingBottom: 8,
      maxHeight: 110,
    },
    button: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    buttonDisabled: {
      backgroundColor: colors.primaryDisabled,
    },
    buttonPressed: {
      transform: [{ scale: 0.92 }],
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: -2,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 7,
      paddingHorizontal: 8,
    },
    identity: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 11,
    },
    identityName: {
      color: colors.textStrong,
      fontWeight: '600',
    },
    changeLink: {
      color: colors.primary,
      fontWeight: '600',
    },
    counter: {
      color: colors.textMuted,
      fontSize: 11,
      marginLeft: 8,
    },
  });
