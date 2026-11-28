import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Avatar from './Avatar';
import { useThemedStyles } from '../theme';

/**
 * Searchable list of people.
 * - Single mode (`onPick`): tapping a person picks them.
 * - Multi mode (`selected` + `onToggle`): tapping toggles a checkmark.
 * `header` is rendered above the list (e.g. a "New group" row).
 */
export default function PeoplePicker({
  people,
  onPick,
  selected,
  onToggle,
  header = null,
  emptyText = 'No one else has joined yet.',
}) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const [search, setSearch] = useState('');
  const multi = !!onToggle;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? people.filter((p) => p.name.toLowerCase().includes(q))
      : people;
  }, [people, search]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(person) => person.uid}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder="Search people"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          {header}
          {filtered.length > 0 && (
            <Text style={styles.sectionLabel}>PEOPLE ON YAPPY</Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {search.trim() ? `No one called “${search.trim()}”.` : emptyText}
        </Text>
      }
      renderItem={({ item }) => {
        const checked = multi && selected.has(item.uid);
        return (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => (multi ? onToggle(item.uid) : onPick(item))}
            accessibilityRole={multi ? 'checkbox' : 'button'}
            accessibilityState={multi ? { checked } : undefined}
            accessibilityLabel={item.name}
          >
            <Avatar name={item.name} size={42} />
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {multi && (
              <View style={[styles.check, checked && styles.checkOn]}>
                {checked && <Text style={styles.checkMark}>✓</Text>}
              </View>
            )}
          </Pressable>
        );
      }}
      contentContainerStyle={styles.content}
    />
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    content: {
      paddingBottom: 100,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 6,
      paddingHorizontal: 12,
      height: 44,
    },
    searchIcon: {
      fontSize: 14,
      marginRight: 8,
    },
    search: {
      flex: 1,
      color: colors.textStrong,
      fontSize: 15,
      paddingVertical: 0,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: 'bold',
      letterSpacing: 1.5,
      marginTop: 14,
      marginBottom: 4,
      marginHorizontal: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    pressed: {
      backgroundColor: colors.surfaceMuted,
    },
    name: {
      flex: 1,
      color: colors.textStrong,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 12,
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkMark: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: 'bold',
    },
    empty: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 40,
      marginHorizontal: 30,
    },
  });
