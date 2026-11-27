import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * True while the app is in the foreground. Used to pause polling in the
 * background; push notifications can take over that job later.
 */
export default function useAppActive() {
  const [active, setActive] = useState(AppState.currentState !== 'background');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      // 'inactive' (iOS app switcher, incoming call) still counts as active
      // so a quick glance away doesn't stop and restart polling.
      setActive(state !== 'background');
    });
    return () => subscription.remove();
  }, []);

  return active;
}
