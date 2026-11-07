// this file stores login state and active quiz session for the whole app
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);
// this function reads the auth context
export const useAuth = () => useContext(AuthContext);

// this function provides auth state to the app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('checking');
  const loading = authStatus === 'checking';
  // this function restores the saved quiz session
  const [activeQuizSession, setActiveQuizSession] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('aralna_active_quiz') || 'null');
    } catch {
      console.error('Could not restore the active quiz session from browser storage.');
      return null;
    }
  });

  const activeQuizId = activeQuizSession && activeQuizSession.userId === user?.id
    ? activeQuizSession.quizId
    : null;

  // this function starts a new quiz session
  const startQuizSession = useCallback((quizId) => {
    const session = { userId: user.id, quizId };
    window.localStorage.setItem('aralna_active_quiz', JSON.stringify(session));
    setActiveQuizSession(session);
  }, [user]);

  // this function clears the active quiz session
  const endQuizSession = useCallback(() => {
    window.localStorage.removeItem('aralna_active_quiz');
    setActiveQuizSession(null);
  }, []);

  // this function checks who is logged in
  const checkAuth = useCallback(async () => {
    setAuthStatus('checking');
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setAuthStatus('authenticated');
    } catch (error) {
      setUser(null);
      setAuthStatus(error.status === 401 ? 'logged_out' : 'failed');
    }
  }, []);

  // this effect checks auth on load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // this effect clears quiz sessions for the wrong user
  useEffect(() => {
    if (loading) return;
    if (!user || activeQuizSession?.userId !== user.id) endQuizSession();
  }, [user, loading]);

  // this effect syncs the quiz session across tabs
  useEffect(() => {
    // this function applies storage changes to the quiz session
    const syncQuizSession = (event) => {
      if (event.key !== 'aralna_active_quiz') return;
      try {
        setActiveQuizSession(event.newValue ? JSON.parse(event.newValue) : null);
      } catch {
        console.error('Could not sync the active quiz session from browser storage.');
        setActiveQuizSession(null);
      }
    };
    window.addEventListener('storage', syncQuizSession);
    return () => window.removeEventListener('storage', syncQuizSession);
  }, []);

  // this effect keeps the user marked online
  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    // this function pings the presence endpoint
    const sendPresence = () => {
      if (document.visibilityState !== 'visible') return;
      api.post('/auth/presence').catch((err) => {
        if (active) console.error('Could not update online presence:', err.message);
      });
    };
    // this function resends presence when the tab is visible
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') sendPresence();
    };

    sendPresence();
    const interval = window.setInterval(sendPresence, 20 * 1000);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user]);

  // this function handles the login
  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    setUser(data.user);
    setAuthStatus('authenticated');
    return data.user;
  }

  // this function registers a new student
  async function register(form) {
    const data = await api.post('/auth/register', form);
    setUser(data.user);
    setAuthStatus('authenticated');
    return data.user;
  }

  // this function uploads a new profile picture
  async function updateProfilePicture(file) {
    const data = await api.upload('/auth/profile-picture', file);
    setUser((currentUser) => currentUser ? { ...currentUser, profilePicture: data.profilePicture } : currentUser);
  }

  // this function removes the profile picture
  async function removeProfilePicture() {
    const data = await api.delete('/auth/profile-picture');
    setUser((currentUser) => currentUser ? { ...currentUser, profilePicture: data.profilePicture } : currentUser);
  }

  // this function logs the user out
  async function logout() {
    await api.post('/auth/logout');
    endQuizSession();
    setUser(null);
    setAuthStatus('logged_out');
  }

  return (
    <AuthContext.Provider value={{ user, loading, authStatus, checkAuth, login, register, logout, updateProfilePicture, removeProfilePicture, activeQuizId, startQuizSession, endQuizSession }}>
      {children}
    </AuthContext.Provider>
  );
}
