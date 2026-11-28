import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

/** The public group every user joins automatically. */
export const PUBLIC_GROUP_ID = 'scalar';
export const PUBLIC_GROUP_NAME = 'Scalar';

const millis = (timestamp) => timestamp?.toMillis?.() ?? null;

function toChat(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    type: data.type,
    name: data.name ?? null,
    members: data.members ?? [],
    public: data.public === true,
    createdBy: data.createdBy ?? null,
    updatedAt: millis(data.updatedAt) ?? millis(data.createdAt) ?? 0,
    lastMessage: data.lastMessage
      ? {
          text: data.lastMessage.text,
          user: data.lastMessage.user,
          uid: data.lastMessage.uid,
          createdAt: millis(data.lastMessage.createdAt),
        }
      : null,
  };
}

// ---- Users -----------------------------------------------------------------

/** Creates or updates your profile in the `users` directory. */
export function saveProfile(uid, name) {
  return setDoc(
    doc(db, 'users', uid),
    {
      name,
      nameLower: name.toLowerCase(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Live list of everyone who has used the app, sorted by name. */
export function subscribeUsers(onChange, onError) {
  return onSnapshot(
    query(collection(db, 'users'), orderBy('nameLower'), limit(500)),
    (snapshot) =>
      onChange(
        snapshot.docs.map((d) => ({ uid: d.id, name: d.data().name })),
      ),
    onError,
  );
}

// ---- Chats -----------------------------------------------------------------

/** Live list of the chats you're a member of, most recent first. */
export function subscribeMyChats(uid, onChange, onError) {
  // Sorted on the device, so Firestore needs no composite index.
  return onSnapshot(
    query(collection(db, 'chats'), where('members', 'array-contains', uid)),
    (snapshot) =>
      onChange(
        snapshot.docs.map(toChat).sort((a, b) => b.updatedAt - a.updatedAt),
        { fromCache: snapshot.metadata.fromCache },
      ),
    onError,
  );
}

/** Live updates for one chat (name, members, last message). */
export function subscribeChat(chatId, onChange, onError) {
  return onSnapshot(
    doc(db, 'chats', chatId),
    (snapshot) => onChange(snapshot.exists() ? toChat(snapshot) : null),
    onError,
  );
}

/** Makes sure the public group exists and that you are a member. */
export async function joinPublicGroup(uid) {
  const ref = doc(db, 'chats', PUBLIC_GROUP_ID);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    try {
      await setDoc(ref, {
        type: 'group',
        name: PUBLIC_GROUP_NAME,
        public: true,
        members: [uid],
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    } catch {
      // Someone else created it at the same moment: join it below.
    }
  } else if (snapshot.data().members?.includes(uid)) {
    return;
  }
  await updateDoc(ref, { members: arrayUnion(uid) });
}

// ---- Display helpers -------------------------------------------------------

/** For a direct chat, the uid of the other person. */
export function otherMember(chat, uid) {
  return chat.members.find((m) => m !== uid) ?? uid;
}

/** The name to show for a chat: the group name, or the other person's. */
export function chatTitle(chat, uid, usersById) {
  if (!chat) return '';
  if (chat.type === 'direct') {
    return usersById.get(otherMember(chat, uid)) ?? 'Unknown user';
  }
  return chat.name || 'Group';
}
