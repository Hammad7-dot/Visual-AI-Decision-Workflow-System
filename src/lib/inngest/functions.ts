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

  while (currentNode && stepIndex < 20) {
    stepIndex++;
    const nodeToExecute: WorkflowNode = currentNode;
    activeNodeIdSet.add(nodeToExecute.id);
    const nodeData = nodeToExecute.data;

    if (nodeToExecute.type === 'start') {
      logs.push({
        stepId: `step-${stepIndex}`,
        nodeId: nodeToExecute.id,
        nodeLabel: (nodeData as { label?: string }).label || 'Start Event',
        nodeType: 'start',
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 15,
        reasoning: `Workflow execution started with payload: "${inputPayload}"`,
      });

      const outEdge: Edge | undefined = edges.find((e: Edge) => e.source === nodeToExecute.id);
      if (outEdge) {
        visitedEdgeIds.push(outEdge.id);
        currentNode = nodes.find((n) => n.id === outEdge.target);
      } else {
        currentNode = undefined;
      }
    } else if (nodeToExecute.type === 'aiDecision') {
      const aiData = nodeData as AIDecisionNodeData;
      const promptText = aiData.prompt || 'Is this valid?';
      const startTime = Date.now();
      const { decision, reasoning } = await evaluateDecisionWithLLM(promptText, inputPayload);
      const durationMs = Date.now() - startTime;

      logs.push({
        stepId: `step-${stepIndex}`,
        nodeId: nodeToExecute.id,
        nodeLabel: aiData.label || 'AI Decision Node',
        nodeType: 'aiDecision',
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
        durationMs,
        prompt: promptText,
        decision,
        reasoning,
      });

      const handle = decision.toLowerCase();
      const matchingEdge: Edge | undefined = edges.find(
        (e: Edge) => e.source === nodeToExecute.id && e.sourceHandle === handle
      );

      if (matchingEdge) {
        visitedEdgeIds.push(matchingEdge.id);
        currentNode = nodes.find((n) => n.id === matchingEdge.target);
      } else {
        currentNode = undefined;
      }
    } else if (nodeToExecute.type === 'action') {
      const actionData = nodeData as ActionNodeData;
      logs.push({
        stepId: `step-${stepIndex}`,
        nodeId: nodeToExecute.id,
        nodeLabel: actionData.label || 'Action Terminal',
        nodeType: 'action',
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 20,
        reasoning: actionData.message || 'Action executed successfully.',
      });

      currentNode = undefined;
    } else {
      currentNode = undefined;
    }
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

    return await step.run('execute-workflow-steps', async () => {
      return await executeWorkflowCore(nodes, edges, inputPayload);
    });
  }
);