import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

// Compile the real modules in memory, isolating external services and credentials.
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, process: { env: {} }, console, Date, Set,
    require: (id) => {
      if (id in dependencies) return dependencies[id];
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return exports;
}

const engine = load('src/lib/inngest/functions.ts', {
  './client': { inngest: { createFunction: (_, handler) => handler } },
  openai: { default: class OpenAI {} },
});
const validation = load('src/lib/validate-workflow.ts');
const nodes = [
  { id: 's', type: 'start', data: {} },
  { id: 'd', type: 'aiDecision', data: { prompt: 'Is support needed?' } },
  { id: 'a', type: 'action', data: {} },
];
const firstEdge = { id: 'sd', source: 's', target: 'd' };
const runners = {
  synchronous: engine.executeWorkflowCore,
  background: (nodes, edges, inputPayload) => engine.runAiWorkflow({
    event: { data: { nodes, edges, inputPayload } }, step: { run: (_, fn) => fn() },
  }),
};

for (const [name, run] of Object.entries(runners)) {
  test(`${name}: respects a lone labeled branch and preserves unlabeled imports`, async () => {
    for (const [input, handle, expected] of [['hello', 'yes', false], ['help', 'no', false], ['help', 'yes', true], ['hello', undefined, true]]) {
      const result = await run(nodes, [firstEdge, { id: 'da', source: 'd', target: 'a', sourceHandle: handle }], input);
      assert.equal(result.activeNodeIds.includes('a'), expected);
    }
  });
  test(`${name}: cycles fail instead of reporting completion`, async () => {
    await assert.rejects(run([nodes[0]], [{ id: 'loop', source: 's', target: 's' }], ''), /20-step limit/);
  });
  test(`${name}: a workflow ending exactly at the step limit succeeds`, async () => {
    const chain = Array.from({ length: 20 }, (_, i) => ({ id: String(i), type: i === 19 ? 'action' : i === 0 ? 'start' : 'aiDecision', data: {} }));
    const edges = chain.slice(1).map((n, i) => ({ id: String(i), source: String(i), target: n.id }));
    const result = await run(chain, edges, '');
    assert.equal(result.status, 'completed');
    assert.equal(result.logs.length, 20);
  });
}

test('demo fallback qualifies default enterprise lead and rejects low size/budget', async () => {
  const preset = load('src/lib/presets.ts').PRESET_WORKFLOWS[1];
  for (const [input, expected] of [
    [preset.defaultInput, 'action-hot-lead'],
    ['250 employees with a budget of $50k', 'action-hot-lead'],
    ['250 employees with a budget of $5,000', 'action-nurture'],
    ['10 employees with a budget of $50,000', 'action-nurture'],
    ['50 employees with a budget of $10k', 'action-nurture'],
  ]) {
    const result = await engine.executeWorkflowCore(preset.nodes, preset.edges, input);
    assert.equal(result.logs.at(-1).nodeId, expected);
  }
});

test('API rejects malformed requests before execution and executes valid input once', async () => {
  let executions = 0;
  const api = load('src/app/api/execute/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/validate-workflow': validation,
    '@/lib/inngest/functions': { executeWorkflowCore: async () => { executions++; return { status: 'completed' }; } },
    // No event client is provided: importing one fails the test.
  });
  const valid = { nodes, edges: [firstEdge], inputPayload: 'hello' };
  const invalid = [null, {}, { ...valid, nodes: [null, nodes[0]] },
    { ...valid, nodes: [{ ...nodes[0], data: null }] },
    { ...valid, nodes: [nodes[0], nodes[0]] },
    { ...valid, nodes: [nodes[0], { ...nodes[1], data: { prompt: 123 } }] },
    { ...valid, edges: [null] },
    { ...valid, edges: [{ id: 'bad', source: 's', target: 'missing' }] },
    { ...valid, inputPayload: 42 }];
  for (const body of invalid) {
    assert.equal((await api.POST({ json: async () => body })).status, 400);
  }
  assert.equal((await api.POST({ json: async () => { throw new SyntaxError(); } })).status, 400);
  assert.equal(executions, 0);
  assert.equal((await api.POST({ json: async () => valid })).status, 200);
  assert.equal(executions, 1);
});
