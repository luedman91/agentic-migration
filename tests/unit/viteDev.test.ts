/**
 * ============================================================================
 * Unit Tests: Vite Dev HMR Binding (viteDev.test.ts)
 * ============================================================================
 *
 * Feature Description:
 * Validates that HMR either attaches to the shared HTTP server or is fully
 * disabled, so Vite never opens a standalone websocket on port 24678.
 * ============================================================================
 */

import { describe, it, expect, afterEach } from "vitest";
import type { Server as HttpServer } from "node:http";
import { getViteWatchConfig, getViteWsConfig, isHmrDisabled } from "../../server/viteDev";

describe("Vite shared HMR binding", () => {
  const originalFlag = process.env.DISABLE_HMR;
  const fakeServer = { listen: () => undefined } as unknown as HttpServer;

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.DISABLE_HMR;
    } else {
      process.env.DISABLE_HMR = originalFlag;
    }
  });

  it("attaches HMR to the Express HTTP server when DISABLE_HMR is unset", () => {
    delete process.env.DISABLE_HMR;
    expect(isHmrDisabled()).toBe(false);
    expect(getViteWsConfig(fakeServer)).toEqual({ server: fakeServer });
    expect(getViteWatchConfig()).toEqual({});
  });

  it("disables HMR and file watching when DISABLE_HMR is true", () => {
    process.env.DISABLE_HMR = "true";
    expect(isHmrDisabled()).toBe(true);
    expect(getViteWsConfig(fakeServer)).toBe(false);
    expect(getViteWatchConfig()).toBeNull();
  });

  it("treats DISABLE_HMR=false as HMR enabled", () => {
    process.env.DISABLE_HMR = "false";
    expect(isHmrDisabled()).toBe(false);
    expect(getViteWsConfig(fakeServer)).toEqual({ server: fakeServer });
  });
});
