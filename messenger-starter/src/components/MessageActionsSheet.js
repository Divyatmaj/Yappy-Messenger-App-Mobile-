import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from './Avatar';
import { makeSnippet } from '../utils/reply';
import { useThemedStyles } from '../theme';

/**
 * Bottom sheet shown when a message is long-pressed.
 * `actions` is a list of { key, icon, label, onPress, destructive? }.
 */
export default function MessageActionsSheet({ message, actions, onClose }) {
  const { styles } = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!message}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close message actions"
        />

        {message && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.preview}>
              <Avatar name={message.user} size={30} />
              <View style={styles.previewText}>
                <Text style={styles.previewUser} numberOfLines={1}>
                  {message.user}
                </Text>
                <Text style={styles.previewBody} numberOfLines={2}>
                  {makeSnippet(message.text)}
                </Text>
              </View>
            </View>

            {actions.map((action) => (
              <Pressable
                key={action.key}
                style={({ pressed }) => [
                  styles.action,
                  pressed && styles.actionPressed,
                ]}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                accessibilityRole="button"
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text
                  style={[
                    styles.actionLabel,
                    action.destructive && styles.destructive,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}

            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 12,
      paddingTop: 14,
    },
    preview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
    },
    previewText: {
      flex: 1,
      marginLeft: 10,
    },
    previewUser: {
      color: colors.textStrong,
      fontSize: 13,
      fontWeight: 'bold',
    },
    previewBody: {
      color: colors.text,
      fontSize: 14,
      marginTop: 2,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    actionPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    actionIcon: {
      width: 30,
      fontSize: 18,
    },
    actionLabel: {
      color: colors.textStrong,
      fontSize: 16,
      fontWeight: '500',
    },
    destructive: {
      color: colors.danger,
    },
    cancel: {
      alignItems: 'center',
      paddingVertical: 14,
      marginTop: 4,
    },
    cancelText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },
  });
