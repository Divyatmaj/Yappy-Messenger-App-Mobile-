import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemedStyles } from '../theme';

export default function SearchBar({
  query,
  onChangeQuery,
  matchCount,
  currentMatch,
  onPrevious,
  onNext,
  onClose,
}) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const hasQuery = query.trim().length > 0;
  const hasMatches = matchCount > 0;

  return (
    <View style={styles.bar}>
      <View style={styles.inputWrap}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search messages or people"
          placeholderTextColor={colors.headerSubtle}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onPrevious}
        />
        {hasQuery && (
          <Text style={styles.count}>
            {hasMatches ? `${currentMatch + 1} of ${matchCount}` : 'No results'}
          </Text>
        )}
      </View>

      <Pressable
        style={styles.navButton}
        onPress={onPrevious}
        disabled={!hasMatches}
        hitSlop={6}
        accessibilityLabel="Previous (older) match"
      >
        <Text style={[styles.navText, !hasMatches && styles.disabled]}>▲</Text>
      </Pressable>
      <Pressable
        style={styles.navButton}
        onPress={onNext}
        disabled={!hasMatches}
        hitSlop={6}
        accessibilityLabel="Next (newer) match"
      >
        <Text style={[styles.navText, !hasMatches && styles.disabled]}>▼</Text>
      </Pressable>

      <Pressable onPress={onClose} hitSlop={8} style={styles.close}>
        <Text style={styles.closeText}>Done</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    bar: {
      backgroundColor: colors.header,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 13,
      minHeight: 78,
      zIndex: 1,
    },
    inputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 44,
    },
    icon: {
      color: colors.headerSubtle,
      fontSize: 14,
      marginRight: 8,
    },
    input: {
      flex: 1,
      color: colors.onPrimary,
      fontSize: 15,
      paddingVertical: 0,
    },
    count: {
      color: colors.headerSubtle,
      fontSize: 12,
      marginLeft: 6,
    },
    navButton: {
      width: 32,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navText: {
      color: colors.onPrimary,
      fontSize: 13,
    },
    disabled: {
      opacity: 0.35,
    },
    close: {
      paddingLeft: 6,
    },
    closeText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
  });
