import React, { useRef } from 'react';
import { PRESET_WORKFLOWS } from '@/lib/presets';
import { Play, Plus, Download, Upload, Trash2, Bot, Zap, Sparkles } from 'lucide-react';
import { PresetWorkflow } from '@/lib/types';

interface WorkflowToolbarProps {
  onExecute: () => void;
  isExecuting: boolean;
  onAddAIDecisionNode: () => void;
  onAddActionNode: () => void;
  onSelectPreset: (preset: PresetWorkflow) => void;
  onExport: () => void;
  onImport: (jsonData: string) => void;
  onClear: () => void;
  inputPayload: string;
  setInputPayload: (payload: string) => void;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onExecute,
  isExecuting,
  onAddAIDecisionNode,
  onAddActionNode,
  onSelectPreset,
  onExport,
  onImport,
  onClear,
  inputPayload,
  setInputPayload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImport(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Brand / Presets */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight">
              Visual AI Workflow Engine
            </h1>
            <p className="text-[11px] text-slate-400">Powered by Inngest & React Flow</p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden md:block" />
        <select
          onChange={(e) => {
            const found = PRESET_WORKFLOWS.find((p) => p.id === e.target.value);
            if (found) onSelectPreset(found);
          }}
          className="bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
          defaultValue="support-router"
        >
          <option value="" disabled>
            Select Preset Template...
          </option>
          {PRESET_WORKFLOWS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              Preset: {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Node creation controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onAddAIDecisionNode}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-500/30 transition"
        >
          <Bot size={15} />
          <span>+ AI Decision</span>
        </button>

        <button
          onClick={onAddActionNode}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 transition"
        >
          <Zap size={15} />
          <span>+ Action Node</span>
        </button>
      </div>

      {/* Input payload & Execute Trigger */}
      <div className="flex items-center space-x-2 flex-1 max-w-xl">
        <input
          type="text"
          value={inputPayload}
          onChange={(e) => setInputPayload(e.target.value)}
          placeholder="Input Payload (e.g., Customer inquiry or prompt)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
        />

        <button
          onClick={onExecute}
          disabled={isExecuting}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg font-bold text-xs shadow-lg transition ${
            isExecuting
              ? 'bg-purple-800 text-purple-300 cursor-not-allowed opacity-75'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
          }`}
        >
          <Play size={14} className={isExecuting ? 'animate-spin' : 'fill-current'} />
          <span>{isExecuting ? 'Executing...' : 'Run Inngest Engine'}</span>
        </button>
      </div>

      {/* Utilities: Export / Import / Clear */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onExport}
          title="Export Workflow JSON"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs flex items-center space-x-1"
        >
          <Download size={14} />
          <span className="hidden lg:inline">Export</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Workflow JSON"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs flex items-center space-x-1"
        >
          <Upload size={14} />
          <span className="hidden lg:inline">Import</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="application/json"
          className="hidden"
        />

        <button
          onClick={onClear}
          title="Clear Canvas"
          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};