/**
 * ============================================================================
 * Migrated PyTorch Repository Explorer & Getting Started Guide (Files & Guide)
 * ============================================================================
 * 
 * Feature Description:
 * Provides an interactive file tree explorer, syntax-aware code previewer,
 * getting-started documentation reader, and one-click ZIP exporter for all
 * transpiled Python modules, Pytest suites, and packaging files.
 * 
 * Use Cases:
 * 1. Inspecting generated PyTorch modules, mathematical primitives, and option
 *    pricing engines organized in their target directory structure.
 * 2. Reading the comprehensive `README.md` Getting Started Guide with quickstart
 *    instructions, benchmark snippets, and PyTorch API usage examples.
 * 3. Downloading the entire standalone repository as a valid `torch_quantlib_migrated_repo.zip`
 *    ready for `pip install -e .` or automated CI execution.
 * 4. Safely clearing and resetting generated virtual files back to the project baseline.
 * 5. Robust defensive rendering that never triggers white pages even with empty or
 *    partially formed file trees.
 * ============================================================================
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MigratedFile } from '../types';
import JSZip from 'jszip';
import {
  FileCode2,
  Trash2,
  Download,
  CheckCircle2,
  Package,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Copy,
  Check,
  X,
  AlertTriangle,
  Play,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';
import { logClientFunctionCall } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';

interface MigratedFilesDrawerProps {
  files: MigratedFile[];
  onResetFiles: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  file?: MigratedFile;
  children: TreeNode[];
}

/**
 * Builds a hierarchical directory tree structure from a flat array of MigratedFiles.
 *
 * @param fileList - Array of migrated files
 * @returns Root TreeNode containing nested directories and files
 */
export function buildFolderTree(fileList: MigratedFile[]): TreeNode {
  logClientFunctionCall('MigratedFilesDrawer', 'buildFolderTree', { fileCount: fileList?.length || 0 });

  const root: TreeNode = { name: 'root', fullPath: '', isFolder: true, children: [] };
  if (!Array.isArray(fileList) || fileList.length === 0) {
    return root;
  }

  fileList.forEach((file) => {
    if (!file || !file.path) return;

    // Normalize path by stripping leading slashes
    const cleanPath = file.path.replace(/^\/+/, '');
    const parts = cleanPath.split('/').filter((p) => p.trim().length > 0);

    if (parts.length === 0) return;

    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');

      if (isFile) {
        // Prevent duplicate file entries in the same folder
        const existingIdx = current.children.findIndex((c) => !c.isFolder && c.name === part);
        const node: TreeNode = {
          name: part,
          fullPath: currentPath,
          isFolder: false,
          file,
          children: [],
        };
        if (existingIdx >= 0) {
          current.children[existingIdx] = node;
        } else {
          current.children.push(node);
        }
      } else {
        let folder = current.children.find((c) => c.isFolder && c.name === part);
        if (!folder) {
          folder = {
            name: part,
            fullPath: currentPath,
            isFolder: true,
            children: [],
          };
          current.children.push(folder);
        }
        current = folder;
      }
    });
  });

  // Sort nodes: folders first, then alphabetically
  const sortTree = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isFolder === b.isFolder) {
        return a.name.localeCompare(b.name);
      }
      return a.isFolder ? -1 : 1;
    });
    node.children.forEach(sortTree);
  };

  sortTree(root);
  return root;
}

/**
 * Main MigratedFilesDrawer content component
 */
