import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ActionNodeData } from '@/lib/types';
import { CheckCircle2, AlertTriangle, Send, FileText, Zap } from 'lucide-react';

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ActionNodeData;
  const status = nodeData.status || 'idle';

  const getIcon = () => {
    switch (nodeData.actionType) {
      case 'escalate':
        return <AlertTriangle size={18} className="text-amber-400" />;
      case 'assign_ticket':
        return <Send size={18} className="text-blue-400" />;
      case 'notification':
        return <Zap size={18} className="text-emerald-400" />;
      default:
        return <FileText size={18} className="text-slate-400" />;
    }
  };

  return (
    <div
      className={`relative w-64 rounded-xl bg-slate-900 border-2 shadow-xl transition-all duration-300 ${
        selected ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-slate-700 hover:border-slate-500'
      } ${status === 'completed' ? 'border-emerald-500/80 ring-2 ring-emerald-500/30' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      <div className="p-3 bg-amber-950/20 rounded-t-lg border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">{getIcon()}</div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 leading-tight">
              {nodeData.label || 'Action Result'}
            </h3>
            <span className="text-[10px] text-amber-400 font-mono tracking-wide uppercase">
              Terminal Outcome
            </span>
          </div>
        </div>
        {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      </div>

      <div className="p-3">
        <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-mono">
          {nodeData.message || 'Workflow terminal output action.'}
        </p>
      </div>
    </div>
  );
});

ActionNode.displayName = 'ActionNode';