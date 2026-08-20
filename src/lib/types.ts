import { Node, Edge } from '@xyflow/react';

export type DecisionResult = 'YES' | 'NO';

export interface AIDecisionNodeData extends Record<string, unknown> {
  label: string;
  prompt: string;
  systemPrompt?: string;
  description?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  lastDecision?: DecisionResult;
  lastReasoning?: string;
  executionTimeMs?: number;
}

export interface StartNodeData extends Record<string, unknown> {
  label: string;
  inputKey: string;
  inputDescription: string;
  status?: 'idle' | 'running' | 'completed';
}

export interface ActionNodeData extends Record<string, unknown> {
  label: string;
  actionType: 'notification' | 'assign_ticket' | 'escalate' | 'log' | 'custom';
  message: string;
  status?: 'idle' | 'running' | 'completed';
}

export type WorkflowNode = Node<AIDecisionNodeData | StartNodeData | ActionNodeData>;

export interface ExecutionStepLog {
  stepId: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: 'start' | 'aiDecision' | 'action';
  decision?: DecisionResult;
  reasoning?: string;
  prompt?: string;
  inputPayload?: string;
  timestamp: string;
  durationMs: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface WorkflowExecutionState {
  executionId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  activeNodeId: string | null;
  activeEdgeId: string | null;
  logs: ExecutionStepLog[];
  visitedNodeIds: string[];
  visitedEdgeIds: string[];
  inputPayload: string;
  startTime?: string;
  endTime?: string;
}

export interface PresetWorkflow {
  id: string;
  name: string;
  description: string;
  defaultInput: string;
  nodes: WorkflowNode[];
  edges: Edge[];
}