import { useState } from 'react';
import VoiceCapture from '../components/VoiceCapture';
import { useNavigate, useLocation } from 'react-router-dom';
import './Identify.css';

interface LocationState {
  state?: any;
  from?: { pathname: string };
}

interface IdentifyProps {
  /** Optional callback when running inside a modal */
  onSuccess?: () => void;
}

export default function Identify({ onSuccess }: IdentifyProps) {
  const navigate = useNavigate();
  const location = useLocation() as LocationState;

  const [audio, setAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  // Switch to credential fallback after 3 failed voice attempts
  const [fallback, setFallback] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleIdentify = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/voice/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ audio }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Identify failed');
      }

      // Success: reset attempts, store token, and call onSuccess/navigate
      setAttempts(0);
      localStorage.setItem('access_token', data.access_token);
      if (onSuccess) {
        onSuccess();
      } else {
        const dest = location.state?.from?.pathname || '/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setFallback(true);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login failed');

      // Store token (which now should include voice_verified_at)
      localStorage.setItem('access_token', data.access_token);
      if (onSuccess) {
        onSuccess();
      } else {
        const dest = location.state?.from?.pathname || '/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="identify-container">
      {!fallback ? (
        <>
          <h2>Voice Verification Required</h2>
          <p>Please verify your voice to continue.</p>

          <VoiceCapture onSave={setAudio} />

          {audio && (
            <div style={{ marginTop: '1rem' }}>
              <audio controls src={`data:audio/webm;base64,${audio}`} />
              <button
                className="identify-btn"
                onClick={handleIdentify}
                disabled={loading}
              >
                {loading ? 'Identifying…' : `Identify Speaker (${attempts}/3)`}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Enter Credentials</h2>
          <p>
            Voice identification failed 3 times. Please login with username
            and password.
          </p>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ display: 'block', marginTop: '1rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ display: 'block', marginTop: '0.5rem' }}
          />
          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </>
      )}

      {error && <p className="error">Error: {error}</p>}
    </div>
  );
}