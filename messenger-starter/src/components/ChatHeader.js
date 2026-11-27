import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme';

export default function ChatHeader({
  title,
  subtitle,
  onSearchPress,
  onMenuPress,
}) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={styles.header}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{title.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.statusRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>{subtitle}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        onPress={onSearchPress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Search messages"
      >
        <Text style={styles.searchIcon}>🔍</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        onPress={onMenuPress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Group info and settings"
      >
        <Text style={styles.menuText}>•••</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.header,
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      zIndex: 1,
    },
    icon: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },
    iconText: {
      fontSize: 23,
      fontWeight: 'bold',
      color: colors.onPrimary,
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 21,
      fontWeight: 'bold',
      color: colors.onPrimary,
      letterSpacing: 0.4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    onlineDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.online,
      marginRight: 6,
    },
    statusText: {
      color: colors.headerSubtle,
      fontSize: 12,
    },
    action: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    searchIcon: {
      fontSize: 17,
    },
    menuText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
