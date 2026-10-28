# Yappy Messenger

A simple group messaging mobile app built with Expo and React Native. The app displays messages from the Scalar group conversation, refreshes the conversation periodically, and lets the current user send new messages.

## Features

- Group conversation UI with sent and received message bubbles
- Sender avatars for messages from other users
- Automatic message refresh every two seconds
- Multiline message input with a 2,000-character limit
- Keyboard-aware layout for iOS and Android
- Responsive safe-area handling

## Tech Stack

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- React 19
- `react-native-safe-area-context`
- `expo-status-bar`

## Project Structure

```text
Messenger/
├── README.md
└── messenger-starter/
    ├── App.js          # Main chat screen and API integration
    ├── app.json        # Expo application configuration
    ├── index.js        # Expo entry point
    └── package.json    # Dependencies and scripts
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

The current user is defined in `App.js` as `Newton`. Update that value when adding user identity or authentication.

## How It Works

1. The app loads messages when the screen mounts.
2. It polls `GET /messages` every two seconds to keep the conversation current.
3. Empty or whitespace-only messages cannot be sent.
4. A successful `POST /messages` clears the input and reloads the messages.
5. Messages authored by `Newton` appear on the right; other messages appear on the left with the sender name and avatar.

## Troubleshooting

- **No messages appear:** Confirm that the backend is running and that `GET https://messenger-yzgf.onrender.com/messages` returns a JSON array.
- **Messages cannot be sent:** Check the backend's `POST /messages` endpoint and verify that it accepts the `user` and `text` fields.
- **The app cannot connect on a device:** Make sure the device has internet access. If using a local API instead, replace the `URL` constant in `App.js` with an address reachable from the device.
- **iOS build issues:** Run CocoaPods installation from `messenger-starter/ios` if required by the native build setup.

## License

This project does not currently declare a license.
