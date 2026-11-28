import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from './Avatar';
import { useSession } from '../session';
import { THEME_MODES, useThemedStyles } from '../theme';

const MODE_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

/** App-wide settings: your profile and the theme. */
export default function SettingsSheet({ visible, onClose }) {
  const { styles, mode, setMode } = useThemedStyles(makeStyles);
  const { me, changeName } = useSession();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close settings"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.profile}>
            <Avatar name={me} size={64} />
            <Text style={styles.name}>{me}</Text>
            <Text style={styles.meta}>Your display name</Text>
          </View>

          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <View style={styles.segmented}>
            {THEME_MODES.map((option) => {
              const selected = option === mode;
              return (
                <Pressable
                  key={option}
                  style={[styles.segment, selected && styles.segmentActive]}
                  onPress={() => setMode(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextActive,
                    ]}
                  >
                    {MODE_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              onClose();
              changeName();
            }}
          >
            <Text style={styles.buttonText}>Change display name</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
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
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    profile: {
      alignItems: 'center',
      marginBottom: 22,
    },
    name: {
      color: colors.textStrong,
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 10,
    },
    meta: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: 'bold',
      letterSpacing: 1.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      padding: 4,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: 10,
    },
    segmentActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: colors.onPrimary,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 25,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    closeButton: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    closeText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },
  });
