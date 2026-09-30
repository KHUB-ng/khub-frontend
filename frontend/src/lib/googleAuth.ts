/**
 * Google Identity Services (GIS) — popup sign-in.
 *
 * We use the **ID token** flow, not the redirect/OAuth-code flow. The browser
 * gets a signed ID token from Google and we POST it to
 * `POST /api/auth/google`, where the backend verifies it against Google's
 * JWKS. Nothing ever redirects back to us — which is why there is no
 * "Authorized redirect URI" to register in the Google console, only
 * JavaScript origins.
 *
 * The client id here is a *public* identifier (it ships in every page that
 * offers "Sign in with Google"). It is not the client secret and grants
 * nothing on its own. It still comes from the build env so a bad deploy
 * fails visibly instead of silently at click time.
 */

const GIS_SRC = "https://accounts.google.com/gsi/client";

interface CredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (opts: {
    client_id: string;
    callback: (r: CredentialResponse) => void;
    ux_mode?: string;
  }) => void;
  prompt: (notification?: (n: unknown) => void) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Google sign-in. Check your connection."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Open Google's account chooser and resolve with a signed ID token.
 * The caller posts that token to the backend — nothing else is exchanged.
 */
export async function signInWithGoogle(clientId?: string): Promise<string> {
  if (!clientId) throw new Error("Google sign-in is not configured.");

  await loadGis();

  const accountsId = window.google?.accounts?.id;
  if (!accountsId) {
    throw new Error("Google sign-in is unavailable in this browser.");
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    accountsId.initialize({
      client_id: clientId,
      ux_mode: "popup",
      callback: (response) => {
        if (settled) return;
        if (!response.credential) {
          settled = true;
          reject(new Error("Google did not return a sign-in token."));
          return;
        }
        settled = true;
        resolve(response.credential);
      },
    });

    accountsId.prompt((notification: unknown) => {
      // Surfaced when the user dismisses the chooser without choosing.
      if (settled) return;
      const reason = (notification as { isDismissedMoment?: () => boolean }) ?? {};
      if (typeof reason.isDismissedMoment === "function" && reason.isDismissedMoment()) {
        settled = true;
        reject(new Error("Google sign-in was cancelled."));
      }
    });
  });
}

/** True when a client id was supplied at build time. */
export function isGoogleConfigured(clientId?: string): boolean {
  return Boolean(clientId && clientId.trim());
}
