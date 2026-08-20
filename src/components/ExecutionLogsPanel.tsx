import React from 'react';
import { ExecutionStepLog, WorkflowExecutionState } from '@/lib/types';
import { Terminal, CheckCircle2, AlertCircle, Clock, Activity } from 'lucide-react';

interface ExecutionLogsPanelProps {
  executionState: WorkflowExecutionState;
  onClose?: () => void;
}

export const ExecutionLogsPanel: React.FC<ExecutionLogsPanelProps> = ({ executionState }) => {
  return (
    <div className="h-full bg-slate-950 border-l border-slate-800 flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-purple-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            Execution Telemetry & Logs
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              executionState.status === 'running'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                : executionState.status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : executionState.status === 'failed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {executionState.status}
          </span>
        </div>
      </div>

      {/* Input payload viewer */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800/80">
        <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span>INPUT PAYLOAD:</span>
        </div>
        <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 text-[11px] leading-relaxed break-words max-h-24 overflow-y-auto">
          {executionState.inputPayload || '(No input string provided)'}
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {executionState.logs.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-600 space-y-2">
            <Activity size={24} className="animate-pulse" />
            <p className="text-center text-[11px]">
              No active execution.
              <br /> Click &quot;Run Inngest Engine&quot; to trace live steps.
            </p>
          </div>
        ) : (
          executionState.logs.map((log: ExecutionStepLog, idx: number) => (
            <div
              key={`${log.stepId}-${idx}`}
              className={`p-3 rounded-lg border transition-all ${
                log.status === 'running'
                  ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                  : log.status === 'completed'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-rose-950/20 border-rose-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
                  <span className="text-purple-400 font-bold">#{idx + 1}</span>
                  <span>{log.nodeLabel}</span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Clock size={12} />
                  <span>{log.durationMs}ms</span>
                </div>
              </div>

              {log.nodeType === 'aiDecision' && (
                <div className="space-y-1.5 mt-2">
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500">Prompt:</span> &quot;{log.prompt}&quot;
                  </div>

                  {log.decision && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Outcome:</span>
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded text-xs ${
                          log.decision === 'YES'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {log.decision}
                      </span>
                    </div>
                  )}

                  {log.reasoning && (
                    <div className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                      <span className="text-purple-300 font-semibold">AI Reasoning:</span> {log.reasoning}
                    </div>
                  )}
                </div>
              )}

              {log.nodeType === 'action' && log.reasoning && (
                <div className="mt-2 text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                  <span className="font-semibold text-emerald-400">Action Output:</span> {log.reasoning}
                </div>
              )}

              {log.error && (
                <div className="mt-2 text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/60 flex items-center space-x-1">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{log.error}</span>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span>Timestamp: {log.timestamp}</span>
                {log.status === 'completed' && <CheckCircle2 size={12} className="text-emerald-400" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};