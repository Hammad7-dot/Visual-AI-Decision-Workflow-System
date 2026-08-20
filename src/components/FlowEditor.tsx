import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  OnNodesChange,
  OnEdgesChange,
  addEdge,
  Connection,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AIDecisionNode } from './nodes/AIDecisionNode';
import { StartNode } from './nodes/StartNode';
import { ActionNode } from './nodes/ActionNode';
import { WorkflowNode, WorkflowExecutionState } from '@/lib/types';

interface FlowEditorProps {
  nodes: WorkflowNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<WorkflowNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodeSelect: (node: WorkflowNode | null) => void;
  executionState: WorkflowExecutionState;
}

export const FlowEditor: React.FC<FlowEditorProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onNodeSelect,
  executionState,
}) => {
  const nodeTypes = useMemo(
    () => ({
      aiDecision: AIDecisionNode,
      start: StartNode,
      action: ActionNode,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const isYesPath = params.sourceHandle === 'yes';
      const isNoPath = params.sourceHandle === 'no';

      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.sourceHandle || 'default'}-${params.target}`,
        animated: true,
        label: isYesPath ? 'YES' : isNoPath ? 'NO' : undefined,
        style: {
          stroke: isYesPath ? '#22c55e' : isNoPath ? '#ef4444' : '#94a3b8',
          strokeWidth: 2.5,
        },
        labelStyle: {
          fill: isYesPath ? '#15803d' : isNoPath ? '#b91c1c' : '#475569',
          fontWeight: 700,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isVisited = executionState.visitedEdgeIds.includes(edge.id);
      const isActive = executionState.activeEdgeId === edge.id;

      if (isActive) {
        return {
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: '#a855f7',
            strokeWidth: 4,
            filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))',
          },
        };
      }

      if (isVisited) {
        return {
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: edge.sourceHandle === 'yes' ? '#10b981' : edge.sourceHandle === 'no' ? '#f43f5e' : '#38bdf8',
            strokeWidth: 3,
          },
        };
      }

      return edge;
    });
  }, [edges, executionState.activeEdgeId, executionState.visitedEdgeIds]);

  return (
    <div className="w-full h-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeSelect(node as WorkflowNode)}
        onPaneClick={() => onNodeSelect(null)}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
      >
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 fill-slate-300" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'aiDecision') return '#a855f7';
            if (node.type === 'start') return '#38bdf8';
            return '#f59e0b';
          }}
          className="!bg-slate-900 !border-slate-800 rounded-lg overflow-hidden"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
      </ReactFlow>
    </div>
  );
};