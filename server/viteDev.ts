/**
 * ============================================================================
 * Vite Dev Middleware & Shared HMR Binding
 * ============================================================================
 *
 * Feature Description:
 * Builds Vite middleware-mode HMR options that attach the websocket upgrade
 * handler to the same Node HTTP server as Express. Vite's default standalone
 * HMR listener binds port 24678 and throws when a second `npm run dev` starts.
 *
 * Use Cases:
 * 1. Single-port local development (HTTP + HMR on the Express listen port).
 * 2. Disabling HMR when DISABLE_HMR=true (Google AI Studio agent edits).
 * 3. Preventing "WebSocket server error: Port 24678 is already in use".
 * ============================================================================
 */

import type { Server as HttpServer } from "node:http";
import { logFunctionCall } from "./logger";

/**
 * Reports whether Vite HMR and file watching should stay off.
 *
 * @returns True only when DISABLE_HMR is the string "true"
 */
export function isHmrDisabled(): boolean {
  const disabled = process.env.DISABLE_HMR === "true";
  logFunctionCall("viteDev", "isHmrDisabled", { disabled });
  return disabled;
}

/**
 * Returns Vite `server.ws` config that reuses the Express HTTP server.
 *
 * @param httpServer - Node HTTP server that will accept websocket upgrades
 * @returns `false` when HMR is disabled; otherwise `{ server: httpServer }`
 */
export function getViteWsConfig(httpServer: HttpServer): false | { server: HttpServer } {
  const disabled = isHmrDisabled();
  logFunctionCall("viteDev", "getViteWsConfig", { disabled });
  return disabled ? false : { server: httpServer };
}

/**
 * Returns Vite `server.watch` config aligned with the HMR disable flag.
 *
 * @returns `null` to disable watching, or an empty object for default watching
 */
export function getViteWatchConfig(): null | Record<string, never> {
  const disabled = isHmrDisabled();
  logFunctionCall("viteDev", "getViteWatchConfig", { disabled });
  return disabled ? null : {};
}
