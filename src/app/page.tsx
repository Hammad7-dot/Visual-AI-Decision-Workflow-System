'use client';

import React, { useState, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState, addEdge, Connection } from '@xyflow/react';
import FlowEditor from '@/components/FlowEditor';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import NodeDrawer from '@/components/NodeDrawer';
import ExecutionLogsPanel from '@/components/ExecutionLogsPanel';
import { WorkflowNode, ExecutionLog } from '@/lib/types';

const INITIAL_NODES: Node[] = [
  {
    id: 'start-1',
    type: 'startNode',
    position: { x: 250, y: 50 },
    data: {
      label: 'Start Node',
      inputPayload: JSON.stringify({ userAge: 25, region: 'US', score: 85 }, null, 2),
      executionStatus: 'idle',
    },
  },
  {
    id: 'ai-1',
    type: 'aiDecisionNode',
    position: { x: 250, y: 200 },
    data: {
      label: 'Age Check',
      prompt: 'Check if userAge is >= 18. Return YES if user is an adult, otherwise NO.',
      executionStatus: 'idle',
    },
  },
  {
    id: 'action-yes',
    type: 'actionNode',
    position: { x: 100, y: 380 },
    data: {
      label: 'Approve User',
      actionType: 'approve',
      executionStatus: 'idle',
    },
  },
  {
    id: 'action-no',
    type: 'actionNode',
    position: { x: 400, y: 380 },
    data: {
      label: 'Reject User',
      actionType: 'reject',
      executionStatus: 'idle',
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e-start-ai',
    source: 'start-1',
    target: 'ai-1',
    animated: false,
  },
  {
    id: 'e-ai-yes',
    source: 'ai-1',
    sourceHandle: 'yes',
    target: 'action-yes',
    label: 'YES',
    animated: false,
  },
  {
    id: 'e-ai-no',
    source: 'ai-1',
    sourceHandle: 'no',
    target: 'action-no',
    label: 'NO',
    animated: false,
  },
];

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as WorkflowNode);
    setIsDrawerOpen(true);
  }, []);

  const handleAddNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 300, y: 150 + nodes.length * 80 },
      data: {
        label: type === 'startNode' ? 'Start Node' : type === 'aiDecisionNode' ? 'AI Decision' : 'Action Node',
        executionStatus: 'idle',
        ...(type === 'startNode' && { inputPayload: '{}' }),
        ...(type === 'aiDecisionNode' && { prompt: 'Evaluates workflow state' }),
        ...(type === 'actionNode' && { actionType: 'custom' }),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSaveNodeProperties = (updatedNode: WorkflowNode) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );
    setSelectedNode(updatedNode);
  };

  const addLog = (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
    const newLog: ExecutionLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleReset = () => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          executionStatus: 'idle',
          output: undefined,
          error: undefined,
          decision: undefined,
        },
      }))
    );
    setEdges((eds) => eds.map((e) => ({ ...e, animated: false })));
    setLogs([]);
  };

  const handleRun = async () => {
    if (isExecuting) return;
    setIsExecuting(true);

    // Reset status on all nodes & edges
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, executionStatus: 'idle', output: undefined, error: undefined, decision: undefined },
      }))
    );
    setEdges((eds) => eds.map((e) => ({ ...e, animated: false })));

    addLog({
      nodeId: 'system',
      nodeName: 'Workflow Engine',
      status: 'info',
      message: 'Dispatching execution request to Inngest and Core Engine...',
    });

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Execution failed on server');
      }

      const { steps = [] } = result;

      // Animate execution step-by-step
      for (const step of steps) {
        const { nodeId, status, decision, output, error, logs: stepLogs } = step;

        // Set node to running
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, executionStatus: 'running' } }
              : n
          )
        );

        // Highlight connected edges
        setEdges((eds) =>
          eds.map((e) =>
            e.source === nodeId || e.target === nodeId
              ? { ...e, animated: true }
              : e
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 800));

        // Update node to completed/error
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    executionStatus: status === 'COMPLETED' ? 'completed' : 'error',
                    decision,
                    output,
                    error,
                  },
                }
              : n
          )
        );

        // Add log entry
        const targetNode = nodes.find((n) => n.id === nodeId);
        const nodeName = (targetNode?.data?.label as string) || nodeId;

        if (stepLogs && Array.isArray(stepLogs)) {
          stepLogs.forEach((msg: string) => {
            addLog({
              nodeId,
              nodeName,
              status: status === 'COMPLETED' ? 'success' : 'error',
              message: msg,
            });
          });
        } else {
          addLog({
            nodeId,
            nodeName,
            status: status === 'COMPLETED' ? 'success' : 'error',
            message: `Executed step successfully.${decision ? ` Decision: ${decision}` : ''}`,
          });
        }
      }

      addLog({
        nodeId: 'system',
        nodeName: 'Workflow Engine',
        status: 'success',
        message: 'Workflow execution completed successfully.',
      });
    } catch (err: any) {
      addLog({
        nodeId: 'system',
        nodeName: 'Workflow Engine',
        status: 'error',
        message: `Execution error: ${err.message || err}`,
      });
    } finally {
      setIsExecuting(false);
      setEdges((eds) => eds.map((e) => ({ ...e, animated: false })));
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 text-slate-100">
      <Header
        isExecuting={isExecuting}
        onRun={handleRun}
        onReset={handleReset}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onAddNode={handleAddNode} />
        <main className="relative flex-1">
          <FlowEditor
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
          />
        </main>
        <ExecutionLogsPanel
          logs={logs}
          onClearLogs={() => setLogs([])}
        />
      </div>
      <NodeDrawer
        node={selectedNode}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveNodeProperties}
      />
    </div>
  );
}