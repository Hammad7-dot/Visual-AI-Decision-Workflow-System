import React, { useRef } from 'react';
import { PRESET_WORKFLOWS } from '@/lib/presets';
import { Play, Download, Upload, Trash2, Bot, Zap, Sparkles } from 'lucide-react';
import { PresetWorkflow } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
        <Select
          defaultValue="support-router"
          onValueChange={(value) => {
            const found = PRESET_WORKFLOWS.find((p) => p.id === value);
            if (found) onSelectPreset(found);
          }}
        >
          <SelectTrigger
            aria-label="Select preset workflow template"
            className="bg-slate-950 text-xs text-slate-300 border-slate-800 focus-visible:border-purple-500 focus-visible:ring-purple-500/30"
          >
            <SelectValue placeholder="Select Preset Template...">
              {(value: string | null) => {
                const preset = PRESET_WORKFLOWS.find((p) => p.id === value);
                return preset ? `Preset: ${preset.name}` : 'Select Preset Template...';
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
            {PRESET_WORKFLOWS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id} className="text-xs focus:bg-slate-800 focus:text-slate-100">
                Preset: {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Node creation controls */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={onAddAIDecisionNode}
          variant="outline"
          className="bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold border-purple-500/30"
        >
          <Bot size={15} />
          <span>+ AI Decision</span>
        </Button>

        <Button
          onClick={onAddActionNode}
          variant="outline"
          className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border-amber-500/30"
        >
          <Zap size={15} />
          <span>+ Action Node</span>
        </Button>
      </div>

      {/* Input payload & Execute Trigger */}
      <div className="flex items-center space-x-2 flex-1 max-w-xl">
        <Input
          type="text"
          value={inputPayload}
          onChange={(e) => setInputPayload(e.target.value)}
          placeholder="Input Payload (e.g., Customer inquiry or prompt)..."
          className="flex-1 bg-slate-950 border-slate-800 text-xs text-slate-200 focus-visible:border-purple-500 focus-visible:ring-purple-500/30 font-mono"
        />

        <Button
          onClick={onExecute}
          disabled={isExecuting}
          className={`font-bold text-xs shadow-lg ${
            isExecuting
              ? 'bg-purple-800 text-purple-300 cursor-not-allowed opacity-75'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
          }`}
        >
          <Play size={14} className={isExecuting ? 'animate-spin' : 'fill-current'} />
          <span>{isExecuting ? 'Executing...' : 'Run Workflow'}</span>
        </Button>
      </div>

      {/* Utilities: Export / Import / Clear */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={onExport}
          title="Export Workflow JSON"
          variant="outline"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs"
        >
          <Download size={14} />
          <span className="hidden lg:inline">Export</span>
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          title="Import Workflow JSON"
          variant="outline"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs"
        >
          <Upload size={14} />
          <span className="hidden lg:inline">Import</span>
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="application/json"
          className="hidden"
        />

        <Button
          onClick={onClear}
          title="Clear Canvas"
          variant="outline"
          size="icon"
          className="bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border-slate-700"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
};