function MigratedFilesDrawerContent({
  files = [],
  onResetFiles,
  isOpen,
  onClose,
}: MigratedFilesDrawerProps) {
  // Sanitize input files array defensively
  const safeFiles = useMemo(() => {
    if (!Array.isArray(files)) return [];
    return files.filter((f): f is MigratedFile => !!f && typeof f.path === 'string');
  }, [files]);

  // Initial selection prioritizes README.md (the Getting Started Guide)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(() => {
    if (safeFiles.length === 0) return null;
    const readme = safeFiles.find((f) => f.path === 'README.md');
    return readme ? readme.id : safeFiles[0].id;
  });

  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    torch_quantlib: true,
    'torch_quantlib/math': true,
    'torch_quantlib/pricingengines': true,
    'torch_quantlib/tests': true,
    'torch_quantlib/tests/integration': true,
    examples: true,
  });

  // Synchronize selection if the currently selected file was removed
  useEffect(() => {
    if (safeFiles.length > 0) {
      const exists = safeFiles.some((f) => f.id === selectedFileId);
      if (!exists) {
        const readme = safeFiles.find((f) => f.path === 'README.md');
        setSelectedFileId(readme ? readme.id : safeFiles[0].id);
      }
    } else {
      setSelectedFileId(null);
    }
  }, [safeFiles, selectedFileId]);

  if (!isOpen) return null;

  // Active file determination
  const currentFile =
    safeFiles.find((f) => f.id === selectedFileId) || (safeFiles.length > 0 ? safeFiles[0] : null);

  const shippableCount = safeFiles.filter((f) => f.shippable).length;
  const testCount = safeFiles.filter((f) => f.isTest).length;
  const totalBytes = safeFiles.reduce((acc, f) => acc + (Number(f.sizeBytes) || 0), 0);

  // Build recursive directory tree
  const folderTree = useMemo(() => buildFolderTree(safeFiles), [safeFiles]);

  /**
   * Toggles folder expansion state in the file tree.
   *
   * @param path - Normalized folder path
   */
  const toggleFolder = useCallback((path: string) => {
    logClientFunctionCall('MigratedFilesDrawer', 'toggleFolder', { path });
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  /**
   * Copies the active file content to user clipboard.
   */
  const handleCopyCode = useCallback(() => {
    if (!currentFile || !currentFile.content) return;
    logClientFunctionCall('MigratedFilesDrawer', 'handleCopyCode', { path: currentFile.path });
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(currentFile.content).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [currentFile]);

  /**
   * Bundles all virtual files into a downloadable ZIP repository.
   */
  const handleDownloadZip = useCallback(async () => {
    logClientFunctionCall('MigratedFilesDrawer', 'handleDownloadZip', { fileCount: safeFiles.length });
    try {
      setIsZipping(true);
      const zip = new JSZip();

      safeFiles.forEach((file) => {
        if (file && file.path && typeof file.content === 'string') {
          zip.file(file.path, file.content);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'torch_quantlib_migrated_repo.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip package:', err);
    } finally {
      setIsZipping(false);
    }
  }, [safeFiles]);

  /**
   * Selects the README.md guide file
   */
  const handleOpenGuide = useCallback(() => {
    logClientFunctionCall('MigratedFilesDrawer', 'handleOpenGuide');
    const readme = safeFiles.find((f) => f.path === 'README.md');
    if (readme) {
      setSelectedFileId(readme.id);
    }
  }, [safeFiles]);

  /**
   * Renders a directory or file node within the tree view recursively.
   */
  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    if (node.isFolder) {
      const isExpanded = expandedFolders[node.fullPath] ?? true;
      return (
        <div key={node.fullPath || node.name} className="select-none">
          <button
            type="button"
            onClick={() => toggleFolder(node.fullPath)}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            className="w-full text-left py-1 px-2 rounded-md text-xs font-mono text-slate-300 hover:bg-slate-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="font-semibold text-slate-200">{node.name}</span>
          </button>
          {isExpanded && (
            <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const file = node.file;
    if (!file) return null;

    const isSelected =
      (currentFile && currentFile.id === file.id) || selectedFileId === file.id;

    let icon = <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    if (file.path.endsWith('.md')) {
      icon = <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    } else if (file.path.endsWith('.toml') || file.path.endsWith('.txt')) {
      icon = <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    } else if (file.isTest) {
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    } else if (file.path.startsWith('examples/')) {
      icon = <Play className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
    }

    return (
      <button
        key={file.id || node.fullPath}
        type="button"
        onClick={() => setSelectedFileId(file.id)}
        style={{ paddingLeft: `${depth * 14 + 16}px` }}
        className={`w-full text-left py-1.5 px-2 rounded-md text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
          isSelected
            ? 'bg-sky-950/80 border border-sky-800 text-sky-200'
            : 'hover:bg-slate-800/60 text-slate-300'
        }`}
      >
        {icon}
        <span className="truncate flex-1">{node.name}</span>
        {file.path === 'README.md' && (
          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
            Guide
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-950 text-sky-400 border border-sky-800/80 rounded-lg shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Migrated PyTorch Repository Explorer & Guide
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {safeFiles.length} files &bull; {(totalBytes / 1024).toFixed(1)} KB
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Standalone, production-grade PyTorch package with getting-started guide, runnable test suite, and packaging manifests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Download Zip button */}
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping || safeFiles.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
              title="Download entire migrated repo as a ready-to-use zip"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Packaging ZIP...' : 'Download Repo (.zip)'}</span>
            </button>

            {/* Reset / Delete */}
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-3 py-1.5 rounded-lg border border-rose-800/70 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset & Delete</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shipping Manifest Banner */}
        <div className="px-6 py-2 bg-sky-950/40 border-b border-sky-900/40 flex flex-wrap items-center justify-between text-xs text-sky-200 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong>Distribution Structure:</strong> Ready for <code className="text-sky-300">pip install -e .</code> or wheel distribution. Includes getting started documentation and shippable library tests.
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Shippable Modules: {shippableCount}</span>
            <span>Shipped Tests: {testCount}</span>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Left Pane */}
          <div className="w-72 sm:w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                Folder Hierarchy
              </span>
              <span className="font-mono text-[11px]">{safeFiles.length} files</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {safeFiles.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <FileCode2 className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
                  No migrated files generated yet. Start the migration pipeline to generate PyTorch modules.
                </div>
              ) : (
                folderTree.children.map((child) => renderTreeNode(child, 0))
              )}
            </div>

            {/* Quick action bar inside sidebar */}
            <div className="p-2.5 border-t border-slate-800 bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span className="font-mono">Ready to run</span>
              <button
                type="button"
                onClick={handleOpenGuide}
                className="text-xs text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>Open Guide (README)</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Right Pane */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {currentFile ? (
              <>
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2 font-mono truncate">
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-white font-semibold truncate">{currentFile.path}</span>
                    <span className="text-slate-500 shrink-0">
                      ({currentFile.linesCount || (currentFile.content ? currentFile.content.split('\n').length : 0)} lines &bull; {((Number(currentFile.sizeBytes) || (currentFile.content ? currentFile.content.length : 0)) / 1024).toFixed(1)} KB)
                    </span>
                    {currentFile.path === 'README.md' && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-sans font-medium text-[11px] shrink-0">
                        Getting Started Guide
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Content'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-5 overflow-auto font-mono text-xs text-slate-200 bg-slate-950 leading-relaxed">
                  {currentFile.path.endsWith('.md') ? (
                    <div className="max-w-3xl font-sans text-slate-300 space-y-4 leading-normal">
                      <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl mb-4 text-xs font-sans text-indigo-200 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>
                          <strong>Getting Started Guide:</strong> This documentation is bundled inside the root of your migrated package.
                        </span>
                      </div>
                      <pre className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {currentFile.content || '# No content available'}
                      </pre>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap">{currentFile.content || '# Empty file'}</pre>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500 font-mono space-y-3">
                <FileCode2 className="w-10 h-10 text-slate-600 opacity-60" />
                <p>Select a file from the folder tree to inspect code and documentation</p>
                {safeFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenGuide}
                    className="px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900/60 transition-colors"
                  >
                    Open Getting Started Guide (README.md)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal for Reset */}
        {showConfirmReset && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-950 text-rose-400 rounded-lg border border-rose-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">Confirm Reset & Delete Files</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    This will delete all {safeFiles.length} generated PyTorch modules, configuration files, and test suites, reset all node migration statuses, and revert the DAG back to initial baseline.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logClientFunctionCall('MigratedFilesDrawer', 'confirmResetFiles');
                    setShowConfirmReset(false);
                    onResetFiles();
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors cursor-pointer"
                >
                  Yes, Delete All & Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main exported component wrapped in an ErrorBoundary to guarantee zero white screens.
 */
export default function MigratedFilesDrawer(props: MigratedFilesDrawerProps) {
  if (!props.isOpen) return null;

  return (
    <ErrorBoundary
      fallbackTitle="Migrated Files & Guide Explorer"
      onReset={props.onClose}
    >
      <MigratedFilesDrawerContent {...props} />
    </ErrorBoundary>
  );
}
