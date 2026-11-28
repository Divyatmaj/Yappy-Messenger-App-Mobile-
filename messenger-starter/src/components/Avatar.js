import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, colorForUser } from '../theme';

/** Colored initial for a person; `group` uses the app's primary color. */
export default function Avatar({ name, size = 32, group = false }) {
  const { styles, isDark, colors } = useThemedStyles(makeStyles);
  const { bg, fg } = group
    ? { bg: colors.primary, fg: colors.onPrimary }
    : colorForUser(name, isDark);
  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size * 0.38,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.text, { color: fg, fontSize: size * 0.44 }]}>
        {initial}
      </Text>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontWeight: 'bold',
    },
  });
