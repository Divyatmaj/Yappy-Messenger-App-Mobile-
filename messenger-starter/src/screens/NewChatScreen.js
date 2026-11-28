import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import Avatar from '../components/Avatar';
import PeoplePicker from '../components/PeoplePicker';
import { createGroup, openDirectChat } from '../chats';
import { describeFirebaseError } from '../firebase';
import { tapFeedback } from '../haptics';
import { useUsers } from '../hooks/useUsers';
import { useSession } from '../session';
import { radius, useThemedStyles } from '../theme';

const MAX_GROUP_NAME = 40;

/**
 * Start a conversation: tap a person for a one-to-one chat, or tap
 * "New group", pick people and give the group a name.
 */
export default function NewChatScreen({ onBack, onOpenChat }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { uid } = useSession();
  const { users } = useUsers();
  // 'direct' → pick one person; 'pick' → choose group members; 'name'.
  const [step, setStep] = useState('direct');
  const [selected, setSelected] = useState(() => new Set());
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const people = useMemo(
    () => users.filter((u) => u.uid !== uid && u.name),
    [users, uid],
  );
  const selectedPeople = people.filter((p) => selected.has(p.uid));

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const chat = await action();
      tapFeedback();
      onOpenChat(chat);
    } catch (e) {
      console.log('Error starting chat:', e);
      setError(
        describeFirebaseError(e) ?? "Couldn't start the chat. Try again.",
      );
      setBusy(false);
    }
  };

  const toggle = (personId) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });

  const back = () => {
    if (step === 'name') setStep('pick');
    else if (step === 'pick') setStep('direct');
    else onBack();
  };

  // Android back button steps back through the group flow.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        back();
        return true;
      },
    );
    return () => subscription.remove();
  });

  const title = {
    direct: 'New chat',
    pick: 'New group',
    name: 'Group name',
  }[step];
  const subtitle =
    step === 'pick'
      ? selected.size
        ? `${selected.size} selected`
        : 'Add members'
      : step === 'name'
        ? `${selected.size + 1} members`
        : `${people.length} ${people.length === 1 ? 'person' : 'people'}`;
  const trimmedName = groupName.trim();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          onPress={back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {busy && <ActivityIndicator color={colors.onPrimary} />}
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {error && <Text style={styles.error}>{error}</Text>}

        {step === 'direct' && (
          <PeoplePicker
            people={people}
            onPick={(person) =>
              !busy && run(() => openDirectChat(uid, person.uid))
            }
            header={
              <Pressable
                style={({ pressed }) => [
                  styles.newGroup,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => setStep('pick')}
                accessibilityRole="button"
              >
                <View style={styles.newGroupIcon}>
                  <Text style={styles.newGroupIconText}>👥</Text>
                </View>
                <Text style={styles.newGroupText}>New group</Text>
              </Pressable>
            }
            emptyText="No one else has joined yet. Ask a friend to install Yappy!"
          />
        )}

        {step === 'pick' && (
          <>
            <PeoplePicker
              people={people}
              selected={selected}
              onToggle={toggle}
            />
            <View
              style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  !selected.size && styles.buttonDisabled,
                  pressed && selected.size > 0 && styles.buttonPressed,
                ]}
                disabled={!selected.size}
                onPress={() => setStep('name')}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>
                  {selected.size ? `Next · ${selected.size}` : 'Select people'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'name' && (
          <ScrollView
            contentContainerStyle={styles.nameContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.groupPreview}>
              <Avatar name={trimmedName || 'G'} size={72} group />
            </View>
            <TextInput
              style={styles.nameInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name"
              placeholderTextColor={colors.textMuted}
              maxLength={MAX_GROUP_NAME}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() =>
                trimmedName &&
                !busy &&
                run(() => createGroup(uid, trimmedName, [...selected]))
              }
            />
            <Text style={styles.hint}>
              {trimmedName.length}/{MAX_GROUP_NAME}
            </Text>

            <Text style={styles.sectionLabel}>MEMBERS</Text>
            <View style={styles.chips}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>You</Text>
              </View>
              {selectedPeople.map((person) => (
                <View key={person.uid} style={styles.chip}>
                  <Avatar name={person.name} size={20} />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {person.name}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!trimmedName || busy) && styles.buttonDisabled,
                pressed && trimmedName && styles.buttonPressed,
              ]}
              disabled={!trimmedName || busy}
              onPress={() =>
                run(() => createGroup(uid, trimmedName, [...selected]))
              }
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Create group</Text>
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.header,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
      paddingRight: 16,
      paddingVertical: 14,
    },
    back: {
      width: 36,
      height: 40,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    backText: {
      color: colors.onPrimary,
      fontSize: 34,
      lineHeight: 38,
      marginTop: -4,
    },
    headerText: {
      flex: 1,
      marginLeft: 6,
    },
    title: {
      color: colors.onPrimary,
      fontSize: 20,
      fontWeight: 'bold',
    },
    subtitle: {
      color: colors.headerSubtle,
      fontSize: 12,
      marginTop: 2,
    },
    body: {
      flex: 1,
      backgroundColor: colors.background,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 10,
      marginHorizontal: 20,
    },
    newGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginTop: 6,
    },
    rowPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    newGroupIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newGroupIconText: {
      fontSize: 18,
    },
    newGroupText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 12,
    },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: 15,
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
      fontSize: 16,
      fontWeight: 'bold',
    },
    nameContent: {
      padding: 20,
    },
    groupPreview: {
      alignItems: 'center',
      marginVertical: 12,
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
    },
    hint: {
      color: colors.textMuted,
      fontSize: 12,
      alignSelf: 'flex-end',
      marginTop: 5,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: 'bold',
      letterSpacing: 1.5,
      marginTop: 18,
      marginBottom: 8,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 26,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
      maxWidth: 170,
    },
    chipText: {
      color: colors.textStrong,
      fontSize: 13,
      fontWeight: '600',
      flexShrink: 1,
    },
  });
