/**
 * Utility to manage visitor sandbox session tokens in the browser.
 * Ensures every visitor interacts with an isolated simulation sandbox.
 */

export const getSessionId = () => {
  if (typeof window === 'undefined') return 'baseline';
  let sid = localStorage.getItem('mercury_session_id');
  if (!sid) {
    sid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mercury_session_id', sid);
  }
  return sid;
};

export const getSessionHeaders = () => {
  return { 'x-session-id': getSessionId() };
};

export const resetVisitorSession = async (apiUrl) => {
  const currentSid = getSessionId();
  try {
    if (apiUrl) {
      await fetch(`${apiUrl}/session/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': currentSid
        }
      });
    }
  } catch (err) {
    console.warn('Backend session reset call failed:', err);
  } finally {
    // Generate fresh session token
    const newSid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mercury_session_id', newSid);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mercury_session_reset', { detail: { sessionId: newSid } }));
    }
    return newSid;
  }
};

