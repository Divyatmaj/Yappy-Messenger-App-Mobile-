import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatScreen from './src/screens/ChatScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import NewChatScreen from './src/screens/NewChatScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { joinPublicGroup, saveProfile } from './src/chats';
import { describeFirebaseError, ensureSignedIn } from './src/firebase';
import { UsersProvider } from './src/hooks/useUsers';
import { SessionContext } from './src/session';
import { KEYS, load, save } from './src/storage';
import { ThemeProvider, useTheme } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { colors, ready: themeReady } = useTheme();
  // undefined = still reading storage, null = no name chosen yet.
  const [me, setMe] = useState(undefined);
  const [lastName, setLastName] = useState('');
  const [uid, setUid] = useState(null);
  const [problem, setProblem] = useState(null);
  // Which screen is showing: the chat list, one chat, or "new chat".
  const [route, setRoute] = useState({ name: 'chats' });

  useEffect(() => {
    load(KEYS.displayName).then((saved) => {
      setMe(saved || null);
      if (saved) setLastName(saved);
    });
  }, []);

  // Sign in, publish your profile and join the public group.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    ensureSignedIn()
      .then(async (user) => {
        if (cancelled) return;
        setUid(user.uid);
        setProblem(null);
        await saveProfile(user.uid, me);
        await joinPublicGroup(user.uid);
      })
      .catch((error) => {
        console.log('Error signing in:', error);
        if (!cancelled) {
          setProblem(describeFirebaseError(error) ?? "Couldn't connect.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [me]);

  const join = (name) => {
    setMe(name);
    setLastName(name);
    save(KEYS.displayName, name);
  };

  // The saved name is kept until a new one is chosen, so closing the app
  // on the welcome screen still brings you back as before.
  const changeName = useCallback(() => setMe(null), []);

  const openChat = useCallback(
    (chat) => setRoute({ name: 'chat', chatId: chat.id, chat }),
    [],
  );
  const goHome = useCallback(() => setRoute({ name: 'chats' }), []);
  const startNewChat = useCallback(() => setRoute({ name: 'new' }), []);

  // Android back button: from a chat, go back to the chat list.
  // (The new-chat screen handles its own steps.)
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (route.name === 'chats' || route.name === 'new') return false;
        goHome();
        return true;
      },
    );
    return () => subscription.remove();
  }, [route.name, goHome]);

  const session = useMemo(
    () => ({ me, uid, changeName }),
    [me, uid, changeName],
  );

  if (me === undefined || !themeReady) {
    // Brief blank frame in the header color while storage is read.
    return <View style={{ flex: 1, backgroundColor: colors.header }} />;
  }

  if (!me) {
    return <WelcomeScreen initialName={lastName} onJoin={join} />;
  }

  return (
    <SessionContext.Provider value={session}>
      <UsersProvider enabled={!!uid}>
        {route.name === 'chat' ? (
          <ChatScreen
            key={route.chatId}
            chatId={route.chatId}
            initialChat={route.chat}
            onBack={goHome}
            onOpenChat={openChat}
          />
        ) : route.name === 'new' ? (
          <NewChatScreen onBack={goHome} onOpenChat={openChat} />
        ) : (
          <ChatsScreen
            problem={problem}
            onOpenChat={openChat}
            onNewChat={startNewChat}
          />
        )}
      </UsersProvider>
    </SessionContext.Provider>
  );
}
