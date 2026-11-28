import { useEffect, useState } from 'react';
import { subscribeChat, subscribeMyChats } from '../chats';
import { describeFirebaseError } from '../firebase';
import { KEYS, load, save } from '../storage';
import useAppActive from './useAppActive';

/**
 * Your chats, most recent first, kept live. The last list is saved so the
 * chat list shows instantly on the next launch.
 */
export function useMyChats(uid) {
  const [chats, setChats] = useState(null); // null = not loaded yet
  const [problem, setProblem] = useState(null);
  const appActive = useAppActive();

  useEffect(() => {
    load(KEYS.chatList, null).then((cached) => {
      setChats((current) => current ?? cached);
    });
  }, []);

  useEffect(() => {
    if (!uid || !appActive) return;
    return subscribeMyChats(
      uid,
      (list, meta) => {
        if (meta.fromCache && list.length === 0) return;
        setChats(list);
        setProblem(null);
        save(KEYS.chatList, list);
      },
      (error) => {
        console.log('Error loading chats:', error);
        setProblem(describeFirebaseError(error) ?? "Couldn't load chats.");
      },
    );
  }, [uid, appActive]);

  return { chats, problem };
}

/** One chat's details (name, members, …), kept live. */
export function useChat(chatId, initial = null) {
  const [chat, setChat] = useState(initial);

  useEffect(
    () =>
      subscribeChat(
        chatId,
        (value) => value && setChat(value),
        (error) => console.log('Error loading chat:', error),
      ),
    [chatId],
  );

  return chat;
}
