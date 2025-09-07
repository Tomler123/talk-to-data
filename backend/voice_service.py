# backend/voice_service.py
import os
import tempfile
import re
import whisper
from rapidfuzz import fuzz
import torchaudio
from speechbrain.inference.speaker import EncoderClassifier

# load Whisper model once (CPU-only)
_model = whisper.load_model("base")

# threshold for phrase verification (80%)
_THRESHOLD = 0.8


_spkr_model = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    run_opts={"device": "cpu"}
)

def extract_embedding(webm_bytes: bytes) -> list[float]:
    """
    Decode raw WebM, resample if needed, and return a 1‑D speaker embedding.
    """

    # write to a temp .webm file so torchaudio/FFmpeg can decode
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(webm_bytes)
        tmp.flush()
        tmp_path = tmp.name
    wav, sr = torchaudio.load(tmp_path)
    # clean up
    try:
        os.unlink(tmp_path)
    except OSError:
        pass

    # SpeechBrain ECAPA-TDNN expects 16 kHz
    if sr != 16000:
        wav = torchaudio.transforms.Resample(sr, 16000)(wav)

    # Run ECAPA‑TDNN
    emb_tensor = _spkr_model.encode_batch(wav)

    # Remove batch dim if present
    if emb_tensor.dim() > 1:
        emb = emb_tensor.squeeze(0)
    else:
        emb = emb_tensor

    # If you still have extra dims (e.g. [time, feat]), average over all but the last
    # so that you end up with shape [feat].
    while emb.dim() > 1:
        emb = emb.mean(dim=0)

    return emb.cpu().tolist()

def transcribe_and_match(audio_bytes: bytes, phrase: str) -> tuple[str, float, bool]:
    """
    Transcribe `audio_bytes` with Whisper and compare to `phrase`.
    Returns (transcript, score [0–1], match).
    """
    # write out to a temp .webm file so whisper can load via ffmpeg
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    # CPU inference
    result = _model.transcribe(tmp_path, language="en", fp16=False)
    transcript = result["text"].strip()

    # normalize (lower, strip punctuation)
    def normalize(s: str) -> str:
        return re.sub(r"[^\w\s]", "", s.lower())

    ph_norm = normalize(phrase)
    tr_norm = normalize(transcript)

    raw_score = fuzz.ratio(ph_norm, tr_norm)
    score = raw_score / 100.0
    match = score >= _THRESHOLD

    return transcript, score, match