# Yappy Messenger

A group messaging mobile app built with Expo, React Native and Firebase. Pick a display name and chat in real time in multiple conversations, starting with the public Scalar group, in a polished light or dark UI.

## Features

### Chatting

- **Multiple chats** – a WhatsApp-style **Chats** home screen lists every conversation you're in, with the last message, time and an unread dot
- **Public group** – everyone automatically joins the **Scalar** group
- **Welcome screen** – choose a display name (2–20 characters); change it any time from Settings
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
- **Real-time sync** – messages arrive instantly through a Firestore listener (no polling)
- **Connection awareness** – offline banner with manual retry, setup hints when Firebase isn't configured, loading and empty states

### Personalization & device

- **Remembers you** – your display name, theme, chat list and the latest 200 messages of each chat are saved on the device, so the app opens instantly and works offline
- **Dark mode** – follow the system theme or force light/dark from Settings (⚙︎ on the Chats screen)
- **Chat info** – tap the chat header to see the members, ranked by message count, plus stats
- **Battery friendly** – the Firestore listener pauses while the app is in the background and resumes as soon as you return
- Keyboard-aware, safe-area-aware layout on iOS and Android

## Tech Stack

- [Expo](https://expo.dev/) SDK 58
- [React Native](https://reactnative.dev/) 0.88 with React 19
- [Firebase](https://firebase.google.com/) JS SDK – Cloud Firestore for messages, Anonymous Authentication
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
├── firestore.rules                    # Firestore security rules (paste into the console)
└── messenger-starter/
    ├── App.js                         # Root: name, sign-in, profile, Chats ⇄ Chat navigation
    ├── app.json                       # Expo config (name, bundle IDs, deep-link scheme)
    ├── index.js                       # Expo entry point
    ├── package.json                   # Dependencies and scripts
    └── src/
        ├── api.js                     # Firestore: a chat's messages (subscribe, post)
        ├── chats.js                   # Firestore: users directory, chats, public group
        ├── firebase.js                # Firebase app, anonymous auth, Firestore, error hints
        ├── firebaseConfig.js          # Your Firebase web app config (paste here)
        ├── haptics.js                 # Safe haptic feedback helpers
        ├── readMarks.js               # Per-chat "last seen" times for unread dots
        ├── session.js                 # Current user (name + uid) context
        ├── storage.js                 # AsyncStorage wrapper and persisted keys
        ├── theme.js                   # Light/dark palettes, ThemeProvider, avatar colors
        ├── hooks/
        │   ├── useAppActive.js        # Foreground/background state
        │   ├── useChats.js            # Your chat list and a single chat, live
        │   ├── useIncomingMessages.js # Detects newly arrived messages from others
        │   ├── useMessages.js         # Real-time listener, cache, optimistic send, retry, connection state
        │   ├── useReadState.js        # Last-read position and New messages divider
        │   └── useUsers.js            # People directory provider
        ├── screens/
        │   ├── ChatScreen.js          # One conversation: search, scrolling, actions, alerts
        │   ├── ChatsScreen.js         # Home: list of your chats
        │   └── WelcomeScreen.js       # Display-name picker
        ├── utils/
        │   ├── reply.js               # Encode/parse quoted replies
        │   ├── richText.js            # Links, @mentions, emoji-only detection
        │   └── time.js                # Chat-list time formatting
        └── components/
            ├── Avatar.js
            ├── ChatHeader.js          # Back button, chat avatar, title
            ├── ChatListItem.js        # One row of the chat list
            ├── ChatPlaceholder.js     # Loading / empty states
            ├── Composer.js            # Message input, reply bar, mention suggestions
            ├── ConnectionBanner.js    # Offline notice
            ├── GroupInfoSheet.js      # Chat members and stats
            ├── HighlightedText.js     # Search-match highlighting
            ├── JumpToLatestButton.js
            ├── MentionSuggestions.js  # @mention autocomplete list
            ├── MessageActionsSheet.js # Long-press menu
            ├── MessageBubble.js
            ├── NewMessagesDivider.js
            ├── RichText.js            # Links, mentions and search highlights
            ├── SearchBar.js
            ├── SettingsSheet.js       # Profile, theme, change name
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

## Firebase setup

Messages are stored in **Cloud Firestore**, and every device signs in with **Firebase Anonymous Authentication**. Everything runs on the free **Spark** plan; there is no server to run.

1. In the [Firebase console](https://console.firebase.google.com/), create a project (Google Analytics is optional).
2. **Firestore:** *Build → Firestore Database → Create database*. Pick a location near you and start in **production mode**.
3. **Rules:** open the *Rules* tab, replace everything with the contents of [`firestore.rules`](firestore.rules), and click **Publish**.
4. **Anonymous sign-in:** *Build → Authentication → Get started → Sign-in method → Anonymous → Enable*.
5. **Web app config:** *Project settings → General → Your apps → Add app → Web (`</>`)*. Register it (Firebase Hosting isn't needed), copy the `firebaseConfig` values into `messenger-starter/src/firebaseConfig.js`, then restart Expo.

Until steps 2–5 are done, the chat shows a *Setup needed* message saying what is missing.

### Data model

| Path | Fields |
| --- | --- |
| `users/{uid}` | `name`, `nameLower`, `updatedAt`: the people directory |
| `chats/{chatId}` | `type` (`group` / `direct`), `name` (groups), `members` (uids), `public`, `createdBy`, `createdAt`, `updatedAt`, `lastMessage` (`text`, `user`, `uid`, `createdAt`) |
| `chats/{chatId}/messages/{id}` | `user`, `text`, `uid`, `createdAt` |
| `devices/{expoPushToken}` | push notification settings (next step) |

- The built-in public group has the id `scalar`. Every user joins it on first launch.
- One-to-one chats have the id `dm_<uidA>_<uidB>` (uids sorted), so each pair of people has exactly one chat.
- Sending writes the message and the chat's `lastMessage` in one atomic batch. That's what keeps the chat list up to date.
- Your identity is the anonymous Firebase **uid** of the device. Messages are shown as yours by uid, and the display name is just a label.

The app loads your chats plus the latest 200 messages of the open chat. On the Spark plan, Firestore allows 50,000 document reads per day, which is plenty for a class.

[`firestore.rules`](firestore.rules) only lets members read and post in a chat. Anyone can join the public group. Members can rename private groups, add or remove members, or leave. Messages can't be edited or deleted, and timestamps must come from the server. **After changing the rules file, paste it into the console again and click Publish.**

### Text conventions

Each message only stores `user` and `text`, so replies and mentions are written into the text in a form that still reads naturally anywhere:

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
| `chatList` | Your chats, shown instantly on launch |
| `messageCache/{chatId}` | The latest 200 messages of each chat you've opened |
| `lastRead/{chatId}` | The last message you've seen in a chat, used for the *New messages* divider |
| `readMarks` | Per chat, the time of the newest message you've seen, used for unread dots |

Tapping **Change** next to your name, or **Change display name** in Settings, returns to the welcome screen. The saved name is replaced only when you join with a new one.

## How It Works

1. On first launch you choose a display name on the welcome screen. The app signs in anonymously, saves your profile to the people directory and joins you to the Scalar group. Later launches go straight to the **Chats** list.
2. Tap a chat to open it. Saved messages from the last visit appear immediately, then a real-time Firestore listener takes over. Listeners pause while the app is in the background.
3. Sending adds the message locally right away (*Sending…*) and writes it to Firestore. Once the server confirms it, the local copy is replaced by the stored one. While offline, Firestore queues the write and sends it when the connection returns. If the write is rejected, the message is marked *Not sent* with **Retry** and **Delete** options.
4. Your messages (matched by uid) appear on the right; others appear on the left with a sender name and colored avatar.
5. If you've scrolled up, new messages don't move the list; the jump-to-latest button shows how many arrived, and a tappable alert shows who sent them.
6. Long-press a message to reply or copy it. Tap the quote in a reply to jump to the original message.
7. Type `@` in the composer to mention a member of the chat. Names can contain spaces; mentions are matched against known members, longest name first.
8. The app saves the last message you've seen. On your next visit, unread messages from others start below a *New messages* divider and the chat opens there.
9. In a chat, tap 🔍 to search or the header for chat info and members. On the Chats screen, ⚙︎ opens Settings (theme, display name). The Android back button returns to the chat list.

## Roadmap: push notifications

Next step: Android push notifications with **Expo Notifications**, delivered through **Firebase Cloud Messaging**, with builds made using **EAS**. They will work without a server:

- Each device saves its Expo push token in the Firestore `devices` collection (already allowed by `firestore.rules`).
- After a message is stored, the sender's app sends notifications to the other devices through Expo's push service. Devices can choose *all messages*, *mentions only* or *off*.
- `useAppActive`, `useIncomingMessages`, `mentionsUser()` and `useReadState` are already in place for foreground handling, mention detection and badges.

Still needed: an Expo account and EAS project, an Android app plus `google-services.json` in the Firebase project, the FCM V1 service-account key uploaded to EAS, and a development build (Expo Go can't receive remote push notifications on Android).

## Troubleshooting

- **"Setup needed" in the chat:** The message says which Firebase step is missing (config, Anonymous sign-in or rules). See [Firebase setup](#firebase-setup).
- **"Offline · showing saved messages" never goes away:** The device can't reach Firestore. Check its internet connection and tap **Retry now**.
- **Messages show *Not sent*:** Firestore rejected the write. Make sure the rules from `firestore.rules` are published and the display name is 1–40 characters.
- **Start fresh:** Clear the app's data (or delete Expo Go's data) to remove the saved name, theme, cache and read position. The next launch signs in as a new anonymous user.
- **iOS build issues:** Run CocoaPods installation from `messenger-starter/ios` if required by the native build setup.

## License

This project does not currently declare a license.
