import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme';

/** "New messages" line drawn above the first unread message. */
export default function NewMessagesDivider() {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={styles.line} />
      <Text style={styles.label}>NEW MESSAGES</Text>
      <View style={styles.line} />
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 4,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: colors.primary,
      opacity: 0.5,
    },
    label: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 1.5,
      marginHorizontal: 10,
    },
  });
