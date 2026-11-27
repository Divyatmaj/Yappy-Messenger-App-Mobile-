import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme';

export default function JumpToLatestButton({
  visible,
  unreadCount,
  mentioned = false,
  onPress,
}) {
  const { styles } = useThemedStyles(makeStyles);
  if (!visible) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        'Jump to latest',
        unreadCount > 0 && `${unreadCount} new messages`,
        mentioned && 'you were mentioned',
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <Text style={styles.arrow}>↓</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
      {mentioned && (
        <View style={styles.mentionBadge}>
          <Text style={styles.badgeText}>@</Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    button: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    pressed: {
      transform: [{ scale: 0.93 }],
    },
    arrow: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: 'bold',
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    mentionBadge: {
      position: 'absolute',
      top: -6,
      left: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    badgeText: {
      color: colors.onPrimary,
      fontSize: 10,
      fontWeight: 'bold',
    },
  });
