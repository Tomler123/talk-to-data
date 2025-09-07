import { useEffect, useState, type JSX } from 'react';
import './Voices.css';

interface User {
  id: number;
  username: string;
}

interface VoiceEntry {
  id: number;
  created_at: string; // ISO date
  audio: string;      // base64
}

export default function Voices(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [voices, setVoices] = useState<VoiceEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const token = localStorage.getItem('access_token');

  // 1. fetch users on mount
  useEffect(() => {
    fetch('http://localhost:5000/voice/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then((data: User[]) => setUsers(data))
      .catch((err: any) => setError(err.message));
  }, [token]);

  // 2. fetch voices when a user is selected
  const handleUserChange = async (e: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    const userId = parseInt(e.target.value, 10);
    setSelectedUser(userId);
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/voice/users/${userId}/voices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load voices');
      const data: VoiceEntry[] = await res.json();
      setVoices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // helper to delete a voice
  const handleDelete = async (voiceId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    try {
      const res = await fetch(`http://localhost:5000/voice/voices/${voiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      // remove from UI
      setVoices(vs => vs.filter(v => v.id !== voiceId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="voices-container">
      <h1>User Voices</h1>

      <label htmlFor="user-select">Select user:</label>
      <select id="user-select" onChange={handleUserChange} value={selectedUser ?? ''}>
        <option value="">-- choose --</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.username}
          </option>
        ))}
      </select>

      {loading && <p>Loading recordings…</p>}
      {error && <p className="error">{error}</p>}

      {voices.length > 0 && selectedUser !== null && (
        <div className="voices-list">
          <h2>Recordings for {users.find(u => u.id === selectedUser)?.username}</h2>
          {voices.map(v => (
            <div key={v.id} className="voice-item">
              <div className="voice-info">
                <p>Recorded: {new Date(v.created_at).toLocaleString()}</p>
                <audio controls src={`data:audio/webm;base64,${v.audio}`} />
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(v.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
