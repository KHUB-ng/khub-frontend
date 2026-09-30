/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_API_URL: string
  /**
   * Backend base URL. Absent in dev — the Vite dev server proxies /api to
   * https://api.khub.com.ng server-side, which sidesteps the backend's
   * hardcoded CORS allow-list (khub.com.ng origins). Set for production:
   * VITE_API_BASE_URL=https://api.khub.com.ng
   */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
