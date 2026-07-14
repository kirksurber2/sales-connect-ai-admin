import { createContext, useContext, useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession, resetPassword, confirmResetPassword } from '@aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
    }
  }
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload || {};
      const role = payload['custom:role'] || '';
      const allowed = ['Business-Owner', 'Owner', 'Admin'];
      if (allowed.includes(role)) {
        setUser({ ...currentUser, role, name: payload.given_name || '' });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try { await signOut(); } catch {}
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload || {};
      const role = payload['custom:role'] || '';
      const allowed = ['Business-Owner', 'Owner', 'Admin'];
      if (allowed.includes(role)) {
        const currentUser = await getCurrentUser();
        setUser({ ...currentUser, role, name: payload.given_name || '' });
      }
    }
    return result;
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  async function forgotPassword(email) {
    return resetPassword({ username: email });
  }

  async function confirmForgotPassword(email, code, newPassword) {
    return confirmResetPassword({ username: email, confirmationCode: code, newPassword });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, forgotPassword, confirmForgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
