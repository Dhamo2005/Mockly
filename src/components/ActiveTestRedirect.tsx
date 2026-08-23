import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function ActiveTestRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTestSessions = useStore((state) => state.activeTestSessions);

  useEffect(() => {
    // Find an active session that is NOT paused
    const activeSession = Object.values(activeTestSessions).find(
      (session) => !session.isPaused
    );

    if (activeSession) {
      const targetPath = `/test/${activeSession.testId}`;
      // If we are not already on the test page for this active test, redirect to it
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [activeTestSessions, location.pathname, navigate]);

  return null;
}
