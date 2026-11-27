import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { useThemedStyles } from '../theme';

/** List of members shown above the composer while typing "@name". */
export default function MentionSuggestions({ names, onPick }) {
  const { styles } = useThemedStyles(makeStyles);
  if (!names.length) return null;

  return (
    <View style={styles.list} accessibilityLabel="Mention suggestions">
      {names.map((name, i) => (
        <Pressable
          key={name}
          style={({ pressed }) => [
            styles.row,
            i > 0 && styles.divider,
            pressed && styles.pressed,
          ]}
          onPress={() => onPick(name)}
          accessibilityRole="button"
          accessibilityLabel={`Mention ${name}`}
        >
          <Avatar name={name} size={26} />
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    list: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pressed: {
      backgroundColor: colors.surfaceMuted,
    },
    name: {
      flex: 1,
      color: colors.textStrong,
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 10,
    },
  });
