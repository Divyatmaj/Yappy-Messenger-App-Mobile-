import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatScreen from './src/screens/ChatScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
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

  useEffect(() => {
    load(KEYS.displayName).then((saved) => {
      setMe(saved || null);
      if (saved) setLastName(saved);
    });
  }, []);

  const join = (name) => {
    setMe(name);
    setLastName(name);
    save(KEYS.displayName, name);
  };

  // The saved name is kept until a new one is chosen, so closing the app
  // on the welcome screen still brings you back as before.
  const changeName = () => setMe(null);

  if (me === undefined || !themeReady) {
    // Brief blank frame in the header color while storage is read.
    return <View style={{ flex: 1, backgroundColor: colors.header }} />;
  }

  return me ? (
    <ChatScreen me={me} onChangeName={changeName} />
  ) : (
    <WelcomeScreen initialName={lastName} onJoin={join} />
  );
}
