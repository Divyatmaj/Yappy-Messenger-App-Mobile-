import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMessages, postMessage } from '../api';
import useAppActive from './useAppActive';
import { KEYS, load, save } from '../storage';

const POLL_INTERVAL_MS = 2000;
// Enough history to fill the screen instantly on the next launch.
const CACHE_LIMIT = 200;

let localIdCounter = 0;

/**
 * Loads the conversation, polls for updates and sends messages optimistically.
 *
 * `messages` merges server messages with local ones that are still
 * sending or have failed; local messages carry `localId` and `status`.
 * `loaded` turns true after the first successful response; `online` is
 * false while the most recent request failed. `fromCache` is true while
 * the list shows messages saved on a previous launch and the server has
 * not answered yet.
 *
 * Polling pauses while the app is in the background and refreshes as soon
 * as it comes back to the foreground.
 */
export default function useMessages(me) {
  const [serverMessages, setServerMessages] = useState([]);
  const [pending, setPending] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const appActive = useAppActive();
  const inFlight = useRef(false);
  const lastPayload = useRef('');
  const requestSeq = useRef(0);
  const appliedSeq = useRef(0);

  const refresh = useCallback(async (force = false) => {
    // The backend can be slow to wake up; don't stack polling requests.
    if (inFlight.current && !force) return false;
    inFlight.current = true;
    const seq = ++requestSeq.current;
    try {
      const data = await fetchMessages();
      // Ignore a slow response that was overtaken by a newer one.
      if (seq < appliedSeq.current) return true;
      appliedSeq.current = seq;
      const payload = JSON.stringify(data);
      // Skip re-rendering when nothing changed since the last poll.
      if (payload !== lastPayload.current) {
        lastPayload.current = payload;
        setServerMessages(data);
        save(KEYS.messageCache, data.slice(-CACHE_LIMIT));
      }
      setFromCache(false);
      setLoaded(true);
      setOnline(true);
      return true;
    } catch (error) {
      console.log('Error loading messages:', error);
      setOnline(false);
      return false;
    } finally {
      inFlight.current = false;
    }
  }, []);

  // Show the last saved conversation until the server answers.
  useEffect(() => {
    load(KEYS.messageCache, []).then((cached) => {
      if (appliedSeq.current > 0 || !Array.isArray(cached)) return;
      if (cached.length === 0) return;
      setServerMessages(cached);
      setFromCache(true);
    });
  }, []);

  useEffect(() => {
    if (!appActive) return;
    refresh(true);
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh, appActive]);

  const deliver = useCallback(
    async (localId, text) => {
      setPending((list) =>
        list.map((m) =>
          m.localId === localId ? { ...m, status: 'sending' } : m,
        ),
      );
      try {
        await postMessage(me, text);
        // Wait for the server copy to arrive before dropping the local one,
        // so the bubble doesn't blink out and back in.
        await refresh(true);
        setPending((list) => list.filter((m) => m.localId !== localId));
      } catch (error) {
        console.log('Error sending message:', error);
        setPending((list) =>
          list.map((m) =>
            m.localId === localId ? { ...m, status: 'failed' } : m,
          ),
        );
      }
    },
    [me, refresh],
  );

  const send = useCallback(
    (rawText) => {
      const text = rawText.trim();
      if (!text) return;
      const localId = `local-${++localIdCounter}`;
      setPending((list) => [
        ...list,
        { localId, user: me, text, status: 'sending' },
      ]);
      deliver(localId, text);
    },
    [me, deliver],
  );

  const retry = useCallback(
    (localId) => {
      const message = pending.find((m) => m.localId === localId);
      if (message) deliver(localId, message.text);
    },
    [pending, deliver],
  );

  const discard = useCallback((localId) => {
    setPending((list) => list.filter((m) => m.localId !== localId));
  }, []);

  const messages = useMemo(
    () => [...serverMessages, ...pending],
    [serverMessages, pending],
  );

  const refreshNow = useCallback(() => refresh(true), [refresh]);

  return {
    messages,
    loaded,
    online,
    fromCache,
    send,
    retry,
    discard,
    refresh: refreshNow,
  };
}
