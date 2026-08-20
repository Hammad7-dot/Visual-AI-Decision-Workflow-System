import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AIDecisionNodeData } from '@/lib/types';
import { Bot, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const AIDecisionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as AIDecisionNodeData;
  const status = nodeData.status || 'idle';
  const lastDecision = nodeData.lastDecision;

  return (
    <div
      className={`relative w-72 rounded-xl bg-slate-900 border-2 shadow-xl transition-all duration-300 ${
        selected ? 'border-purple-500 ring-2 ring-purple-500/40' : 'border-slate-700 hover:border-slate-500'
      } ${
        status === 'running'
          ? 'border-purple-400 ring-4 ring-purple-500/30 animate-pulse shadow-purple-500/20'
          : status === 'completed'
          ? 'border-slate-600 shadow-emerald-500/5'
          : ''
      }`}
    >
      {/* Top Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-purple-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Card Header */}
      <div className="p-3 bg-slate-800/80 rounded-t-lg border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 leading-tight">
              {nodeData.label || 'AI Decision Node'}
            </h3>
            <span className="text-[10px] text-purple-400 font-mono tracking-wide uppercase">
              Evaluator Step
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {status === 'running' && (
          <span className="flex items-center text-xs text-purple-400 font-medium bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
            <Loader2 className="w-3 h-3 animate-spin mr-1" /> Evaluating
          </span>
        )}
        {status === 'completed' && lastDecision && (
          <span
            className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${
              lastDecision === 'YES'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {lastDecision === 'YES' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            {lastDecision}
          </span>
        )}
      </div>

      {/* Card Body / Prompt */}
      <div className="p-3 space-y-2">
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed min-h-[50px] max-h-[90px] overflow-y-auto">
          "{nodeData.prompt || 'Define decision question prompt...'}"
        </div>

        {nodeData.lastReasoning && (
          <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded border border-slate-700/50">
            <span className="font-semibold text-purple-300">Reasoning:</span> {nodeData.lastReasoning}
          </div>
        )}
      </div>

      {/* Handles Footer: YES (Green Left/Bottom) and NO (Red Right/Bottom) */}
      <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-slate-800/80 text-[11px] font-bold tracking-wider">
        {/* YES Output */}
        <div className="relative flex items-center text-emerald-400 space-x-1 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30">
          <span>YES</span>
          <Handle
            type="source"
            id="yes"
            position={Position.Bottom}
            className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-slate-900 !-bottom-2 transition-transform hover:scale-125"
          />
        </div>

        {/* NO Output */}
        <div className="relative flex items-center text-rose-400 space-x-1 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-500/30">
          <span>NO</span>
          <Handle
            type="source"
            id="no"
            position={Position.Bottom}
            className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-slate-900 !-bottom-2 transition-transform hover:scale-125"
          />
        </div>
      </div>
    </div>
  );
});

AIDecisionNode.displayName = 'AIDecisionNode';