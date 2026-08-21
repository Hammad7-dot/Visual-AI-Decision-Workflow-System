import { inngest } from './client';
import OpenAI from 'openai';
import { WorkflowNode, ExecutionStepLog, AIDecisionNodeData, ActionNodeData } from '../types';
import { Edge } from '@xyflow/react';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

// Helper for LLM evaluation
async function evaluateDecisionWithLLM(
  promptText: string,
  inputPayload: string
): Promise<{ decision: 'YES' | 'NO'; reasoning: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey !== 'dummy-key-for-development' && apiKey.startsWith('sk-')) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI decision engine in an automated workflow.
Evaluate the user prompt against the input payload.
You MUST respond in strict JSON format with two fields:
- "decision": strictly either "YES" or "NO"
- "reasoning": a concise 1-2 sentence explanation of your decision.`,
          },
          {
            role: 'user',
            content: `Input Payload: "${inputPayload}"
Question/Prompt Criteria: "${promptText}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      const decision = (parsed.decision || '').toUpperCase() === 'YES' ? 'YES' : 'NO';
      const reasoning = parsed.reasoning || `Model evaluated prompt and selected ${decision}.`;
      return { decision, reasoning };
    } catch (err: unknown) {
      console.warn('OpenAI API call failed, falling back to smart heuristic evaluator:', err);
    }
  }

  // Smart Heuristic Evaluator (Deterministic fallback when API key is unconfigured)
  const lowerPayload = inputPayload.toLowerCase();
  const lowerPrompt = promptText.toLowerCase();

  const supportKeywords = ['support', 'help', 'issue', 'bug', 'broken', 'refund', 'login', 'error', 'assist', 'reset', 'pass'];
  const urgentKeywords = ['urgent', 'crash', 'down', 'critical', 'immediately', 'security', 'fraud', 'leak', 'hacked'];
  const highRiskKeywords = ['suspicious', 'hack', 'unusual', 'login from new device', 'vpn', 'ip change', 'anomalous'];

  let decision: 'YES' | 'NO' = 'NO';
  let reasoning = '';

  if (lowerPrompt.includes('support') || lowerPrompt.includes('help') || lowerPrompt.includes('issue')) {
    const matched = supportKeywords.some((k) => lowerPayload.includes(k));
    decision = matched ? 'YES' : 'NO';
    reasoning = matched
      ? `Detected support intent in input payload matching criteria.`
      : `No support keywords detected in payload. Evaluated as NO.`;
  } else if (lowerPrompt.includes('urgent') || lowerPrompt.includes('critical') || lowerPrompt.includes('high priority')) {
    const matched = urgentKeywords.some((k) => lowerPayload.includes(k));
    decision = matched ? 'YES' : 'NO';
    reasoning = matched
      ? `Detected urgent/critical markers in payload.`
      : `Payload does not indicate urgency. Evaluated as NO.`;
  } else if (lowerPrompt.includes('suspicious') || lowerPrompt.includes('fraud') || lowerPrompt.includes('risk')) {
    const matched = highRiskKeywords.some((k) => lowerPayload.includes(k));
    decision = matched ? 'YES' : 'NO';
    reasoning = matched
      ? `Flagged potential security/fraud risk indicators.`
      : `No high-risk pattern detected in transaction/event payload.`;
  } else {
    const affirmative = ['yes', 'true', 'accept', 'agree', 'escalate', 'support', 'high'];
    const matched = affirmative.some((k) => lowerPayload.includes(k));
    decision = matched ? 'YES' : 'NO';
    reasoning = matched
      ? `Input payload aligned with criteria keywords.`
      : `Input payload did not meet criteria thresholds.`;
  }

  return { decision, reasoning };
}

// Executes a single node in isolation - the unit of work wrapped by an Inngest step.
async function executeNodeStep(
  node: WorkflowNode,
  inputPayload: string,
  stepIndex: number
): Promise<ExecutionStepLog> {
  const nodeData = node.data;

  if (node.type === 'start') {
    return {
      stepId: `step-${stepIndex}`,
      nodeId: node.id,
      nodeLabel: (nodeData as { label?: string }).label || 'Start Event',
      nodeType: 'start',
      status: 'completed',
      timestamp: new Date().toLocaleTimeString(),
      durationMs: 15,
      reasoning: `Workflow execution started with payload: "${inputPayload}"`,
    };
  }

  if (node.type === 'aiDecision') {
    const aiData = nodeData as AIDecisionNodeData;
    const promptText = aiData.prompt || 'Is this valid?';
    const startTime = Date.now();
    const { decision, reasoning } = await evaluateDecisionWithLLM(promptText, inputPayload);
    const durationMs = Date.now() - startTime;

    return {
      stepId: `step-${stepIndex}`,
      nodeId: node.id,
      nodeLabel: aiData.label || 'AI Decision Node',
      nodeType: 'aiDecision',
      status: 'completed',
      timestamp: new Date().toLocaleTimeString(),
      durationMs,
      prompt: promptText,
      decision,
      reasoning,
    };
  }

  if (node.type === 'action') {
    const actionData = nodeData as ActionNodeData;
    return {
      stepId: `step-${stepIndex}`,
      nodeId: node.id,
      nodeLabel: actionData.label || 'Action Terminal',
      nodeType: 'action',
      status: 'completed',
      timestamp: new Date().toLocaleTimeString(),
      durationMs: 20,
      reasoning: actionData.message || 'Action executed successfully.',
    };
  }

  throw new Error(`Unknown node type: ${node.type}`);
}

