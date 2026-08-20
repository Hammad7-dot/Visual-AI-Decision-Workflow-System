'use client';

import React, { useState, useCallback } from 'react';
import { Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { FlowEditor } from '@/components/FlowEditor';
import { WorkflowToolbar } from '@/components/WorkflowToolbar';
import { NodeDrawer } from '@/components/NodeDrawer';
import { ExecutionLogsPanel } from '@/components/ExecutionLogsPanel';
import { PRESET_WORKFLOWS } from '@/lib/presets';
import {
  WorkflowNode,
  WorkflowExecutionState,
  PresetWorkflow,
  AIDecisionNodeData,
  ActionNodeData,
} from '@/lib/types';

const DEFAULT_PRESET = PRESET_WORKFLOWS[0];

const IDLE_EXECUTION_STATE: WorkflowExecutionState = {
  executionId: null,
  status: 'idle',
  activeNodeId: null,
  activeEdgeId: null,
  logs: [],
  visitedNodeIds: [],
  visitedEdgeIds: [],
  inputPayload: '',
};

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(DEFAULT_PRESET.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(DEFAULT_PRESET.edges);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [inputPayload, setInputPayload] = useState(DEFAULT_PRESET.defaultInput);
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>(IDLE_EXECUTION_STATE);

  const isExecuting = executionState.status === 'running';

  const onNodeSelect = useCallback((node: WorkflowNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleAddAIDecisionNode = () => {
    const id = `aiDecision-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'aiDecision',
        position: { x: 300, y: 150 + nds.length * 80 },
        data: {
          label: 'New AI Decision',
          prompt: 'Evaluate the input and decide YES or NO.',
        } as AIDecisionNodeData,
      },
    ]);
  };

  const handleAddActionNode = () => {
    const id = `action-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'action',
        position: { x: 300, y: 150 + nds.length * 80 },
        data: {
          label: 'New Action',
          actionType: 'custom',
          message: 'Action executed.',
        } as ActionNodeData,
      },
    ]);
  };

  const handleUpdateNode = (id: string, updatedData: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updatedData } } : node
      )
    );
    setSelectedNode((prev) => (prev && prev.id === id ? { ...prev, data: { ...prev.data, ...updatedData } } : prev));
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNode(null);
  };

  const handleSelectPreset = (preset: PresetWorkflow) => {
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setInputPayload(preset.defaultInput);
    setExecutionState(IDLE_EXECUTION_STATE);
    setSelectedNode(null);
  };

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges, inputPayload }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.nodes && parsed.edges) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        if (typeof parsed.inputPayload === 'string') setInputPayload(parsed.inputPayload);
        setExecutionState(IDLE_EXECUTION_STATE);
        setSelectedNode(null);
      }
    } catch (err) {
      console.error('Failed to import workflow JSON:', err);
    }
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setExecutionState(IDLE_EXECUTION_STATE);
    setSelectedNode(null);
  };

  const handleExecute = async () => {
    if (isExecuting) return;

    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle', lastDecision: undefined, lastReasoning: undefined } }))
    );
    setExecutionState({
      ...IDLE_EXECUTION_STATE,
      status: 'running',
      inputPayload,
      startTime: new Date().toISOString(),
    });

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges, inputPayload }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Execution failed on server');
      }

      const { logs = [], visitedEdgeIds = [], activeNodeIds = [] } = result;

      for (const log of logs) {
        setNodes((nds) =>
          nds.map((n) => (n.id === log.nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n))
        );
        setExecutionState((prev) => ({ ...prev, activeNodeId: log.nodeId, logs: [...prev.logs, log] }));

        await new Promise((resolve) => setTimeout(resolve, 500));

        setNodes((nds) =>
          nds.map((n) =>
            n.id === log.nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: log.status === 'completed' ? 'completed' : 'failed',
                    lastDecision: log.decision,
                    lastReasoning: log.reasoning,
                  } as WorkflowNode['data'],
                }
              : n
          )
        );
      }

      setExecutionState((prev) => ({
        ...prev,
        status: 'completed',
        activeNodeId: null,
        activeEdgeId: null,
        visitedNodeIds: activeNodeIds,
        visitedEdgeIds,
        endTime: new Date().toISOString(),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setExecutionState((prev) => ({ ...prev, status: 'failed', endTime: new Date().toISOString() }));
      console.error('Execution error:', message);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 text-slate-100">
      <WorkflowToolbar
        onExecute={handleExecute}
        isExecuting={isExecuting}
        onAddAIDecisionNode={handleAddAIDecisionNode}
        onAddActionNode={handleAddActionNode}
        onSelectPreset={handleSelectPreset}
        onExport={handleExport}
        onImport={handleImport}
        onClear={handleClear}
        inputPayload={inputPayload}
        setInputPayload={setInputPayload}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex-1">
          <FlowEditor
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setEdges={setEdges}
            onNodeSelect={onNodeSelect}
            executionState={executionState}
          />
        </main>
        <div className="w-96 shrink-0">
          <ExecutionLogsPanel executionState={executionState} onClose={() => setExecutionState(IDLE_EXECUTION_STATE)} />
        </div>
      </div>
      <NodeDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onUpdate={handleUpdateNode}
        onDelete={handleDeleteNode}
      />
    </div>
  );
}
