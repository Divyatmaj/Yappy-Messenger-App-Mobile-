import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../theme';

const VISIBLE_MS = 2200;

/**
 * Small floating notice. Pass a new `toast` object ({ id, text, onPress? })
 * to show it; it fades out by itself and then calls `onHide`.
 */
export default function Toast({ toast, onHide }) {
  const { styles } = useThemedStyles(makeStyles);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.delay(toast.duration ?? VISIBLE_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => finished && onHide?.());
    return () => animation.stop();
    // Restart only for a new toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  if (!toast) return null;

  const translateY = opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <Animated.View
      style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.toast}
        onPress={() => {
          toast.onPress?.();
          onHide?.();
        }}
        disabled={!toast.onPress}
        accessibilityRole={toast.onPress ? 'button' : 'alert'}
      >
        <Text style={styles.text} numberOfLines={2}>
          {toast.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      top: 12,
      left: 24,
      right: 24,
      alignItems: 'center',
      zIndex: 10,
    },
    toast: {
      backgroundColor: colors.textStrong,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxWidth: '100%',
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    text: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
