import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';

const MAX_LENGTH = 2000;

export default function Composer({ value, onChangeText, onSend, placeholder }) {
  const canSend = value.trim().length > 0;
  const nearLimit = value.length > MAX_LENGTH - 200;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
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

      {nearLimit && (
        <Text style={styles.counter}>
          {value.length}/{MAX_LENGTH}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  counter: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    marginRight: 8,
  },
});
