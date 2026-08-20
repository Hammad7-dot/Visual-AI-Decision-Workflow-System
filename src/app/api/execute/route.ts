import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { executeWorkflowCore } from '@/lib/inngest/functions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nodes, edges, inputPayload } = body;

    if (!nodes || !edges) {
      return NextResponse.json({ error: 'Missing nodes or edges' }, { status: 400 });
    }

    // Trigger Inngest event for async tracking / dashboard execution
    try {
      await inngest.send({
        name: 'workflow/run.requested',
        data: { nodes, edges, inputPayload },
      });
    } catch (inngestErr) {
      console.warn('Inngest event send notice:', inngestErr);
    }

    // Execute workflow using single source of truth engine logic
    const result = await executeWorkflowCore(nodes, edges, inputPayload || '');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Execution API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}