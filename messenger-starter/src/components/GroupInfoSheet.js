import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from './Avatar';
import PeoplePicker from './PeoplePicker';
import { radius, useThemedStyles } from '../theme';

const MAX_GROUP_NAME = 40;

/**
 * Details of the open chat: who is in it and how active they are.
 * `memberIds` are uids; `usersById` maps uid → display name; `people` is
 * the whole directory ({ uid, name }).
 *
 * With `canManage` (private groups) members can add people, rename the
 * group and leave it. The `on…` callbacks return promises.
 * Tapping another member calls `onMessageMember(uid)`.
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
  people = [],
  canManage = false,
  onMessageMember,
  onAddMembers,
  onRename,
  onLeave,
}) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  // 'info' | 'add' | 'rename'
  const [mode, setMode] = useState('info');
  const [toAdd, setToAdd] = useState(() => new Set());
  const [newName, setNewName] = useState(title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Start from the overview every time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setMode('info');
    setToAdd(new Set());
    setError(null);
  }, [visible]);

  const candidates = useMemo(
    () => people.filter((p) => p.uid !== uid && !memberIds.includes(p.uid)),
    [people, uid, memberIds],
  );

  const run = async (action, after) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      after?.();
    } catch (e) {
      console.log('Error updating group:', e);
      setError("Couldn't save the change. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmLeave = () =>
    Alert.alert(`Leave ${title}?`, "You won't get its messages anymore.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => run(onLeave, onClose),
      },
    ]);

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

          {mode === 'add' && (
            <View style={styles.modeContainer}>
              <Text style={styles.modeTitle}>Add people</Text>
              <View style={styles.pickerBox}>
                <PeoplePicker
                  people={candidates}
                  selected={toAdd}
                  onToggle={(id) =>
                    setToAdd((current) => {
                      const next = new Set(current);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  emptyText="Everyone on Yappy is already in this group."
                />
              </View>
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (!toAdd.size || busy) && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                disabled={!toAdd.size || busy}
                onPress={() =>
                  run(() => onAddMembers([...toAdd]), () => setMode('info'))
                }
              >
                {busy ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.buttonText}>
                    {toAdd.size ? `Add ${toAdd.size}` : 'Select people'}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setMode('info')}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Cancel</Text>
              </Pressable>
            </View>
          )}

          {mode === 'rename' && (
            <View style={styles.modeContainer}>
              <Text style={styles.modeTitle}>Rename group</Text>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Group name"
                placeholderTextColor={colors.textMuted}
                maxLength={MAX_GROUP_NAME}
                autoFocus
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.spaced,
                  (!newName.trim() || busy) && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                disabled={!newName.trim() || busy}
                onPress={() =>
                  run(() => onRename(newName.trim()), () => setMode('info'))
                }
              >
                {busy ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setMode('info')}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Cancel</Text>
              </Pressable>
            </View>
          )}

          {mode === 'info' && (
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

              {canManage && (
                <View style={[styles.card, styles.actionsCard]}>
                  <ActionRow
                    styles={styles}
                    icon="➕"
                    label="Add people"
                    onPress={() => setMode('add')}
                  />
                  <ActionRow
                    styles={styles}
                    icon="✏️"
                    label="Rename group"
                    divider
                    onPress={() => {
                      setNewName(title);
                      setMode('rename');
                    }}
                  />
                </View>
              )}

              <Text style={styles.sectionLabel}>MEMBERS</Text>
              <View style={styles.card}>
                {members.length === 0 && (
                  <Text style={styles.emptyText}>No one has posted yet.</Text>
                )}
                {members.map((member, i) => (
                  <Pressable
                    key={member.uid}
                    style={({ pressed }) => [
                      styles.memberRow,
                      i > 0 && styles.memberDivider,
                      pressed && member.uid !== uid && styles.rowPressed,
                    ]}
                    disabled={member.uid === uid || !onMessageMember}
                    onPress={() => {
                      onClose();
                      onMessageMember(member.uid);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Message ${member.name}`}
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
                    {member.uid !== uid && onMessageMember && (
                      <Text style={styles.chevron}>💬</Text>
                    )}
                  </Pressable>
                ))}
              </View>

              {canManage && (
                <Pressable
                  style={({ pressed }) => [
                    styles.leaveButton,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={confirmLeave}
                  disabled={busy}
                >
                  <Text style={styles.leaveText}>Leave group</Text>
                </Pressable>
              )}
              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ActionRow({ styles, icon, label, onPress, divider = false }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        divider && styles.memberDivider,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
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
    rowPressed: {
      opacity: 0.6,
    },
    chevron: {
      fontSize: 16,
      marginLeft: 8,
    },
    actionsCard: {
      marginBottom: 20,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
    },
    actionIcon: {
      width: 30,
      fontSize: 16,
    },
    actionLabel: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    leaveButton: {
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    leaveText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: 'bold',
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 10,
    },
    modeContainer: {
      paddingTop: 4,
    },
    modeTitle: {
      color: colors.textStrong,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 6,
    },
    pickerBox: {
      height: 360,
      marginHorizontal: -20,
      marginBottom: 12,
    },
    nameInput: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      color: colors.textStrong,
      fontSize: 17,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 10,
    },
    spaced: {
      marginTop: 18,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.primaryDisabled,
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
