import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { runAiWorkflow } from '@/lib/inngest/functions';

// Serve Inngest API handlers
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runAiWorkflow],
});