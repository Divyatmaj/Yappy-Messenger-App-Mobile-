import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MESSAGE_LIMIT, postMessage, subscribeMessages } from '../api';
import {
  describeFirebaseError,
  ensureSignedIn,
  isFirebaseConfigured,
} from '../firebase';
import useAppActive from './useAppActive';
import { KEYS, load, save } from '../storage';

let localIdCounter = 0;

/**
 * Keeps the conversation in sync with Firestore in real time and sends
 * messages optimistically.
 *
 * `messages` merges server messages with local ones that are still
 * sending or have failed; local messages carry `localId` and `status`.
 * `loaded` turns true after the first response from the server; `online`
 * is false when the server can't be reached. `fromCache` is true while the
 * list shows messages saved on a previous launch. `problem` is a readable
 * setup error (e.g. Firebase not configured), or null.
 *
 * The listener is paused while the app is in the background and resumes
 * when it returns to the foreground.
 */
export default function useMessages(me) {
  const [serverMessages, setServerMessages] = useState([]);
  const [pending, setPending] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [problem, setProblem] = useState(() =>
    isFirebaseConfigured
      ? null
      : describeFirebaseError({ code: 'not-configured' }),
  );
  const [attempt, setAttempt] = useState(0);
  const appActive = useAppActive();
  const lastPayload = useRef('');
  const gotServerData = useRef(false);

  // Show the last saved conversation until the server answers.
  useEffect(() => {
    load(KEYS.messageCache, []).then((cached) => {
      if (gotServerData.current || !Array.isArray(cached)) return;
      if (cached.length === 0) return;
      setServerMessages(cached);
      setFromCache(true);
    });
  }, []);

  useEffect(() => {
    if (!appActive || !isFirebaseConfigured) return;
    let cancelled = false;
    let unsubscribe = null;

    const fail = (error) => {
      console.log('Error syncing messages:', error);
      if (cancelled) return;
      setOnline(false);
      setProblem(describeFirebaseError(error));
    };

    ensureSignedIn()
      .then(() => {
        if (cancelled) return;
        unsubscribe = subscribeMessages((messages, meta) => {
          // Firestore first answers from its (empty) local cache; only a
          // server answer counts as loaded/online.
          if (meta.fromCache) {
            if (gotServerData.current) setOnline(false);
            return;
          }
          gotServerData.current = true;
          const payload = JSON.stringify(messages);
          // Skip re-rendering when only metadata changed.
          if (payload !== lastPayload.current) {
            lastPayload.current = payload;
            setServerMessages(messages);
            save(KEYS.messageCache, messages.slice(-MESSAGE_LIMIT));
          }
          setFromCache(false);
          setLoaded(true);
          setOnline(true);
          setProblem(null);
        }, fail);
      })
      .catch(fail);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [appActive, attempt]);

  const deliver = useCallback(
    async (localId, text) => {
      setPending((list) =>
        list.map((m) =>
          m.localId === localId ? { ...m, status: 'sending' } : m,
        ),
      );
      try {
        await postMessage(me, text);
        // The listener delivers the stored copy at the same time.
        setPending((list) => list.filter((m) => m.localId !== localId));
      } catch (error) {
        console.log('Error sending message:', error);
        setProblem(describeFirebaseError(error));
        setPending((list) =>
          list.map((m) =>
            m.localId === localId ? { ...m, status: 'failed' } : m,
          ),
        );
      }
    },
    [me],
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

  // Re-create the listener (used by the offline banner's "Retry now").
  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    messages,
    loaded,
    online: online && !problem,
    fromCache,
    problem,
    send,
    retry,
    discard,
    refresh,
  };
}