// Pure edge-following logic - decides where the traversal goes next based on the
// step's outcome. Kept outside of any Inngest step since it does no async work.
function resolveNextNode(
  node: WorkflowNode,
  log: ExecutionStepLog,
  nodes: WorkflowNode[],
  edges: Edge[]
): { nextNode: WorkflowNode | undefined; visitedEdgeId: string | undefined } {
  if (node.type === 'start') {
    const outEdge = edges.find((e: Edge) => e.source === node.id);
    return {
      nextNode: outEdge ? nodes.find((n) => n.id === outEdge.target) : undefined,
      visitedEdgeId: outEdge?.id,
    };
  }

  if (node.type === 'aiDecision') {
    const handle = (log.decision || '').toLowerCase();
    const outEdges = edges.filter((e: Edge) => e.source === node.id);
    // Fall back to the single outgoing edge when sourceHandle isn't set (e.g. imported workflows).
    const matchingEdge =
      outEdges.find((e: Edge) => e.sourceHandle === handle) ??
      (outEdges.length === 1 ? outEdges[0] : undefined);
    return {
      nextNode: matchingEdge ? nodes.find((n) => n.id === matchingEdge.target) : undefined,
      visitedEdgeId: matchingEdge?.id,
    };
  }

  return { nextNode: undefined, visitedEdgeId: undefined };
}

const MAX_STEPS = 20;

// Synchronous traversal used by /api/execute for an immediate HTTP response.
// Runs outside of an Inngest step context, so it calls executeNodeStep directly.
export async function executeWorkflowCore(
  nodes: WorkflowNode[],
  edges: Edge[],
  inputPayload: string
) {
  const logs: ExecutionStepLog[] = [];
  const visitedEdgeIds: string[] = [];
  const activeNodeIdSet = new Set<string>();

  const startNode = nodes.find((n) => n.type === 'start');
  if (!startNode) {
    throw new Error('Workflow has no Start node!');
  }

  let currentNode: WorkflowNode | undefined = startNode;
  let stepIndex = 0;

  while (currentNode && stepIndex < MAX_STEPS) {
    stepIndex++;
    const nodeToExecute: WorkflowNode = currentNode;
    activeNodeIdSet.add(nodeToExecute.id);

    const log = await executeNodeStep(nodeToExecute, inputPayload, stepIndex);
    logs.push(log);

    const { nextNode, visitedEdgeId } = resolveNextNode(nodeToExecute, log, nodes, edges);
    if (visitedEdgeId) visitedEdgeIds.push(visitedEdgeId);
    currentNode = nextNode;
  }

  return {
    status: 'completed' as const,
    logs,
    visitedEdgeIds,
    activeNodeIds: Array.from(activeNodeIdSet),
    inputPayload,
  };
}

export const runAiWorkflow = inngest.createFunction(
  {
    id: 'execute-ai-workflow',
    name: 'Execute AI Decision Workflow',
    triggers: [{ event: 'workflow/run.requested' }],
  },
  async ({ event, step }: { event: { data: { nodes: WorkflowNode[]; edges: Edge[]; inputPayload: string } }; step: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const { nodes, edges, inputPayload } = event.data;

    const logs: ExecutionStepLog[] = [];
    const visitedEdgeIds: string[] = [];
    const activeNodeIdSet = new Set<string>();

    const startNode = nodes.find((n) => n.type === 'start');
    if (!startNode) {
      throw new Error('Workflow has no Start node!');
    }

    let currentNode: WorkflowNode | undefined = startNode;
    let stepIndex = 0;

    while (currentNode && stepIndex < MAX_STEPS) {
      stepIndex++;
      const nodeToExecute: WorkflowNode = currentNode;
      activeNodeIdSet.add(nodeToExecute.id);

      // Each node is its own durable, independently retried/memoized Inngest step.
      const log = await step.run(`execute-node-${nodeToExecute.id}-${stepIndex}`, () =>
        executeNodeStep(nodeToExecute, inputPayload, stepIndex)
      );
      logs.push(log);

      const { nextNode, visitedEdgeId } = resolveNextNode(nodeToExecute, log, nodes, edges);
      if (visitedEdgeId) visitedEdgeIds.push(visitedEdgeId);
      currentNode = nextNode;
    }

    return {
      status: 'completed' as const,
      logs,
      visitedEdgeIds,
      activeNodeIds: Array.from(activeNodeIdSet),
      inputPayload,
    };
  }
);