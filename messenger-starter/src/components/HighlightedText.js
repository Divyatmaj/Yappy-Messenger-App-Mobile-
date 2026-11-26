import { Text } from 'react-native';

/** Splits `text` into plain and highlighted runs for a case-insensitive `query`. */
export function splitByQuery(text = '', query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, match: false }];

  const parts = [];
  const lower = text.toLowerCase();
  let start = 0;
  let index = lower.indexOf(q);
  while (index !== -1) {
    if (index > start)
      parts.push({ text: text.slice(start, index), match: false });
    parts.push({ text: text.slice(index, index + q.length), match: true });
    start = index + q.length;
    index = lower.indexOf(q, start);
  }
  if (start < text.length)
    parts.push({ text: text.slice(start), match: false });
  return parts;
}

export default function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
}) {
  const parts = splitByQuery(text, query);
  if (parts.length === 1 && !parts[0].match) {
    return <Text style={style}>{text}</Text>;
  }
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.match ? (
          <Text key={i} style={highlightStyle}>
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
}
