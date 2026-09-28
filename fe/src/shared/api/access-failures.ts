type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToAccessFailures(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// Capture the current page's subscribers when a request begins. Responses from a
// previous route/account must not replace the new page with a 404.
export function captureAccessFailureReporter(path: string) {
  const recipients = /^(\/teams(?:\/|\?|$)|\/matches(?:\/|\?|$)|\/inquiries(?:\/|\?|$)|\/users\/(?:me|profile)(?:\?|$))/.test(path)
    ? [...listeners] : [];
  return () => {
    for (const listener of recipients) {
      if (listeners.has(listener)) listener();
    }
  };
}
