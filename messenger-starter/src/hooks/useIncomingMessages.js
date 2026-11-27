import { useEffect, useRef } from 'react';
import { messageKey } from '../api';

/**
 * Calls `onIncoming(newMessages)` when messages from other people arrive
 * from the server. Messages already present when `ready` first turns true
 * (the initial load) are treated as seen and never reported.
 *
 * This is the single place that knows "something new arrived", so in-app
 * toasts today and local/push notification handling later can share it.
 */
export default function useIncomingMessages(messages, me, ready, onIncoming) {
  const seen = useRef(null);
  const callback = useRef(onIncoming);
  callback.current = onIncoming;

  useEffect(() => {
    if (!ready) return;
    const isFirst = seen.current === null;
    if (isFirst) seen.current = new Set();

    const fresh = [];
    messages.forEach((message, index) => {
      if (message.localId) return; // our own optimistic copy
      const key = messageKey(message, index);
      if (seen.current.has(key)) return;
      seen.current.add(key);
      if (!isFirst && message.user !== me) fresh.push({ message, index });
    });

    if (fresh.length) callback.current(fresh);
  }, [messages, me, ready]);
}
