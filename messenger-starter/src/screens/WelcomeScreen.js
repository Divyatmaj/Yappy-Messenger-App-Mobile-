import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import Avatar from '../components/Avatar';
import { fetchMessages } from '../api';
import { useThemedStyles, radius } from '../theme';

const MIN_LENGTH = 2;
const MAX_LENGTH = 20;
const MAX_SUGGESTIONS = 6;

export function validateName(raw) {
  const name = raw.trim();
  if (name.length < MIN_LENGTH) {
    return `Name must be at least ${MIN_LENGTH} characters`;
  }
  if (name.length > MAX_LENGTH) {
    return `Name must be at most ${MAX_LENGTH} characters`;
  }
  return null;
}

export default function WelcomeScreen({ initialName = '', onJoin }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const [recentNames, setRecentNames] = useState([]);

  // Offer people who already posted as one-tap suggestions.
  useEffect(() => {
    let cancelled = false;
    fetchMessages()
      .then((messages) => {
        if (cancelled) return;
        const seen = [];
        for (let i = messages.length - 1; i >= 0; i--) {
          const user = messages[i].user?.trim();
          if (user && !seen.includes(user)) seen.push(user);
          if (seen.length >= MAX_SUGGESTIONS) break;
        }
        setRecentNames(seen);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const error = validateName(name);
  const showError = touched && error;

  const join = (value = name) => {
    setTouched(true);
    if (validateName(value)) return;
    onJoin(value.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>Y</Text>
            </View>
            <Text style={styles.title}>Yappy</Text>
            <Text style={styles.subtitle}>
              Join the Scalar group and chat with your people.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>What should we call you?</Text>

            <View style={[styles.inputRow, showError && styles.inputError]}>
              {name.trim().length > 0 && <Avatar name={name} size={30} />}
              <TextInput
                style={styles.input}
                placeholder="Your display name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                onBlur={() => setTouched(true)}
                onSubmitEditing={() => join()}
                maxLength={MAX_LENGTH}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="go"
              />
            </View>

            <Text style={[styles.hint, showError && styles.errorText]}>
              {showError ? error : `${MIN_LENGTH}–${MAX_LENGTH} characters`}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                error && styles.buttonDisabled,
                pressed && !error && styles.buttonPressed,
              ]}
              onPress={() => join()}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Join chat</Text>
            </Pressable>

            {recentNames.length > 0 && (
              <View style={styles.recent}>
                <Text style={styles.recentLabel}>OR CONTINUE AS</Text>
                <View style={styles.chips}>
                  {recentNames.map((user) => (
                    <Pressable
                      key={user}
                      style={({ pressed }) => [
                        styles.chip,
                        pressed && styles.chipPressed,
                      ]}
                      onPress={() => join(user)}
                    >
                      <Avatar name={user} size={22} />
                      <Text style={styles.chipText} numberOfLines={1}>
                        {user}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.header,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 28,
    },
    logo: {
      width: 76,
      height: 76,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      transform: [{ rotate: '-6deg' }],
    },
    logoText: {
      color: colors.onPrimary,
      fontSize: 38,
      fontWeight: 'bold',
    },
    title: {
      color: colors.onPrimary,
      fontSize: 32,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    subtitle: {
      color: colors.headerSubtle,
      fontSize: 15,
      marginTop: 8,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 22,
    },
    label: {
      color: colors.textStrong,
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 12,
      minHeight: 52,
    },
    inputError: {
      borderColor: colors.danger,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textStrong,
      paddingVertical: 12,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
    },
    errorText: {
      color: colors.danger,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 18,
    },
    buttonDisabled: {
      backgroundColor: colors.primaryDisabled,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    recent: {
      marginTop: 22,
    },
    recentLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 2,
      marginBottom: 10,
      textAlign: 'center',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: 5,
      paddingRight: 12,
      paddingVertical: 5,
      maxWidth: 160,
    },
    chipPressed: {
      backgroundColor: colors.border,
    },
    chipText: {
      color: colors.textStrong,
      fontSize: 13,
      fontWeight: '600',
      flexShrink: 1,
    },
  });
