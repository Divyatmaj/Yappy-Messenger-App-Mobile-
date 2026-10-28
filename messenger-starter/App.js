
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ME = "Newton";

export default function App() {
  const [messages, setMessages] = useState([]);
  const URL = 'https://messenger-yzgf.onrender.com/';

  const loadMessage = async () => {
    const response = await fetch(URL + 'messages');
    const res = await response.json();
    setMessages(res);
  };

  useEffect(() => {
    loadMessage();
    const interval = setInterval(loadMessage, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Scalar</Text>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const isMine = item.user === ME;
          return (
            <View style={[styles.bubble, isMine ? styles.mine : styles.others]}>
              <Text>{item.user}: {item.text}</Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} />
        <Pressable style={styles.button}>
          <Text>Send</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 100,
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    backgroundColor: 'blue',
  },
  bubble: {
    padding: 10,
    margin: 2,
  },
  mine: {
    backgroundColor: "#39b7f6",
    alignSelf: 'flex-end',
  },
  others: {
    backgroundColor: 'grey',
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 2,
    padding: 10,
    margin: 2,
  },
  button: {
    backgroundColor: 'blue',
    width: "25%",
    padding: 5,
    borderRadius: 10,
    margin: 10,
  },
  inputRow: {
    backgroundColor: 'gray',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
