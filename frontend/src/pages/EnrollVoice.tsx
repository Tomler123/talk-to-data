import { useState, useEffect } from 'react';
import axios from '../api/axios';
import VoiceCapture from '../components/VoiceCapture';
import './EnrollVoice.css';

interface Phrase { id: number; text: string; }
interface VerifyResult {
  transcript: string;
  score: number;
  match: boolean;
}

export default function EnrollVoice() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loadingPhrases, setLoadingPhrases] = useState(true);
  const [phraseError, setPhraseError] = useState<string|null>(null);
  const [index, setIndex] = useState(0);
  const [audioList, setAudioList] = useState<(string|null)[]>([null, null, null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);

  // NEW: verification state
  const [verifyResult, setVerifyResult] = useState<VerifyResult|null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string|null>(null);

  // 1) Fetch the 3 phrases
  useEffect(() => {
    setLoadingPhrases(true);
    axios.get<Phrase[]>('/voice/phrases')
      .then(res => setPhrases(res.data))
      .catch(err => setPhraseError(err.response?.data?.message || err.message))
      .finally(() => setLoadingPhrases(false));
  }, []);

  // Reset verification on phrase change
  useEffect(() => {
    setVerifyResult(null);
    setVerifyError(null);
  }, [index]);

  // 2a) Save one audio sample
  const handleSave = (base64: string) => {
    const copy = [...audioList];
    copy[index] = base64;
    setAudioList(copy);
  };

  // 2b) Verify sample against phrase
  const handleVerify = async (base64: string) => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await axios.post<VerifyResult>('/voice/verify', {
        phrase_id: phrases[index].id,
        audio: base64
      });
      setVerifyResult(res.data);
    } catch (e: any) {
      setVerifyError(e.response?.data?.message || e.message);
      setVerifyResult(null);
    } finally {
      setVerifying(false);
    }
  };

  // 3) Submit all 3 once done
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/voice/enroll', {
        recordings: phrases.map((p, i) => ({ phrase_id: p.id, audio: audioList[i]! }))
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="enroll-page">
        <div className="enroll-container">🎉 Enrollment complete!</div>
      </div>
    );
  }

  if (loadingPhrases) {
    return (
      <div className="enroll-page">
        <div className="enroll-container">Loading phrases…</div>
      </div>
    );
  }
  if (phraseError) {
    return (
      <div className="enroll-page">
        <div className="enroll-container" style={{ color: 'red' }}>
          Error loading phrases: {phraseError}
        </div>
      </div>
    );
  }
  if (!phrases.length) {
    return (
      <div className="enroll-page">
        <div className="enroll-container" style={{ color: 'red' }}>
          No enrollment phrases found.
        </div>
      </div>
    );
  }

  const phrase = phrases[index];

  return (
    <div className="enroll-page">
      <div className="enroll-container">
        <h1>Enroll Default Phrases</h1>

        {/* Stepper */}
        <div className="stepper">
          {phrases.map((_, i) => {
            const status = i < index ? 'completed' : i === index ? 'current' : 'upcoming';
            return (
              <div key={i} className={`step ${status}`}>
                <div className="circle">{i + 1}</div>
              </div>
            );
          })}
        </div>

        <p>Phrase {index + 1} of {phrases.length}:</p>
        <blockquote>{phrase.text}</blockquote>

        {/* Record + verify */}
        <VoiceCapture onSave={(b64) => {
          handleSave(b64);
          handleVerify(b64);
        }} />

        {audioList[index] && (
          <audio controls src={`data:audio/webm;base64,${audioList[index]}`} />
        )}

        {/* Inline verification feedback */}
        {verifying && <p>Verifying…</p>}
        {verifyError && <p className="error">Verification error: {verifyError}</p>}
        {verifyResult && (
          <div className="verification-result">
            <p>Transcript: “{verifyResult.transcript}”</p>
            <p>
              Score: {(verifyResult.score * 100).toFixed(0)}% –{' '}
              {verifyResult.match
                ? <span className="text-green-600">✓ matches</span>
                : <span className="text-red-600">✕ did not match</span>}
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center space-x-2" style={{ marginTop: '1rem' }}>
          {index > 0 && (
            <button
              onClick={() => setIndex(i => i - 1)}
              className="button button-secondary"
            >
              Previous
            </button>
          )}

          {index < phrases.length - 1 ? (
            <button
              onClick={() => setIndex(i => i + 1)}
              disabled={!verifyResult?.match}
              className={`button ${verifyResult?.match ? 'button-primary' : 'button-disabled'}`}
            >
              Next Phrase
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!verifyResult?.match || loading}
              className={`button ${verifyResult?.match && !loading ? 'button-primary' : 'button-disabled'}`}
            >
              {loading ? 'Submitting…' : 'Finish Enrollment'}
            </button>
          )}
        </div>

        {error && <p className="error">Error: {error}</p>}
      </div>
    </div>
  );
}
