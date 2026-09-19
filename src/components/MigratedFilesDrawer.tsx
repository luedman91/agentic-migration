import { useState, useMemo } from 'react';
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
  Sparkles,
  Layers,
  Terminal
} from 'lucide-react';

interface MigratedFilesDrawerProps {
  files: MigratedFile[];
  onResetFiles: () => void;
  isOpen: boolean;
  onClose: () => void;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  file?: MigratedFile;
  children: TreeNode[];
}

export default function MigratedFilesDrawer({
  files,
  onResetFiles,
  isOpen,
  onClose,
}: MigratedFilesDrawerProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    files.length > 0 ? (files.find((f) => f.path === 'README.md')?.id || files[0].id) : null
  );
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'torch_quantlib': true,
    'torch_quantlib/math': true,
    'torch_quantlib/pricingengines': true,
    'torch_quantlib/tests': true,
    'examples': true,
  });

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.id === selectedFileId) || (files.length > 0 ? files[0] : null);

  const shippableCount = files.filter((f) => f.shippable).length;
  const testCount = files.filter((f) => f.isTest).length;
  const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  // Build recursive directory tree
  const folderTree = useMemo(() => {
    const root: TreeNode = { name: 'root', fullPath: '', isFolder: true, children: [] };

    files.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (isFile) {
          current.children.push({
            name: part,
            fullPath: currentPath,
            isFolder: false,
            file: file,
            children: [],
          });
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

    // Sort: folders first, then alphabetical
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
  }, [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCopyCode = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      files.forEach((file) => {
        zip.file(file.path, file.content);
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
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders[node.fullPath] ?? true;
      return (
        <div key={node.fullPath || node.name} className="select-none">
          <button
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
            <div>
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const file = node.file!;
    const isSelected = (currentFile && currentFile.id === file.id) || selectedFileId === file.id;

    let icon = <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    if (file.path.endsWith('.md')) icon = <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    else if (file.path.endsWith('.toml') || file.path.endsWith('.txt')) icon = <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    else if (file.isTest) icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    else if (file.path.startsWith('examples/')) icon = <Play className="w-3.5 h-3.5 text-violet-400 shrink-0" />;

    return (
      <button
        key={file.id}
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
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-950 text-sky-400 border border-sky-800/80 rounded-lg shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Migrated PyTorch Repository Explorer
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {files.length} files • {(totalBytes / 1024).toFixed(1)} KB
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Standalone, ready-to-run repository with getting-started documentation, runnable benchmark scripts, and test suite.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Download Zip button */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping || files.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
              title="Download entire migrated repo as a ready-to-use zip"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Packaging ZIP...' : 'Download Repo (.zip)'}</span>
            </button>

            {/* Reset / Delete */}
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-3 py-1.5 rounded-lg border border-rose-800/70 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset & Delete</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shipping Manifest Banner */}
        <div className="px-6 py-2 bg-sky-950/40 border-b border-sky-900/40 flex flex-wrap items-center justify-between text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong>Distribution Structure:</strong> Ready for <code className="text-sky-300">pip install -e .</code> or wheel distribution (<code className="text-sky-300">torch_quantlib-1.34.0.whl</code>). Includes getting started guide and shippable library tests.
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
          <div className="w-72 sm:w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col">
            <div className="p-3 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                Folder Hierarchy
              </span>
              <span className="font-mono text-[11px]">{files.length} files</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {files.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <FileCode2 className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
                  No migrated files generated yet. Start the migration pipeline to generate PyTorch modules.
                </div>
              ) : (
                folderTree.children.map((child) => renderTreeNode(child, 0))
              )}
            </div>

            {/* Quick action bar inside sidebar */}
            <div className="p-2.5 border-t border-slate-800 bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="font-mono">Ready to run</span>
              <button
                onClick={() => {
                  const readme = files.find((f) => f.path === 'README.md');
                  if (readme) setSelectedFileId(readme.id);
                }}
                className="text-xs text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>Open Guide</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Right Pane */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {currentFile ? (
              <>
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span className="text-white font-semibold">{currentFile.path}</span>
                    <span className="text-slate-500">
                      ({currentFile.linesCount} lines • {(currentFile.sizeBytes / 1024).toFixed(1)} KB)
                    </span>
                    {currentFile.path === 'README.md' && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-sans font-medium text-[11px]">
                        Getting Started Guide
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
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
                      <pre className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">
                        {currentFile.content}
                      </pre>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap">{currentFile.content}</pre>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-mono">
                Select a file from the folder tree to inspect code
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
                    This will delete all {files.length} generated PyTorch modules, configuration files, and test suites, reset all node migration statuses, and revert the DAG back to initial baseline.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
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
