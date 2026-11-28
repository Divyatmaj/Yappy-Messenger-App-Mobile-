import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { useThemedStyles } from '../theme';

export default function ChatHeader({
  title,
  subtitle,
  isGroup = true,
  onBack,
  onSearchPress,
  onMenuPress,
}) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to chats"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.identity}
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel={`${title} info`}
      >
        <View style={styles.icon}>
          <Avatar name={title} size={42} group={isGroup} />
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
      </Pressable>

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
      paddingLeft: 8,
      paddingRight: 14,
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
    back: {
      width: 36,
      height: 40,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: {
      color: colors.onPrimary,
      fontSize: 34,
      lineHeight: 38,
      marginTop: -4,
    },
    identity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 4,
    },
    icon: {
      marginRight: 11,
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 19,
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
