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
import { useThemedStyles } from '../theme';

/**
 * Details of the open chat: who is in it and how active they are.
 * `memberIds` are uids; `usersById` maps uid → display name.
 */
export default function GroupInfoSheet({
  visible,
  onClose,
  title,
  isGroup,
  memberIds,
  usersById,
  messages,
  uid,
}) {
  const { styles } = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  // Members ranked by how many of the loaded messages they've sent.
  const members = useMemo(() => {
    const counts = new Map();
    for (const m of messages) {
      if (m.localId || !m.uid) continue;
      counts.set(m.uid, (counts.get(m.uid) ?? 0) + 1);
    }
    return memberIds
      .map((id) => ({
        uid: id,
        name: usersById.get(id) ?? 'Unknown user',
        count: counts.get(id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [messages, memberIds, usersById]);

  const delivered = messages.filter((m) => !m.localId).length;

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
                <Avatar name={title} size={64} group={isGroup} />
              </View>
              <Text style={styles.groupName}>{title}</Text>
              <Text style={styles.groupMeta}>
                {isGroup ? 'Group conversation' : 'Direct message'}
              </Text>
            </View>

            <View style={styles.stats}>
              <Stat styles={styles} value={members.length} label="Members" />
              <View style={styles.statDivider} />
              <Stat styles={styles} value={delivered} label="Messages" />
            </View>

            <Text style={styles.sectionLabel}>MEMBERS</Text>
            <View style={styles.card}>
              {members.length === 0 && (
                <Text style={styles.emptyText}>No one has posted yet.</Text>
              )}
              {members.map((member, i) => (
                <View
                  key={member.uid}
                  style={[styles.memberRow, i > 0 && styles.memberDivider]}
                >
                  <Avatar name={member.name} size={36} />
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.name}
                      </Text>
                      {member.uid === uid && (
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
      marginBottom: 10,
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
