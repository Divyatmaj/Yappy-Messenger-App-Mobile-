/**
 * Turns plain message text into segments the UI can style:
 *   { type: 'text', text }
 *   { type: 'link', text, url }
 *   { type: 'mention', text, user }
 *
 * Display names may contain spaces, so mentions are matched against the
 * names of known members (longest first) instead of a simple `@\w+`.
 */

const LINK_RE = /\b(?:https?:\/\/|www\.)[^\s<>]+/gi;
// Punctuation that usually ends a sentence rather than belonging to a URL.
const TRAILING_PUNCT_RE = /[.,!?;:'")\]]+$/;
// Letters, digits and underscore, including accented Latin letters.
const WORD_CHAR_RE = /[A-Za-z0-9_\u00C0-\u024F]/;

export function normalizeUrl(raw) {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function findLinks(text) {
  const links = [];
  for (const match of text.matchAll(LINK_RE)) {
    const raw = match[0].replace(TRAILING_PUNCT_RE, '');
    if (raw.length < 5) continue;
    links.push({ start: match.index, end: match.index + raw.length, raw });
  }
  return links;
}

/** Index ranges of `@Name` mentions of any of `members`. */
function findMentions(text, members) {
  if (!members.length) return [];
  const names = [...members].sort((a, b) => b.length - a.length);
  const lower = text.toLowerCase();
  const mentions = [];

  let at = lower.indexOf('@');
  while (at !== -1) {
    const before = at > 0 ? text[at - 1] : ' ';
    // Skip e-mail addresses like a@b.com.
    if (!WORD_CHAR_RE.test(before)) {
      for (const name of names) {
        const end = at + 1 + name.length;
        if (lower.startsWith(name.toLowerCase(), at + 1)) {
          const after = text[end];
          if (after === undefined || !WORD_CHAR_RE.test(after)) {
            mentions.push({ start: at, end, user: name });
            break;
          }
        }
      }
    }
    at = lower.indexOf('@', at + 1);
  }
  return mentions;
}

export function tokenize(text = '', members = []) {
  const ranges = [
    ...findLinks(text).map((r) => ({
      ...r,
      type: 'link',
      url: normalizeUrl(r.raw),
    })),
    ...findMentions(text, members).map((r) => ({ ...r, type: 'mention' })),
  ].sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue; // overlaps an earlier range
    if (range.start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, range.start) });
    }
    const piece = text.slice(range.start, range.end);
    segments.push(
      range.type === 'link'
        ? { type: 'link', text: piece, url: range.url }
        : { type: 'mention', text: piece, user: range.user },
    );
    cursor = range.end;
  }
  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) });
  }
  return segments;
}

/** Whether `text` @mentions `user` (case-insensitive). */
export function mentionsUser(text = '', user = '') {
  if (!user) return false;
  return findMentions(text, [user]).length > 0;
}

// ---- Emoji-only messages ---------------------------------------------------

let EMOJI_ONLY_RE = null;
let PICTOGRAPH_RE = null;
try {
  EMOJI_ONLY_RE = new RegExp(
    '^(?:\\p{Extended_Pictographic}|[\\u{1F3FB}-\\u{1F3FF}]|' +
      '[\\u{1F1E6}-\\u{1F1FF}]|\\u200D|\\uFE0F|\\u20E3|\\s)+$',
    'u',
  );
  PICTOGRAPH_RE = new RegExp(
    '\\p{Extended_Pictographic}|[\\u{1F1E6}-\\u{1F1FF}]{2}',
    'gu',
  );
} catch {
  // Engine without Unicode property escapes: just never enlarge emoji.
}

const MAX_BIG_EMOJI = 3;

/** True for short messages made only of emoji, e.g. "🎉" or "😂😂". */
export function isEmojiOnly(text = '') {
  if (!EMOJI_ONLY_RE || !text.trim() || !EMOJI_ONLY_RE.test(text)) {
    return false;
  }
  const count = text.match(PICTOGRAPH_RE)?.length ?? 0;
  return count > 0 && count <= MAX_BIG_EMOJI;
}

// ---- Composer autocomplete -------------------------------------------------

/**
 * If the cursor sits right after "@partial", returns { start, query } so
 * suggestions can be shown; otherwise null.
 */
export function findMentionQuery(text, cursor) {
  const upToCursor = text.slice(0, cursor);
  const at = upToCursor.lastIndexOf('@');
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(upToCursor[at - 1])) return null;
  const query = upToCursor.slice(at + 1);
  if (query.length > 20 || query.includes('\n') || query.startsWith(' ')) {
    return null;
  }
  return { start: at, query };
}

/** Members whose names start with `query`, best matches first. */
export function suggestMembers(members, query, exclude, limit = 5) {
  const q = query.toLowerCase();
  return members
    .filter((name) => name !== exclude && name.toLowerCase().startsWith(q))
    .slice(0, limit);
}
