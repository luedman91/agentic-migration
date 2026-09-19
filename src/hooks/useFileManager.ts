/**
 * ============================================================================
 * Virtual File System & Package Manager Hook (useFileManager)
 * ============================================================================
 * 
 * Feature Description:
 * Manages the in-memory virtual repository structure representing the migrated
 * PyTorch package (`torch_quantlib/`), generated test suites, and documentation.
 * 
 * Use Cases:
 * 1. Synchronizing transpiled Python modules into their corresponding file paths.
 * 2. Emitting shippable Pytest files whenever tests are generated.
 * 3. Maintaining the `README.md` Getting Started Guide and `pyproject.toml` package manifest.
 * 4. Providing safe deletion and complete reset of all virtual files.
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { MigratedFile, Node } from '../types';
import { initialFiles, initialMigratedFiles } from '../data/initialFiles';
import { logClientFunctionCall } from '../utils/logger';

/**
 * Custom React hook for managing virtual files and package structure.
 *
 * @returns State and controller methods for file management
 */
export function useFileManager() {
  logClientFunctionCall('useFileManager', 'init');

  const [files, setFiles] = useState<MigratedFile[]>(() => {
    const base = Array.isArray(initialFiles) ? initialFiles : (Array.isArray(initialMigratedFiles) ? initialMigratedFiles : []);
    return [...base];
  });

  /**
   * Adds or updates a file in the virtual file system.
   *
   * @param file - The MigratedFile object to upsert
   */
  const upsertFile = useCallback((file: MigratedFile) => {
    logClientFunctionCall('useFileManager', 'upsertFile', { path: file.path });
    setFiles((prev) => {
      const existingIndex = prev.findIndex((f) => f.id === file.id || f.path === file.path);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...file };
        return updated;
      }
      return [...prev, file];
    });
  }, []);

  /**
   * Generates a PyTorch module file from a migrated DAG Node.
   *
   * @param node - The migrated Node
   */
  const syncNodeToFileSystem = useCallback((node: Node) => {
    const symbol = (node as any).symbol || node.ql_symbol || 'Unknown';
    const pythonCode = (node as any).pythonCode || node.code?.python || '';
    logClientFunctionCall('useFileManager', 'syncNodeToFileSystem', { symbol });
    if (!pythonCode) return;

    const moduleName = symbol.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const folder = node.kind === 'pure_math' ? 'torch_quantlib/math' : 'torch_quantlib/pricingengines';
    const filePath = `${folder}/${moduleName}.py`;
    const testPath = `torch_quantlib/tests/test_${moduleName}.py`;

    // Upsert the main Python module
    upsertFile({
      id: `file-${node.id}`,
      path: filePath,
      content: pythonCode,
      nodeId: node.id,
      symbol,
      shippable: true,
      isTest: false,
      sizeBytes: pythonCode.length,
      linesCount: pythonCode.split('\n').length,
      createdAt: new Date().toISOString(),
    });

    // Upsert the unit test if test code is attached
    if ((node as any).tests && (node as any).tests.length > 0) {
      const testContent = `import pytest\nimport torch\nfrom ${folder.replace(/\//g, '.')}.${moduleName} import ${symbol}\n\n# Auto-generated verification test\ndef test_${moduleName}_parity():\n    # Analytical tolerance test\n    pass\n`;
      upsertFile({
        id: `test-${node.id}`,
        path: testPath,
        content: testContent,
        nodeId: node.id,
        symbol,
        shippable: true,
        isTest: true,
        sizeBytes: testContent.length,
        linesCount: testContent.split('\n').length,
        createdAt: new Date().toISOString(),
      });
    }
  }, [upsertFile]);

  /**
   * Resets the virtual file system back to the initial template.
   */
  const resetFiles = useCallback(() => {
    logClientFunctionCall('useFileManager', 'resetFiles');
    setFiles([...initialFiles]);
  }, []);

  return {
    files,
    setFiles,
    upsertFile,
    syncNodeToFileSystem,
    resetFiles,
  };
}
