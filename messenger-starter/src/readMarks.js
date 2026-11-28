import { KEYS, load, save } from './storage';

/**
 * Remembers, per chat, the time of the newest message you've seen, so the
 * chat list can show which chats have unread messages. Kept in memory and
 * saved to storage; listeners are told about every change.
 */
let marks = null;
const listeners = new Set();

export async function loadReadMarks() {
  if (!marks) marks = (await load(KEYS.readMarks, {})) ?? {};
  return marks;
}

export function markChatRead(chatId, at) {
  if (!marks || !at || (marks[chatId] ?? 0) >= at) return;
  marks = { ...marks, [chatId]: at };
  save(KEYS.readMarks, marks);
  listeners.forEach((listener) => listener(marks));
}

export function subscribeReadMarks(listener) {
  listeners.add(listener);
  loadReadMarks().then(listener);
  return () => listeners.delete(listener);
}

/** Whether the chat's last message is from someone else and unseen. */
export function isChatUnread(chat, uid, readMarks) {
  const last = chat.lastMessage;
  if (!last?.createdAt || last.uid === uid) return false;
  return last.createdAt > (readMarks?.[chat.id] ?? 0);
}
