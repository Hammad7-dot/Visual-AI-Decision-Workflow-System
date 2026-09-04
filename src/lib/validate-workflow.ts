const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function validateWorkflowRequest(body: unknown): string | null {
  if (!isRecord(body)) return 'Expected a workflow object';
  const { nodes, edges, inputPayload } = body;
  if (!Array.isArray(nodes) || !nodes.length || !Array.isArray(edges)) return 'Missing nodes or edges';
  if (inputPayload !== undefined && typeof inputPayload !== 'string') return 'Input payload must be a string';

  const ids = new Set<string>();
  let starts = 0;
  for (const node of nodes) {
    if (!isRecord(node) || typeof node.id !== 'string' || !node.id.trim() || ids.has(node.id)) return 'Nodes must have unique nonempty IDs';
    if (typeof node.type !== 'string' || !['start', 'aiDecision', 'action'].includes(node.type)) return 'Invalid node type';
    if (!isRecord(node.data)) return 'Node data must be an object';
    for (const field of ['label', 'prompt', 'message']) {
      if (node.data[field] !== undefined && typeof node.data[field] !== 'string') return `Node ${field} must be a string`;
    }
    ids.add(node.id);
    if (node.type === 'start') starts++;
  }
  if (starts !== 1) return 'Workflow must have exactly one Start node';

  const edgeIds = new Set<string>();
  for (const edge of edges) {
    if (!isRecord(edge) || typeof edge.id !== 'string' || !edge.id.trim() || edgeIds.has(edge.id)) return 'Edges must have unique nonempty IDs';
    if (typeof edge.source !== 'string' || typeof edge.target !== 'string' || !ids.has(edge.source) || !ids.has(edge.target)) return 'Edge references an unknown node';
    if (edge.sourceHandle != null && (typeof edge.sourceHandle !== 'string' || !['', 'yes', 'no'].includes(edge.sourceHandle))) return 'Invalid edge source handle';
    edgeIds.add(edge.id);
  }
  return null;
}
