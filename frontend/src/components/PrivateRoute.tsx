// src/components/PrivateRoute.tsx

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, isVoiceVerified } from '../utils/auth';
import Identify from '../pages/Identify';

interface PrivateRouteProps {
  roles?: string[];
  children: React.ReactElement;
}

export default function PrivateRoute({ roles, children }: PrivateRouteProps) {
  // 1️⃣ Auth & role gating (unchanged)
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const userRole = getUserRole();
  if (roles && !roles.includes(userRole || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  // 2️⃣ Local state for voice-check status
  const [voiceOk, setVoiceOk] = useState<boolean>(() => isVoiceVerified(15));

  // Optional: if someone manually updates the token elsewhere,
  // we could re-check at mount.
  useEffect(() => {
    if (!voiceOk) {
      setVoiceOk(isVoiceVerified(15));
    }
  }, []);

  // 3️⃣ If voice isn't verified, show your modal overlay
  if (!voiceOk) {
    return (
      <>
        {/* blur & disable the protected page in the background */}
        <div style={{ filter: 'blur(2px)', pointerEvents: 'none' }}>
          {children}
        </div>

        {/* full-screen modal */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            {/* onSuccess directly flips state → modal goes away */}
            <Identify onSuccess={() => setVoiceOk(true)} />
          </div>
        </div>
      </>
    );
  }

  // 4️⃣ All checks passed → render the page
  return children;
}
