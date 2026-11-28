import { createContext, useContext } from 'react';

/**
 * Who is using the app on this device:
 * `me` is the display name, `uid` the anonymous Firebase user id.
 * Messages are matched to you by `uid`; the name is only for display.
 */
export const SessionContext = createContext({
  me: null,
  uid: null,
  changeName: () => {},
});

export const useSession = () => useContext(SessionContext);
