import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, colorForUser } from '../theme';

export default function Avatar({ name, size = 32 }) {
  const { styles, isDark } = useThemedStyles(makeStyles);
  const { bg, fg } = colorForUser(name, isDark);
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
