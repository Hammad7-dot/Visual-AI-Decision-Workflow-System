import React, { useState, useEffect } from 'react';
import { WorkflowNode, AIDecisionNodeData, ActionNodeData } from '@/lib/types';
import { X, Bot, Zap, Trash2, Check } from 'lucide-react';

interface NodeDrawerProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (id: string, updatedData: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

export const NodeDrawer: React.FC<NodeDrawerProps> = ({ node, onClose, onUpdate, onDelete }) => {
  const [label, setLabel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (node) {
      setLabel((node.data as { label?: string }).label || '');
      setPrompt((node.data as AIDecisionNodeData).prompt || '');
      setDescription((node.data as AIDecisionNodeData).description || '');
      setMessage((node.data as ActionNodeData).message || '');
      setSavedSuccess(false);
    }
  }, [node]);

  if (!node) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (node.type === 'aiDecision') {
      onUpdate(node.id, { label, prompt, description });
    } else if (node.type === 'action') {
      onUpdate(node.id, { label, message });
    } else {
      onUpdate(node.id, { label });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center space-x-2">
          {node.type === 'aiDecision' ? (
            <Bot className="text-purple-400" size={20} />
          ) : (
            <Zap className="text-amber-400" size={20} />
          )}
          <h2 className="text-base font-semibold text-slate-100">
            Configure {node.type === 'aiDecision' ? 'AI Decision' : node.type === 'start' ? 'Start' : 'Action'} Node
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="flex-1 p-5 space-y-4 overflow-y-auto">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Node Title / Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            placeholder="e.g. Is Support Request?"
            required
          />
        </div>

        {node.type === 'aiDecision' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                AI Prompt (Decision Criteria)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
                placeholder="Ask a question that can be answered explicitly with YES or NO..."
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The LLM will evaluate this question against incoming input and output strictly <strong>YES</strong> or <strong>NO</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Description / Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                placeholder="Optional description of this step..."
              />
            </div>
          </>
        )}

        {node.type === 'action' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Action Outcome Payload / Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              placeholder="e.g. Escalate ticket to PagerDuty engineering on-call."
              required
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 px-3 py-2 rounded-lg border border-rose-900/50 transition"
          >
            <Trash2 size={14} />
            <span>Delete Node</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg shadow-lg shadow-purple-600/30 transition"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-300" /> : null}
            <span>{savedSuccess ? 'Saved!' : 'Save Node'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};