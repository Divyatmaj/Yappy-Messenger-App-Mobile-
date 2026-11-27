import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme';

// The free backend host can take a while to wake up after being idle.
const SLOW_LOAD_MS = 4000;

export default function ChatPlaceholder({ loading, groupName }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.title}>Loading messages…</Text>
        {slow && (
          <Text style={styles.body}>
            Waking up the server. This can take up to a minute.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👋</Text>
      <Text style={styles.title}>No messages yet</Text>
      <Text style={styles.body}>Be the first to say hi to {groupName}!</Text>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emoji: {
      fontSize: 44,
    },
    title: {
      color: colors.textStrong,
      fontSize: 17,
      fontWeight: 'bold',
      marginTop: 14,
    },
    body: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 20,
    },
  });
