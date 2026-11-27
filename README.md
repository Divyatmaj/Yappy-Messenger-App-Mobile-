# Yappy Messenger

A group messaging mobile app built with Expo and React Native. Pick a display name, join the Scalar group conversation, and chat in real time with a polished light or dark UI.

## Features

- **Welcome screen** – choose a display name (2–20 characters) or continue as a recent participant; change it any time
- **Polished chat UI** – per-user avatar colors, grouped consecutive messages, auto-scroll to the latest message
- **Optimistic sending** – messages appear instantly with a *Sending…* state; failed sends can be retried or deleted
- **Connection awareness** – offline banner with manual retry, loading state for slow server wake-ups, and an empty state
- **Search** – find messages or people, with highlighted matches and next/previous navigation
- **Jump to latest** – floating button with an unread counter when you've scrolled up
- **Group info** – member list ranked by message count, plus group stats
- **Dark mode** – follow the system theme or force light/dark from the group info sheet
- **Remembers you** – your display name, theme choice and the latest 200 messages are saved on the device, so the app opens straight into the chat and shows saved messages even when offline
- **Battery friendly** – polling pauses while the app is in the background and refreshes as soon as you return
- Automatic refresh every two seconds, without overlapping requests
- Multiline input with a 2,000-character limit and counter
- Keyboard-aware, safe-area-aware layout on iOS and Android

## Tech Stack

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- React 19
- `react-native-safe-area-context`
- `expo-status-bar`
- `@react-native-async-storage/async-storage`

## Project Structure

```text
Messenger/
├── README.md
└── messenger-starter/
    ├── App.js                      # Root: theme provider + welcome/chat switch
    ├── app.json                    # Expo application configuration
    ├── index.js                    # Expo entry point
    ├── package.json                # Dependencies and scripts
    └── src/
        ├── api.js                  # Backend calls (GET/POST /messages)
        ├── storage.js              # AsyncStorage wrapper and persisted keys
        ├── theme.js                # Light/dark palettes, ThemeProvider, avatar colors
        ├── hooks/
        │   ├── useAppActive.js     # Foreground/background state
        │   └── useMessages.js      # Polling, cache, optimistic send, retry, connection state
        ├── screens/
        │   ├── WelcomeScreen.js    # Display-name picker
        │   └── ChatScreen.js       # Conversation, search, scroll handling
        └── components/
            ├── Avatar.js
            ├── ChatHeader.js
            ├── ChatPlaceholder.js  # Loading / empty states
            ├── Composer.js         # Message input
            ├── ConnectionBanner.js
            ├── GroupInfoSheet.js   # Members, stats, theme switcher
            ├── HighlightedText.js
            ├── JumpToLatestButton.js
            ├── MessageBubble.js
            └── SearchBar.js
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

The app currently uses the deployed API at:

```text
https://messenger-yzgf.onrender.com/
```

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

The app also accepts `_id` instead of `id` for list keys.

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

The `user` field is the display name chosen on the welcome screen. It is saved on the device, so the welcome screen only appears on first launch or after tapping **Change**.

## How It Works

1. On first launch you choose a display name on the welcome screen. Later launches go straight to the chat.
2. Saved messages from the last session appear immediately. The chat screen then polls `GET /messages` every two seconds. A poll is skipped while the previous one is still in flight, stale responses are ignored, and polling stops while the app is in the background.
3. Sending adds the message locally right away (*Sending…*) and calls `POST /messages`. On success the local copy is replaced by the server copy; on failure it is marked *Not sent* with **Retry** and **Delete** options.
4. Messages whose `user` matches your display name appear on the right; others appear on the left with a sender name and colored avatar.
5. If you've scrolled up, new messages don't move the list; the jump-to-latest button shows how many arrived.
6. Tap 🔍 to search, or ••• for group info, members, the theme switcher and changing your name.

## Troubleshooting

- **No messages appear:** Confirm that the backend is running and that `GET https://messenger-yzgf.onrender.com/messages` returns a JSON array.
- **Messages cannot be sent:** Check the backend's `POST /messages` endpoint and verify that it accepts the `user` and `text` fields.
- **The app cannot connect on a device:** Make sure the device has internet access. If using a local API instead, replace `API_URL` in `src/api.js` with an address reachable from the device.
- **First load is slow:** The hosted backend sleeps when idle and can take up to a minute to wake up; the app shows a notice while it waits.
- **iOS build issues:** Run CocoaPods installation from `messenger-starter/ios` if required by the native build setup.

## License

This project does not currently declare a license.
