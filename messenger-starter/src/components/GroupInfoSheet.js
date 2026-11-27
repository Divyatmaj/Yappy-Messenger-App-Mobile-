import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from './Avatar';
import { THEME_MODES, useThemedStyles } from '../theme';

const MODE_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

export default function GroupInfoSheet({
  visible,
  onClose,
  groupName,
  messages,
  me,
  onChangeName,
}) {
  const { styles, mode, setMode } = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  // Members ranked by how many delivered messages they've sent.
  const members = useMemo(() => {
    const counts = new Map();
    for (const m of messages) {
      if (m.localId || !m.user) continue;
      counts.set(m.user, (counts.get(m.user) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [messages]);

  const delivered = members.reduce((sum, m) => sum + m.count, 0);

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
          accessibilityLabel="Close group info"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.groupIcon}>
                <Text style={styles.groupIconText}>
                  {groupName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.groupName}>{groupName}</Text>
              <Text style={styles.groupMeta}>Group conversation</Text>
            </View>

            <View style={styles.stats}>
              <Stat styles={styles} value={members.length} label="Members" />
              <View style={styles.statDivider} />
              <Stat styles={styles} value={delivered} label="Messages" />
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

            <Text style={styles.sectionLabel}>MEMBERS</Text>
            <View style={styles.card}>
              {members.length === 0 && (
                <Text style={styles.emptyText}>No one has posted yet.</Text>
              )}
              {members.map((member, i) => (
                <View
                  key={member.name}
                  style={[styles.memberRow, i > 0 && styles.memberDivider]}
                >
                  <Avatar name={member.name} size={36} />
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.name}
                      </Text>
                      {member.name === me && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youText}>You</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberMeta}>
                      {member.count} message{member.count === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                onClose();
                onChangeName?.();
              }}
            >
              <Text style={styles.buttonText}>Change display name</Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ styles, value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
      maxHeight: '85%',
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
    hero: {
      alignItems: 'center',
      marginBottom: 18,
    },
    groupIcon: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    groupIconText: {
      color: colors.onPrimary,
      fontSize: 30,
      fontWeight: 'bold',
    },
    groupName: {
      color: colors.textStrong,
      fontSize: 22,
      fontWeight: 'bold',
    },
    groupMeta: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },
    stats: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      marginBottom: 22,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    statValue: {
      color: colors.textStrong,
      fontSize: 22,
      fontWeight: 'bold',
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      marginBottom: 20,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      paddingVertical: 16,
      textAlign: 'center',
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
    },
    memberDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    memberInfo: {
      flex: 1,
      marginLeft: 12,
    },
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    memberName: {
      color: colors.textStrong,
      fontSize: 15,
      fontWeight: '600',
      flexShrink: 1,
    },
    youBadge: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginLeft: 8,
    },
    youText: {
      color: colors.onPrimary,
      fontSize: 10,
      fontWeight: 'bold',
    },
    memberMeta: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
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
