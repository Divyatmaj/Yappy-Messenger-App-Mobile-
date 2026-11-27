import { Linking, Text } from 'react-native';
import { splitByQuery } from './HighlightedText';
import { tokenize } from '../utils/richText';

/**
 * Message text with tappable links, styled @mentions and search
 * highlighting. Mentions of `me` get `mentionMeStyle` on top.
 */
export default function RichText({
  text,
  members = [],
  me,
  query = '',
  style,
  linkStyle,
  mentionStyle,
  mentionMeStyle,
  highlightStyle,
}) {
  const segments = tokenize(text, members);

  const highlight = (value, keyPrefix) =>
    splitByQuery(value, query).map((part, i) =>
      part.match ? (
        <Text key={`${keyPrefix}-${i}`} style={highlightStyle}>
          {part.text}
        </Text>
      ) : (
        part.text
      ),
    );

  return (
    <Text style={style}>
      {segments.map((segment, i) => {
        if (segment.type === 'link') {
          return (
            <Text
              key={i}
              style={linkStyle}
              onPress={() =>
                Linking.openURL(segment.url).catch((error) =>
                  console.log('Error opening link:', error),
                )
              }
              accessibilityRole="link"
            >
              {highlight(segment.text, i)}
            </Text>
          );
        }
        if (segment.type === 'mention') {
          return (
            <Text
              key={i}
              style={[mentionStyle, segment.user === me && mentionMeStyle]}
            >
              {highlight(segment.text, i)}
            </Text>
          );
        }
        return highlight(segment.text, i);
      })}
    </Text>
  );
}
