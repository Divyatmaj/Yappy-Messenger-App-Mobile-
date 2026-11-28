import AsyncStorage from '@react-native-async-storage/async-storage';

// Every persisted value lives under one prefix so it is easy to find and
// clear. Add new keys here (e.g. a push token or notification settings)
// rather than calling AsyncStorage directly elsewhere.
const PREFIX = '@yappy/';

export const KEYS = {
  displayName: 'displayName',
  themeMode: 'themeMode',
  // Per chat: use chatKey(KEYS.messageCache, chatId) etc.
  messageCache: 'messageCache',
  lastRead: 'lastRead',
  // { [chatId]: millis of the newest message you've seen }
  readMarks: 'readMarks',
  chatList: 'chatList',
};

/** Storage key for a per-chat value, e.g. chatKey(KEYS.lastRead, id). */
export const chatKey = (base, chatId) => `${base}/${chatId}`;

/** Reads a JSON value, returning `fallback` when missing or unreadable. */
export async function load(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.log(`Error reading ${key}:`, error);
    return fallback;
  }
}

/** Writes a JSON value; `null`/`undefined` removes it. Never throws. */
export async function save(key, value) {
  try {
    if (value == null) {
      await AsyncStorage.removeItem(PREFIX + key);
    } else {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    }
  } catch (error) {
    console.log(`Error writing ${key}:`, error);
  }
}
