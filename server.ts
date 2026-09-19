/**
 * ============================================================================
 * Express Application Server & Vite Middleware Host
 * ============================================================================
 * 
 * Feature Description:
 * Express server entry point hosting the REST API for deterministic AST parsing,
 * symbol registry maintenance, agentic code migration, Modal serverless worker
 * dispatching, and Vite SPA middleware routing.
 * 
 * Use Cases:
 * 1. Serving `/api/agent/*` endpoints for AST analysis and building blocks.
 * 2. Serving `/api/modal/*` endpoints for distributed serverless simulation.
 * 3. Serving `/api/logs` endpoint to expose structured backend logs.
 * 4. Serving the Vite development middleware or static production client bundle.
 * ============================================================================
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { SERVER_CONFIG } from "./server/config";
import {
  getBuildingBlocks,
  addBuildingBlock,
  resetBuildingBlocks,
  analyzeFunctionDeterministic,
  runAgenticMigration,
} from "./server/agent";
import { dispatchModalMigration, checkModalStatus } from "./server/modalEngine";
import { logFunctionCall, logError, getRecentServerLogs } from "./server/logger";

/**
 * Boots the Express server and binds API routes and Vite middleware.
 */
async function startServer(): Promise<void> {
  logFunctionCall("server", "startServer", { port: SERVER_CONFIG.PORT, host: SERVER_CONFIG.HOST });

  const app = express();
  const PORT = SERVER_CONFIG.PORT;

  app.use(express.json({ limit: SERVER_CONFIG.BODY_LIMIT }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    logFunctionCall("server", "GET /api/health");
    res.json({
      status: "ok",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      geminiModel: SERVER_CONFIG.GEMINI_MODEL,
      timestamp: new Date().toISOString(),
    });
  });

  // GET Server Logs for diagnostic observability
  app.get("/api/logs", (_req, res) => {
    logFunctionCall("server", "GET /api/logs");
    res.json({ success: true, logs: getRecentServerLogs() });
  });

  // GET Core Building Blocks / Symbol Table
  app.get("/api/agent/mappings", (_req, res) => {
    logFunctionCall("server", "GET /api/agent/mappings");
    try {
      const mappings = getBuildingBlocks();
      res.json({ success: true, mappings });
    } catch (err: any) {
      logError("server", "GET /api/agent/mappings failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Add a new custom Building Block Mapping
  app.post("/api/agent/mappings", (req, res) => {
    logFunctionCall("server", "POST /api/agent/mappings", req.body);
    try {
      const { sourceType, targetType, category, isVectorized, notes } = req.body;
      if (!sourceType || !targetType) {
        return res.status(400).json({ success: false, error: "sourceType and targetType are required." });
      }
      const created = addBuildingBlock({
        sourceType,
        targetType,
        category: category || "primitive",
        isVectorized: !!isVectorized,
        notes: notes || "",
      });
      res.json({ success: true, mapping: created, allMappings: getBuildingBlocks() });
    } catch (err: any) {
      logError("server", "POST /api/agent/mappings failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Reset building blocks to defaults
  app.post("/api/agent/mappings/reset", (_req, res) => {
    logFunctionCall("server", "POST /api/agent/mappings/reset");
    try {
      const reset = resetBuildingBlocks();
      res.json({ success: true, mappings: reset });
    } catch (err: any) {
      logError("server", "POST /api/agent/mappings/reset failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Deterministic AST & Signature Analysis for any C++ function
  app.post("/api/agent/analyze-function", (req, res) => {
    logFunctionCall("server", "POST /api/agent/analyze-function", { codeLength: req.body?.cppCode?.length || 0 });
    try {
      const { cppCode } = req.body;
      if (!cppCode) {
        return res.status(400).json({ success: false, error: "cppCode is required." });
      }
      const analysis = analyzeFunctionDeterministic(cppCode);
      res.json({ success: true, analysis });
    } catch (err: any) {
      logError("server", "POST /api/agent/analyze-function failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Hybrid Agentic Migration (Gemini with structured schema)
  app.post("/api/agent/migrate-node", async (req, res) => {
    logFunctionCall("server", "POST /api/agent/migrate-node", { symbol: req.body?.symbol });
    try {
      const {
        symbol,
        cppCode,
        targetFramework = "PyTorch",
        targetDevice = "cuda",
        precision = "float64",
        upstreamDeps = [],
      } = req.body;

      if (!cppCode || !symbol) {
        return res.status(400).json({ success: false, error: "symbol and cppCode are required." });
      }

      const result = await runAgenticMigration(
        symbol,
        cppCode,
        targetFramework,
        targetDevice,
        precision,
        upstreamDeps
      );

      res.json({
        success: true,
        result,
        updatedBuildingBlocks: getBuildingBlocks(),
      });
    } catch (err: any) {
      logError("server", "POST /api/agent/migrate-node failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Modal Serverless Execution Engine Endpoint
  app.post("/api/modal/execute-task", async (req, res) => {
    logFunctionCall("server", "POST /api/modal/execute-task", { symbol: req.body?.symbol });
    try {
      const {
        nodeId,
        symbol,
        path: codePath,
        kind,
        cppCode,
        targetFramework = "PyTorch",
        targetDevice = "cuda",
        precision = "float64",
        upstreamDeps = [],
        testIds = [],
        workerConcurrency = 32,
      } = req.body;

      if (!symbol) {
        return res.status(400).json({ success: false, error: "symbol is required." });
      }

      const modalResult = await dispatchModalMigration({
        nodeId: nodeId || `modal_node_${Date.now()}`,
        symbol,
        path: codePath || `src/${symbol.toLowerCase()}.cpp`,
        kind: kind || "infrastructure",
        cppCode: cppCode || `// C++ implementation for ${symbol}`,
        targetFramework,
        targetDevice,
        precision,
        upstreamDeps,
        testIds,
        workerConcurrency,
      });

      res.json({
        success: true,
        result: modalResult,
      });
    } catch (err: any) {
      logError("server", "POST /api/modal/execute-task failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET Modal Cloud Connection & Diagnostics Status
  app.get("/api/modal/status", async (_req, res) => {
    logFunctionCall("server", "GET /api/modal/status");
    try {
      const status = await checkModalStatus();
      res.json({ success: true, status });
    } catch (err: any) {
      logError("server", "GET /api/modal/status failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware in dev; static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, SERVER_CONFIG.HOST, () => {
    console.log(`Server running on http://${SERVER_CONFIG.HOST}:${PORT}`);
  });
}

startServer();
