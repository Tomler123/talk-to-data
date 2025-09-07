import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import './MyVoices.css';

type Voice = {
  id: number;
  created_at: string;
  audio: string;
};

export default function MyVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const fetchVoices = async () => {
    try {
      const res = await axios.get<Voice[]>('/voice/users/me/voices');
      setVoices(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch voices');
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = e => {
      chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          await axios.post('/voice/my-voices', { audio: base64 });
          fetchVoices();
        } catch (e) {
          console.error(e);
          alert('Upload failed');
        }
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    };

    mr.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const playVoice = (b64: string) => {
    const byteChars = atob(b64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    setPlayingUrl(url);
  };

  const deleteVoice = async (id: number) => {
    if (!window.confirm('Delete this recording?')) return;
    try {
      await axios.delete(`/voice/voices/${id}`);
      setVoices(vs => vs.filter(v => v.id !== id));
    } catch {
      alert('Delete failed');
    }
  };

  return (
    <div className="myvoices-wrapper">
      <h1 className="myvoices-title">My Voices</h1>
      <div className="myvoices-actions">
        {recording ? (
          <button onClick={stopRecording} className="btn btn-stop">Stop Recording</button>
        ) : (
          <button onClick={startRecording} className="btn btn-record">Record New Voice</button>
        )}
      </div>

      {playingUrl && (
        <audio controls src={playingUrl} className="myvoices-audio" />
      )}

      <ul className="myvoices-list">
        {voices.map(v => (
          <li key={v.id} className="myvoices-item">
            <span className="voice-date">{new Date(v.created_at).toLocaleString()}</span>
            <div className="voice-controls">
              <button onClick={() => playVoice(v.audio)} className="btn btn-small btn-play">Play</button>
              <button onClick={() => deleteVoice(v.id)} className="btn btn-small btn-delete">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
