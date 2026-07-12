import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import styles from './Login.module.css';

export default function Login() {
  const { login, forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // login | forgot | confirm
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword(email);
      setMode('confirm');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError('');
    try {
      await confirmForgotPassword(email, code, newPassword);
      setMode('login');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sales Connect AI</h1>
        <p className={styles.subtitle}>Admin Dashboard</p>

        {error && <div className={styles.error}>{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <input className={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className={styles.btn} type="submit">Sign In</button>
            <button type="button" className={styles.link} onClick={() => setMode('forgot')}>Forgot password?</button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <input className={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button className={styles.btn} type="submit">Send Reset Code</button>
            <button type="button" className={styles.link} onClick={() => setMode('login')}>Back to login</button>
          </form>
        )}

        {mode === 'confirm' && (
          <form onSubmit={handleConfirm}>
            <input className={styles.input} type="text" placeholder="Confirmation code" value={code} onChange={e => setCode(e.target.value)} required />
            <input className={styles.input} type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <button className={styles.btn} type="submit">Reset Password</button>
            <button type="button" className={styles.link} onClick={() => setMode('login')}>Back to login</button>
          </form>
        )}
      </div>
    </div>
  );
}
