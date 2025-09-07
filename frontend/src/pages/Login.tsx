import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import VoiceCapture from "../components/VoiceCapture";
import './Auth.css';

export default function Login() {
  
  // credential form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  
  // voice form
  const [phrase, setPhrase] = useState<string>("");
  const [phraseId, setPhraseId] = useState<number>(0);
  const [audio, setAudio] = useState<string>("");   // base64
  const [attempts, setAttempts] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const navigate = useNavigate();

  // fetch one seeded phrase on mount
  useEffect(() => {
    axios.get("/voice/phrases")
      .then(res => {
        if (res.data.length > 0) {
          const p = res.data[0];
          setPhrase(p.text);
          setPhraseId(p.id);
        }
      })
      .catch(() => {
        setFeedback("Failed to load voice phrases.");
        setShowCredentials(true);
      });
  }, []);


  const handleVoiceSubmit = async () => {
    try {
      const res = await axios.post("/auth/login/voice", {
        phrase_id: phraseId,
        audio
      });
      const token = res.data.access_token;
      localStorage.setItem("access_token", token);
      alert("Voice login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      const conf = err.response?.data?.confidence;
      setFeedback(
        conf
          ? `Confidence ${conf.toFixed(3)} – try again.`
          : "Voice login failed."
      );
      setAttempts(a => a + 1);
      setAudio("");
      if (attempts + 1 >= 3) {
        setShowCredentials(true);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/login", { username, password });
      const token = res.data.access_token;
      localStorage.setItem("access_token", token);
      alert("Login successful!");
      navigate("/dashboard");
    } catch {
      alert("Login failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        {showCredentials ? (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
        ) : (
          <>
            <h3>Login with Voice</h3>
            <p>Sample Phrase: <em>"{phrase}"</em></p>
            {audio && (
              <audio src={audio} controls style={{ marginBottom: "1rem" }} />
            )}
            <VoiceCapture
              onSave={(b64: string) => setAudio(b64)}
            />
            <button
              onClick={handleVoiceSubmit}
              disabled={!audio}
              style={{ marginTop: "1rem" }}
            >
              Submit Voice ({attempts}/3)
            </button>
            {feedback && <p className="error">{feedback}</p>}
          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            Or{' '}
            <button
              type="button"
              onClick={() => setShowCredentials(true)}
              className="link-button"
            >
              login with credentials
            </button>
          </p>
          </>
        )}
      </div>
    </div>
  );
}
