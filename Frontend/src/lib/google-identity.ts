export interface GoogleIdentity {
  initialize(options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void; auto_select: boolean; ux_mode: 'popup' }): void;
  renderButton(element: HTMLElement, options: { type: 'standard'; theme: 'outline'; size: 'large'; text: 'continue_with'; width: number }): void;
}

declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}

let loading: Promise<GoogleIdentity> | undefined;
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (!loading) {
    loading = new Promise<GoogleIdentity>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      const fail = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Google sign-in could not load. Check your connection or browser blocking settings, then retry.'));
      };
      const timeout = setTimeout(fail, 15_000);
      script.onerror = fail;
      script.onload = () => {
        clearTimeout(timeout);
        if (window.google?.accounts.id) resolve(window.google.accounts.id);
        else fail();
      };
      document.head.appendChild(script);
    }).catch(error => { loading = undefined; throw error; });
  }
  return loading;
}
