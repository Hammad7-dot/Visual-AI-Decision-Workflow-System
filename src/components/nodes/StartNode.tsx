import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { StartNodeData } from '@/lib/types';
import { Play, Loader2 } from 'lucide-react';

export const StartNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as StartNodeData;
  const status = nodeData.status || 'idle';

  return (
    <div
      className={`relative w-64 rounded-xl bg-slate-900 border-2 shadow-xl transition-all duration-300 ${
        selected ? 'border-sky-500 ring-2 ring-sky-500/40' : 'border-slate-700 hover:border-slate-500'
      } ${status === 'running' ? 'border-sky-400 ring-4 ring-sky-500/30 animate-pulse' : ''}`}
    >
      <div className="p-3 bg-sky-950/40 rounded-t-lg border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Play size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 leading-tight">
              {nodeData.label || 'Workflow Start'}
            </h3>
            <span className="text-[10px] text-sky-400 font-mono tracking-wide uppercase">Trigger Event</span>
          </div>
        </div>
        {status === 'running' && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
      </div>

      <div className="p-3 space-y-1.5 text-xs">
        <div className="text-slate-400">
          <span className="font-semibold text-slate-300">Input Payload:</span> {nodeData.inputKey || 'userMessage'}
        </div>
        <div className="text-[11px] text-slate-500 italic">
          {nodeData.inputDescription || 'Accepts JSON or raw user prompt string.'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-sky-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';