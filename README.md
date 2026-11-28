# Yappy Messenger

A group messaging mobile app built with Expo and React Native. Pick a display name, join the Scalar group conversation, and chat in real time with a polished light or dark UI.

## Features

### Chatting

- **Welcome screen** – choose a display name (2–20 characters) or continue as a recent participant; change it any time
- **Polished chat UI** – per-user avatar colors, grouped consecutive messages, auto-scroll to the latest message
- **Optimistic sending** – messages appear instantly with a *Sending…* state; failed sends can be retried or deleted
- **Message actions** – long-press any message to reply or copy it (failed messages also offer retry/delete), with haptic feedback
- **Replies** – quoted replies show the original sender and snippet; tap the quote to jump to the original message
- **@mentions** – type `@` to pick a member from suggestions; mentions are highlighted, and messages that mention you get an accent outline
- **Rich text** – links are tappable and open in the browser; messages of 1–3 emoji are shown large without a bubble
- Multiline input with a 2,000-character limit and counter

### Staying up to date

- **Unread tracking** – remembers the last message you saw; next time a *New messages* divider marks where you left off and the chat opens there
- **In-app alerts** – when a message arrives while you're scrolled up, a tappable toast shows who sent it; mentions of you get their own alert that jumps straight to the message
- **Jump to latest** – floating button with an unread counter (and an `@` badge if you were mentioned) when you've scrolled up
- **Search** – find messages or people, with highlighted matches and next/previous navigation
- **Connection awareness** – offline banner with manual retry, loading state for slow server wake-ups, and an empty state
- Automatic refresh every two seconds, without overlapping requests

### Personalization & device

- **Remembers you** – your display name, theme choice and the latest 200 messages are saved on the device, so the app opens straight into the chat and shows saved messages even when offline
- **Dark mode** – follow the system theme or force light/dark from the group info sheet
- **Group info** – member list ranked by message count, plus group stats
- **Battery friendly** – polling pauses while the app is in the background and refreshes as soon as you return
- Keyboard-aware, safe-area-aware layout on iOS and Android

## Tech Stack

