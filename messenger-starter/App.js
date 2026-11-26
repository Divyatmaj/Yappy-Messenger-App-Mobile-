import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatScreen from './src/screens/ChatScreen';

const ME = 'Newton';

export default function App() {
  return (
    <SafeAreaProvider>
      <ChatScreen me={ME} />
    </SafeAreaProvider>
  );
}
