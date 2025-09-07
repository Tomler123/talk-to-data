import React, { useState } from 'react';
import axios from '../api/axios';
import './Auth.css';

export default function Register() {
  const roles = ["Admin", "Data Analyst", "Business User", "Viewer"];
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await axios.post('/auth/register', {
        username,
        password,
        role: selectedRole
      });

      if (res.status !== 201) {
        // axios only throws on 4xx/5xx, but guard anyway:
        throw new Error(res.data.msg || `Unexpected status ${res.status}`);
      }

      setSuccess(true);
      setUsername('');
      setPassword('');
      setSelectedRole('');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Admin: Register New User</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Role
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              required
            >
              <option value="">-- select role --</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register User'}
          </button>

          {error   && <p className="error">{error}</p>}
          {success && <p className="success">User registered!</p>}
        </form>
      </div>
    </div>
  );
}
