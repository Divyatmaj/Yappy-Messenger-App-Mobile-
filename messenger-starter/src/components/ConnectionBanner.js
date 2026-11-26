import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ConnectionBanner({ visible, onRetry }) {
  if (!visible) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.dot} />
      <Text style={styles.text}>Can't reach the server. Retrying…</Text>
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text style={styles.action}>Retry now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: '#8A5300',
    fontSize: 13,
  },
  action: {
    color: '#8A5300',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
