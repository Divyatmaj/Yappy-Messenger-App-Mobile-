import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeUsers } from '../chats';

const UsersContext = createContext({ users: [], usersById: new Map() });

/**
 * Keeps the people directory (`users` collection) in memory for the whole
 * app: chat titles, member lists, mentions and the new-chat screen use it.
 * `enabled` should be true only once signed in (the rules require it).
 */
export function UsersProvider({ enabled = true, children }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    return subscribeUsers(setUsers, (error) =>
      console.log('Error loading users:', error),
    );
  }, [enabled]);

  const value = useMemo(
    () => ({
      users,
      usersById: new Map(users.map((u) => [u.uid, u.name])),
    }),
    [users],
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export const useUsers = () => useContext(UsersContext);
