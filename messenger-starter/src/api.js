import {
  addDoc,
  collection,
  getDocs,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ensureSignedIn } from './firebase';

// How many of the latest messages to load. Every app open reads this many
// documents, so keep it modest on the free Spark plan (50k reads/day).
export const MESSAGE_LIMIT = 200;

const messagesQuery = (count = MESSAGE_LIMIT) =>
  query(
    collection(db, 'messages'),
    orderBy('createdAt'),
    limitToLast(count),
  );

function toMessage(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    user: data.user,
    text: data.text,
    createdAt: data.createdAt?.toMillis?.() ?? null,
  };
}

/**
 * Listens to the latest messages in real time.
 * `onChange(messages, { fromCache })` receives only messages the server has
 * confirmed; our own unsent messages are tracked separately by useMessages.
 * Returns an unsubscribe function.
 */
export function subscribeMessages(onChange, onError) {
  return onSnapshot(
    messagesQuery(),
    { includeMetadataChanges: true },
    (snapshot) => {
      const messages = snapshot.docs
        .filter((doc) => !doc.metadata.hasPendingWrites)
        .map(toMessage);
      onChange(messages, { fromCache: snapshot.metadata.fromCache });
    },
    onError,
  );
}

/** One-off read of the latest `count` messages. */
export async function fetchRecentMessages(count = 50) {
  await ensureSignedIn();
  const snapshot = await getDocs(messagesQuery(count));
  return snapshot.docs.map(toMessage);
}

/**
 * Saves a message. Resolves once the server has stored it (while offline,
 * Firestore queues the write and resolves when the connection is back).
 */
export async function postMessage(user, text) {
  const firebaseUser = await ensureSignedIn();
  const ref = await addDoc(collection(db, 'messages'), {
    user,
    text,
    uid: firebaseUser.uid,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, user, text };
}

export function messageKey(item, index) {
  return String(item.id ?? item._id ?? index);
}
