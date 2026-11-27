import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatScreen from './src/screens/ChatScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { ThemeProvider } from './src/theme';

export default function App() {
  // The display name lives in memory, so it is asked for on each app launch.
  const [me, setMe] = useState(null);
  const [lastName, setLastName] = useState('');

  const changeName = () => {
    setLastName(me);
    setMe(null);
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {me ? (
          <ChatScreen me={me} onChangeName={changeName} />
        ) : (
          <WelcomeScreen initialName={lastName} onJoin={setMe} />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
