import { NextResponse } from 'next/server';
import { executeWorkflowCore } from '@/lib/inngest/functions';
import { validateWorkflowRequest } from '@/lib/validate-workflow';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationError = validateWorkflowRequest(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const { nodes, edges, inputPayload } = (body ?? {}) as {
      nodes?: unknown;
      edges?: unknown;
      inputPayload?: unknown;
    };

    if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length === 0) {
      return NextResponse.json({ error: 'Missing nodes or edges' }, { status: 400 });
    }
    if (!nodes.some((n) => (n as { type?: string })?.type === 'start')) {
      return NextResponse.json({ error: 'Workflow has no Start node' }, { status: 400 });
    }

    // Run once here. Background callers can submit workflow/run.requested separately.
    const result = await executeWorkflowCore(
      nodes as Parameters<typeof executeWorkflowCore>[0],
      edges as Parameters<typeof executeWorkflowCore>[1],
      typeof inputPayload === 'string' ? inputPayload : ''
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Execution API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
