 
// Local development URLs - Force localhost for development
const LOCAL_API_URL = "http://localhost:14702";
const LOCAL_WS_URL = "ws://localhost:14703";
const LOCAL_MEDIA_URL = "http://localhost:14704";
const LOCAL_PROXY_URL = "http://localhost:14705";
 
// Self-hosted production URLs (used when building for production)
const PRODUCTION_API_URL = "https://stoat-dev.zasperhub.com/api";
const PRODUCTION_WS_URL = "wss://stoat-dev.zasperhub.com/ws";
const PRODUCTION_MEDIA_URL = "https://stoat-dev.zasperhub.com/autumn";
const PRODUCTION_PROXY_URL = "https://stoat-dev.zasperhub.com/january";
 
// Force localhost for development, use production URLs only for builds
const isDevelopment = import.meta.env.DEV;
 
// Prefer explicit VITE_* environment variables when provided (even in dev).
// This makes it possible to run the app inside Docker and point it at a
// remote backend (for example your EC2 host) without forcing localhost.
const DEFAULT_API_URL = (import.meta.env.VITE_API_URL as string) ?? (isDevelopment ? LOCAL_API_URL : PRODUCTION_API_URL);
 
const DEFAULT_WS_URL = (import.meta.env.VITE_WS_URL as string) ?? (isDevelopment ? LOCAL_WS_URL : PRODUCTION_WS_URL);
 
const DEFAULT_MEDIA_URL = (import.meta.env.VITE_MEDIA_URL as string) ?? (isDevelopment ? LOCAL_MEDIA_URL : PRODUCTION_MEDIA_URL);
 
const DEFAULT_PROXY_URL = (import.meta.env.VITE_PROXY_URL as string) ?? (isDevelopment ? LOCAL_PROXY_URL : PRODUCTION_PROXY_URL);
 
// Debug: Log the URLs being used
console.log("🚀 API Configuration:", {
  isDevelopment,
  DEFAULT_API_URL,
  DEFAULT_WS_URL,
  DEFAULT_MEDIA_URL,
  DEFAULT_PROXY_URL
});
 
export default {
  /**
   * Whether to emit additional debug information
   */
  DEBUG: import.meta.env.DEV || true,
  /**
   * What API server to connect to by default.
   */
  DEFAULT_API_URL,
  /**
   * Whether this is Revolt
   */
  IS_REVOLT: [
    "https://api.revolt.chat",
    "https://beta.revolt.chat/api",
    "https://revolt.chat/api",
    PRODUCTION_API_URL,
  ].includes(DEFAULT_API_URL),
  /**
   * What WS server to connect to by default.
   */
  DEFAULT_WS_URL,
  /**
   * What media server to connect to by default.
   */
  DEFAULT_MEDIA_URL,
  /**
   * What proxy server to connect to by default.
   */
  DEFAULT_PROXY_URL,
  /**
   * hCaptcha site key to use if enabled
   */
  HCAPTCHA_SITEKEY: import.meta.env.VITE_HCAPTCHA_SITEKEY as string,
  /**
   * Maximum number of replies a message can have
   */
  MAX_REPLIES: (import.meta.env.VITE_CFG_MAX_REPLIES as number) ?? 5,
  /**
   * Maximum number of attachments a message can have
   */
  MAX_ATTACHMENTS: (import.meta.env.VITE_CFG_MAX_ATTACHMENTS as number) ?? 5,
  /**
   * Maximum number of emoji a server can have
   */
  MAX_EMOJI: (import.meta.env.VITE_CFG_MAX_EMOJI as number) ?? 100,
  /**
   * Session ID to set during development.
   */
  DEVELOPMENT_SESSION_ID: import.meta.env.DEV
    ? (import.meta.env.VITE_SESSION_ID as string)
    : undefined,
  /**
   * Token to set during development.
   */
  DEVELOPMENT_TOKEN: import.meta.env.DEV
    ? (import.meta.env.VITE_TOKEN as string)
    : undefined,
  /**
   * User ID to set during development.
   */
  DEVELOPMENT_USER_ID: import.meta.env.DEV
    ? (import.meta.env.VITE_USER_ID as string)
    : undefined,
};