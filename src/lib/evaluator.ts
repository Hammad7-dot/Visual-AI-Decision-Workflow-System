import { executeWorkflowCore } from './inngest/functions';

/**
 * @deprecated Use executeWorkflowCore from '@/lib/inngest/functions' directly.
 * Re-exported for backward compatibility to maintain single source of truth.
 */
export async function evaluateDecisionWithLLMDirect(
  nodes: any[],
  edges: any[],
  inputPayload: string
) {
  return await executeWorkflowCore(nodes, edges, inputPayload);
}