import {
  collection,
  doc,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, ensureSignedIn } from './firebase';
import { makeSnippet } from './utils/reply';

// How many of the latest messages to load per chat. Every chat open reads
// this many documents, so keep it modest on the free Spark plan
// (50k reads/day).
export const MESSAGE_LIMIT = 200;

const messagesRef = (chatId) => collection(db, 'chats', chatId, 'messages');

function toMessage(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    uid: data.uid,
    user: data.user,
    text: data.text,
    createdAt: data.createdAt?.toMillis?.() ?? null,
  };
}

/**
 * Listens to the latest messages of a chat in real time.
 * `onChange(messages, { fromCache })` receives only messages the server has
 * confirmed; our own unsent messages are tracked separately by useMessages.
 * Returns an unsubscribe function.
 */
export function subscribeMessages(chatId, onChange, onError) {
  return onSnapshot(
    query(
      messagesRef(chatId),
      orderBy('createdAt'),
      limitToLast(MESSAGE_LIMIT),
    ),
    { includeMetadataChanges: true },
    (snapshot) => {
      const messages = snapshot.docs
        .filter((d) => !d.metadata.hasPendingWrites)
        .map(toMessage);
      onChange(messages, { fromCache: snapshot.metadata.fromCache });
    },
    onError,
  );
}

/**
 * Saves a message and updates the chat's last-message preview in one
 * atomic batch. Resolves once the server has stored it (while offline,
 * Firestore queues the write and resolves when the connection is back).
 */
export async function postMessage(chatId, user, text) {
  const { uid } = await ensureSignedIn();
  const messageRef = doc(messagesRef(chatId));
  const batch = writeBatch(db);
  batch.set(messageRef, { user, text, uid, createdAt: serverTimestamp() });
  batch.update(doc(db, 'chats', chatId), {
    lastMessage: {
      // Reply body only, flattened to one line, for the chat list.
      text: makeSnippet(text),
      user,
      uid,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return { id: messageRef.id, uid, user, text };
}

export function messageKey(item, index) {
  return String(item.id ?? item._id ?? index);
}
