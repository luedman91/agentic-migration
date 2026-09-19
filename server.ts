import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  getBuildingBlocks,
  addBuildingBlock,
  resetBuildingBlocks,
  analyzeFunctionDeterministic,
  runAgenticMigration,
} from "./server/agent";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // GET Core Building Blocks / Symbol Table
  app.get("/api/agent/mappings", (_req, res) => {
    try {
      const mappings = getBuildingBlocks();
      res.json({ success: true, mappings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Add a new custom Building Block Mapping
  app.post("/api/agent/mappings", (req, res) => {
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
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Reset building blocks to defaults
  app.post("/api/agent/mappings/reset", (_req, res) => {
    try {
      const reset = resetBuildingBlocks();
      res.json({ success: true, mappings: reset });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Deterministic AST & Signature Analysis for any C++ function
  app.post("/api/agent/analyze-function", (req, res) => {
    try {
      const { cppCode } = req.body;
      if (!cppCode) {
        return res.status(400).json({ success: false, error: "cppCode is required." });
      }
      const analysis = analyzeFunctionDeterministic(cppCode);
      res.json({ success: true, analysis });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Hybrid Agentic Migration (Gemini with structured Pydantic-like Schema)
  app.post("/api/agent/migrate-node", async (req, res) => {
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
      } = req.body;

      if (!cppCode || !symbol) {
        return res.status(400).json({ success: false, error: "symbol and cppCode are required." });
      }

      const result = await runAgenticMigration({
        nodeId: nodeId || `node_${Date.now()}`,
        symbol,
        path: codePath || `src/${symbol.toLowerCase()}.cpp`,
        kind: kind || "pure_math",
        cppCode,
        targetFramework,
        targetDevice,
        precision,
        upstreamDeps,
      });

      res.json({
        success: true,
        result,
        updatedBuildingBlocks: getBuildingBlocks(),
      });
    } catch (err: any) {
      console.error("Migration error:", err);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
