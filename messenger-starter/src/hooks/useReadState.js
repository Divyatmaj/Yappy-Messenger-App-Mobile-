import { useCallback, useEffect, useRef, useState } from 'react';
import { messageKey } from '../api';
import { KEYS, load, save } from '../storage';

/**
 * Remembers the last message you have seen, across launches.
 *
 * - `dividerKey`: key of the first unread message from someone else when
 *   the conversation was opened, used to draw a "New messages" divider.
 *   It stays put for the session (until `clearDivider`) so it doesn't jump
 *   around while you read.
 * - `unreadAtOpen`: how many messages from others were unread at that time.
 * - `ready`: true once the above has been worked out after the first
 *   server response; nothing is marked read before that.
 * - `markRead()`: call when the user is looking at the latest message.
 *
 * The saved value is `{ key, count }`: the key finds the message again if
 * the server provides ids; the count is a fallback when it doesn't.
 */
export default function useReadState(messages, me, loaded) {
  const [stored, setStored] = useState(undefined); // undefined = loading
  const [dividerKey, setDividerKey] = useState(null);
  const [unreadAtOpen, setUnreadAtOpen] = useState(0);
  const [ready, setReady] = useState(false);
  const computed = useRef(false);
  const lastSaved = useRef(null);

  useEffect(() => {
    load(KEYS.lastRead).then((value) => {
      lastSaved.current = value?.key ?? null;
      setStored(value ?? null);
    });
  }, []);

  const serverCount = messages.filter((m) => !m.localId).length;

  // Work out where the unread messages start, once, after the first
  // successful server response.
  useEffect(() => {
    if (computed.current || !loaded || stored === undefined) return;
    computed.current = true;
    setReady(true);
    if (!stored) return; // first launch: nothing counts as unread

    let lastReadIndex = -1;
    for (let i = serverCount - 1; i >= 0; i--) {
      if (messageKey(messages[i], i) === stored.key) {
        lastReadIndex = i;
        break;
      }
    }
    if (lastReadIndex === -1) {
      lastReadIndex = Math.min(stored.count, serverCount) - 1;
    }

    let firstUnread = -1;
    let count = 0;
    for (let i = lastReadIndex + 1; i < serverCount; i++) {
      if (messages[i].user === me) continue;
      if (firstUnread === -1) firstUnread = i;
      count++;
    }
    if (firstUnread !== -1) {
      setDividerKey(messageKey(messages[firstUnread], firstUnread));
      setUnreadAtOpen(count);
    }
  }, [loaded, stored, messages, serverCount, me]);

  const markRead = useCallback(() => {
    if (!computed.current || serverCount === 0) return;
    const index = serverCount - 1;
    const key = messageKey(messages[index], index);
    if (key === lastSaved.current) return;
    lastSaved.current = key;
    save(KEYS.lastRead, { key, count: serverCount });
  }, [messages, serverCount]);

  const clearDivider = useCallback(() => setDividerKey(null), []);

  return { dividerKey, unreadAtOpen, ready, markRead, clearDivider };
}
