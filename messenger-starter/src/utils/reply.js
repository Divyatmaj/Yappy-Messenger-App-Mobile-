/**
 * Replies are encoded in the message text so they work with the plain
 * `{ user, text }` backend and still read naturally in other clients:
 *
 *   > Alex: original message snippet
 *   the reply itself
 */
const QUOTE_PREFIX = '> ';
const SNIPPET_MAX = 80;

/** Splits a message into `{ quote: { user, snippet } | null, body }`. */
export function parseReply(text = '') {
  const plain = { quote: null, body: text };
  if (!text.startsWith(QUOTE_PREFIX)) return plain;

  const newline = text.indexOf('\n');
  if (newline === -1) return plain;

  const line = text.slice(QUOTE_PREFIX.length, newline);
  const separator = line.indexOf(': ');
  const body = text.slice(newline + 1);
  if (separator <= 0 || !body.trim()) return plain;

  return {
    quote: {
      user: line.slice(0, separator),
      snippet: line.slice(separator + 2),
    },
    body,
  };
}

/** One-line preview of a message body (its own quote is left out). */
export function makeSnippet(text = '') {
  const flat = parseReply(text).body.replace(/\s+/g, ' ').trim();
  return flat.length > SNIPPET_MAX
    ? flat.slice(0, SNIPPET_MAX - 1).trimEnd() + '…'
    : flat;
}

/** Builds the text to send when replying to `target` with `body`. */
export function composeReply(target, body) {
  return `${QUOTE_PREFIX}${target.user}: ${makeSnippet(target.text)}\n${body}`;
}

/** Whether `message` is the one `quote` refers to. */
export function isQuotedMessage(quote, message) {
  if (!quote || message.user !== quote.user) return false;
  const prefix = quote.snippet.replace(/…$/, '');
  return parseReply(message.text ?? '')
    .body.replace(/\s+/g, ' ')
    .trim()
    .startsWith(prefix);
}
