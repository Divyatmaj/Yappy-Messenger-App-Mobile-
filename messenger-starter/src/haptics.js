import * as Haptics from 'expo-haptics';

// Haptics are a nice-to-have: ignore platforms (e.g. web) that lack them.
const safely = (fn) => {
  try {
    fn().catch(() => {});
  } catch {
    // Native module unavailable.
  }
};

export const tapFeedback = () =>
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

export const longPressFeedback = () =>
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

export const successFeedback = () =>
  safely(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
