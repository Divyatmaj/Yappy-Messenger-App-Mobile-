import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme';

export default function ConnectionBanner({
  visible,
  showingSaved,
  problem,
  onRetry,
}) {
  const { styles } = useThemedStyles(makeStyles);
  if (!visible) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.dot} />
      <Text style={styles.text}>
        {problem ??
          (showingSaved
            ? 'Offline · showing saved messages'
            : "Can't reach the server. Retrying…")}
      </Text>
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text style={styles.action}>Retry now</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warningBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.warningBorder,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.warningDot,
      marginRight: 8,
    },
    text: {
      flex: 1,
      color: colors.warningText,
      fontSize: 13,
    },
    action: {
      color: colors.warningText,
      fontSize: 13,
      fontWeight: 'bold',
    },
  });
