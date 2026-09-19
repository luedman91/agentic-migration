import React, { useState } from 'react';
import { SymbolMapping, BuildingBlockCategory } from '../types';
import {
  X,
  Plus,
  RotateCcw,
  Sparkles,
  Search,
  Layers,
  Cpu,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface BuildingBlocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: SymbolMapping[];
  onAddMapping: (mapping: Omit<SymbolMapping, 'id'>) => Promise<void>;
  onResetMappings: () => Promise<void>;
}

export default function BuildingBlocksModal({
  isOpen,
  onClose,
  mappings,
  onAddMapping,
  onResetMappings,
}: BuildingBlocksModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [sourceType, setSourceType] = useState('');
  const [targetType, setTargetType] = useState('');
  const [category, setCategory] = useState<BuildingBlockCategory>('primitive');
  const [isVectorized, setIsVectorized] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredMappings = mappings.filter((m) => {
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch =
      m.sourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.notes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceType.trim() || !targetType.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddMapping({
        sourceType: sourceType.trim(),
        targetType: targetType.trim(),
        category,
        isVectorized,
        notes: notes.trim() || 'User-defined building block',
      });
      setSourceType('');
      setTargetType('');
      setNotes('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadgeColor = (cat: BuildingBlockCategory) => {
    switch (cat) {
      case 'primitive':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'math_op':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'container':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'domain_object':
        return 'bg-amber-950 text-amber-300 border-amber-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100">Core Building Blocks & Symbol Registry</h2>
                <span className="px-2 py-0.5 text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-mono">
                  Deterministic Layer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-defined type mappings and mathematical primitives provided as the grounding contract for the Gemini agent.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational banner on Pydantic/Deterministic grounding */}
        <div className="px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-900/40 flex items-start gap-2.5 text-xs text-indigo-200">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong>Hybrid Architecture Protocol:</strong> The agent never invents primitive types.
            During migration, Clang AST matches against these strict rules, injecting resolved tensor types
            and broadcasting primitives directly into the prompt and Pydantic validation schema.
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            {['all', 'primitive', 'math_op', 'container', 'domain_object'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 flex-1 max-w-xs ml-auto">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search symbol or type..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block</span>
            </button>
            <button
              onClick={onResetMappings}
              title="Reset to default QuantLib building blocks"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Form Accordion */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-slate-950/80 border-b border-indigo-900/50 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Define New Core Building Block Mapping
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Source C++ Type/Symbol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Matrix, QL_REAL"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target Python / Torch Expression</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. torch.Tensor"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BuildingBlockCategory)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="primitive">Primitive</option>
                  <option value="math_op">Math Operator</option>
                  <option value="container">Container</option>
                  <option value="domain_object">Domain Object</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vectorization Status</label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isVectorized}
                    onChange={(e) => setIsVectorized(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <span>Supports Batch Tensors</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Compiler Notes / Autograd Directives</label>
              <input
                type="text"
                placeholder="e.g. Autograd Jacobian differentiable with broadcast dimension (B, N)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium cursor-pointer"
              >
                {isSubmitting ? 'Registering...' : 'Save Building Block'}
              </button>
            </div>
          </form>
        )}

        {/* Table View */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-2 font-medium">SOURCE SYMBOL (C++)</th>
                <th className="pb-2 font-medium">TARGET EXPRESSION (PYTORCH)</th>
                <th className="pb-2 font-medium">CATEGORY</th>
                <th className="pb-2 font-medium">VECTORIZED</th>
                <th className="pb-2 font-medium">COMPILER DIRECTIVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredMappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 pr-3 font-mono font-semibold text-amber-300">
                    {m.sourceType}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-cyan-300">
                    {m.targetType}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${getCategoryBadgeColor(
                        m.category
                      )}`}
                    >
                      {m.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    {m.isVectorized ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tensor Ready
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">Scalar only</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px] max-w-xs truncate" title={m.notes}>
                    {m.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMappings.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No building blocks match the search criteria.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Total Active Building Blocks: <strong className="text-slate-200">{mappings.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