- [Expo](https://expo.dev/) SDK 58
- [React Native](https://reactnative.dev/) 0.88 with React 19
- `react-native-safe-area-context` – safe-area insets
- `expo-status-bar` – status bar styling
- `@react-native-async-storage/async-storage` – on-device persistence
- `expo-clipboard` – copying messages
- `expo-haptics` – haptic feedback

All of these work in Expo Go, so no custom native build is needed yet.

## Project Structure

```text
Messenger/
├── README.md
└── messenger-starter/
    ├── App.js                         # Root: restores saved name/theme, welcome/chat switch
    ├── app.json                       # Expo config (name, bundle IDs, deep-link scheme)
    ├── index.js                       # Expo entry point
    ├── package.json                   # Dependencies and scripts
    └── src/
        ├── api.js                     # Backend calls (GET/POST /messages)
        ├── haptics.js                 # Safe haptic feedback helpers
        ├── storage.js                 # AsyncStorage wrapper and persisted keys
        ├── theme.js                   # Light/dark palettes, ThemeProvider, avatar colors
        ├── hooks/
        │   ├── useAppActive.js        # Foreground/background state
        │   ├── useIncomingMessages.js # Detects newly arrived messages from others
        │   ├── useMessages.js         # Polling, cache, optimistic send, retry, connection state
        │   └── useReadState.js        # Last-read position and New messages divider
        ├── screens/
        │   ├── ChatScreen.js          # Conversation, search, scrolling, actions, alerts
        │   └── WelcomeScreen.js       # Display-name picker
        ├── utils/
        │   ├── reply.js               # Encode/parse quoted replies
        │   └── richText.js            # Links, @mentions, emoji-only detection
        └── components/
            ├── Avatar.js
            ├── ChatHeader.js
            ├── ChatPlaceholder.js     # Loading / empty states
            ├── Composer.js            # Message input, reply bar, mention suggestions
            ├── ConnectionBanner.js    # Offline notice
            ├── GroupInfoSheet.js      # Members, stats, theme switcher
            ├── HighlightedText.js     # Search-match highlighting
            ├── JumpToLatestButton.js
            ├── MentionSuggestions.js  # @mention autocomplete list
            ├── MessageActionsSheet.js # Long-press menu
            ├── MessageBubble.js
            ├── NewMessagesDivider.js
            ├── RichText.js            # Links, mentions and search highlights
            ├── SearchBar.js
            └── Toast.js               # Floating notices and message alerts
```

## Prerequisites

- Node.js and npm
- Expo CLI through the project scripts
- Expo Go on a physical device, or an Android/iOS emulator

## Getting Started

From the project directory:

```bash
cd messenger-starter
npm install
npm start
```

After Expo starts, use the displayed QR code or choose a platform:

```bash
npm run android
npm run ios
npm run web
```

`npm run ios` requires macOS with Xcode configured. The Android command requires an Android emulator or a connected device.

## Backend API

The app uses the deployed API at:

```text
https://messenger-yzgf.onrender.com/
```

> **Status:** as of 27 November 2026 this service responds with *"This service has been suspended by its owner"* (HTTP 503). Until it is resumed or replaced, the app shows the offline banner and only saved messages. To use another server, change `API_URL` in `src/api.js`.

It expects these endpoints:

### Get messages

```http
GET /messages
```

The response should be a JSON array. Each message is expected to contain:

```json
{
  "id": 1,
  "user": "Alex",
  "text": "Hello!"
}
```

The app also accepts `_id` instead of `id` for list keys. If neither is present, the message's position in the list is used.

### Send a message

```http
POST /messages
Content-Type: application/json
```

Request body:

```json
{
  "user": "Newton",
  "text": "Hello from Yappy!"
}
```

The `user` field is the display name chosen on the welcome screen.

### Text conventions

The backend only stores `user` and `text`, so replies and mentions are written into the text in a form that still reads naturally in other clients:

| Feature | Format in `text` |
| --- | --- |
| Reply | First line `> Alex: original message snippet`, then the reply on the next line |
| Mention | `@` followed by a member's display name, e.g. `@Alex Smith` |
| Link | Any `https://…`, `http://…` or `www.…` address |

## Saved on the device

Everything is stored with AsyncStorage under the `@yappy/` prefix (see `src/storage.js`):

| Key | Contents |
| --- | --- |
| `displayName` | Your chosen display name |
| `themeMode` | `system`, `light` or `dark` |
| `messageCache` | The latest 200 messages, shown instantly on launch |
| `lastRead` | The last message you've seen, used for the *New messages* divider |

Tapping **Change** next to your name, or using **Change display name** in group info, returns to the welcome screen. The saved name is replaced only when you join with a new one.

## How It Works

1. On first launch you choose a display name on the welcome screen. Later launches go straight to the chat.
2. Saved messages from the last session appear immediately. The chat screen then polls `GET /messages` every two seconds. A poll is skipped while the previous one is still in flight, stale responses are ignored, and polling stops while the app is in the background.
3. Sending adds the message locally right away (*Sending…*) and calls `POST /messages`. On success the local copy is replaced by the server copy; on failure it is marked *Not sent* with **Retry** and **Delete** options.
4. Messages whose `user` matches your display name appear on the right; others appear on the left with a sender name and colored avatar.
5. If you've scrolled up, new messages don't move the list; the jump-to-latest button shows how many arrived, and a tappable alert shows who sent them.
6. Long-press a message to reply or copy it. Tap the quote in a reply to jump to the original message.
7. Type `@` in the composer to mention someone who has posted in the group. Names can contain spaces; mentions are matched against known members, longest name first.
8. The app saves the last message you've seen. On your next visit, unread messages from others start below a *New messages* divider and the chat opens there.
9. Tap 🔍 to search, or ••• for group info, members, the theme switcher and changing your name.

## Roadmap: push notifications

The app is set up for push notifications (Expo Notifications + EAS Build + Firebase Cloud Messaging):

- `app.json` already defines the app identity (`com.divyatmaj.yappy`) and a `yappy://` deep-link scheme.
- `src/storage.js` is the place to keep the push token and notification preferences.
- `useAppActive` tells foreground from background, so in-app alerts can be used in the foreground and system notifications in the background.
- `useIncomingMessages` is the single place that detects new messages, and `mentionsUser()` in `src/utils/richText.js` can decide when to send a mention notification.
- `useReadState` provides the last-read position for unread badge counts.

Still needed:

- A backend that stores each device's Expo push token and calls the Expo Push API when a message is posted
- An Expo account and EAS project (`eas init`), and a Firebase project for Android (FCM)
- A development build, because Expo Go doesn't support remote push notifications on Android

## Troubleshooting

- **"Offline · showing saved messages" never goes away:** The backend is unreachable. Open `https://messenger-yzgf.onrender.com/messages` in a browser. If it says the service is suspended, the server needs to be resumed or `API_URL` pointed at another one.
- **No messages appear:** Confirm that `GET /messages` returns a JSON array.
- **Messages cannot be sent:** Check the backend's `POST /messages` endpoint and verify that it accepts the `user` and `text` fields.
- **The app cannot connect on a device:** Make sure the device has internet access. If using a local API instead, replace `API_URL` in `src/api.js` with an address reachable from the device (not `localhost`).
- **First load is slow:** The hosted backend sleeps when idle and can take up to a minute to wake up; the app shows a notice while it waits.
- **Start fresh:** Clear the app's data (or delete Expo Go's data) to remove the saved name, theme, cache and read position.
- **iOS build issues:** Run CocoaPods installation from `messenger-starter/ios` if required by the native build setup.

## License

This project does not currently declare a license.
