// src/components/VoiceCapture.tsx
import { useState, useRef, type JSX } from 'react';

interface VoiceCaptureProps {
  onSave: (base64: string) => void;
}

export default function VoiceCapture({ onSave }: VoiceCaptureProps): JSX.Element {
  // explicitly type the ref so it can hold a MediaRecorder or null
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState<boolean>(false);

  const startRecording = async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    // type the chunks array
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e: BlobEvent) => {
      chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          // cast to string so split() is available
          const resultString = reader.result as string;
          const base64 = resultString.split(',')[1];
          onSave(base64);
        }
      };
      reader.readAsDataURL(blob);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = (): void => {
    // safe-call in case current is null
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
}
