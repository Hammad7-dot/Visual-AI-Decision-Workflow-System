# Visual AI Decision Workflow System

An interactive visual workflow builder and execution engine with AI decisions returning `YES` or `NO`. The UI runs workflows synchronously and replays their results using **React Flow**. Separately submitted background jobs support **Inngest** durable execution.

## Features

- 🎨 **Interactive Flow Canvas**: Drag-and-drop nodes, add AI Decision nodes, Start nodes, and Terminal Action nodes.
- 🔀 **YES / NO Branching**: Custom nodes with distinct `YES` (green handle) and `NO` (red handle) branching paths.
- ⚡ **Durable Execution with Inngest**: Each workflow step is executed as an isolated Inngest step (`step.run()`), ensuring fault-tolerance and dynamic graph traversal.
- 🤖 **AI Decision Evaluation**: Uses OpenAI GPT models with prompt engineering to guarantee strict binary `YES` / `NO` answers, with fallback rule heuristics when an API key isn't set.
- 🟢 **Visual Execution State & Animated Edges**: Live step-by-step path highlighting, glowing active nodes, and animated edge flows.
- 📜 **Execution Logs & Real-time Telemetry**: Full step history, reasoning breakdown, decision timings, and payload output.
- 📁 **JSON Import / Export & Starter Presets**: Save and load workflow configurations or choose pre-built templates (e.g. Support Ticket Router, Lead Classifier).
- 🧩 **shadcn/ui**: Toolbar and node-configuration drawer controls are built on shadcn's Button/Input/Textarea/Select/Label primitives.

---

## Getting Started

### 1. Prerequisites
- Node.js 20.9+
- npm / pnpm / yarn

### 2. Installation

```bash
cd visual-ai-workflow
npm install
```

### 3. Environment Configuration

Create or update `.env.local` in the project root:

```env
OPENAI_API_KEY=sk-...

# Required for local development so the Inngest SDK talks to the local Dev
# Server (below) instead of expecting cloud signing/event keys.
INNGEST_DEV=1
```
*(If `OPENAI_API_KEY` is not provided, the application automatically uses an intelligent simulated keyword evaluator so you can test complete workflows immediately).*

### 4. Running the Development Server

Start the Next.js app:

```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

### 5. Running the Inngest Dev Server (optional background execution)

The UI Run button executes once through `/api/execute` and returns the result directly. It does not enqueue an Inngest job. To use durable background execution, submit a `workflow/run.requested` event with `nodes`, `edges`, and `inputPayload` to Inngest separately.

Without an OpenAI key, the demo evaluator uses limited rules, including enterprise size (over 50 employees) and budget (over $10,000). It is not a general-purpose prompt evaluator.

In a separate terminal window, launch the Inngest CLI dev server:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

This opens the Inngest dashboard at [http://localhost:8288](http://localhost:8288) to monitor background step executions and trace histories.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── inngest/route.ts      # Inngest API route handler (serves registered functions)
│   │   └── execute/route.ts      # Synchronous execution endpoint used by the UI's Run button
│   ├── layout.tsx
│   └── page.tsx                  # Main Workflow Canvas Page
├── components/
│   ├── ui/                       # shadcn/ui primitives (Button, Input, Textarea, Select, Badge, Label)
│   ├── FlowEditor.tsx            # Main React Flow visual canvas
│   ├── NodeDrawer.tsx            # Node prompt configuration drawer
│   ├── ExecutionLogsPanel.tsx    # Live step-by-step execution log viewer
│   ├── WorkflowToolbar.tsx       # Controls (Run, Presets, Export, Clear)
│   └── nodes/
│       ├── AIDecisionNode.tsx    # Custom decision node (YES/NO handles)
│       ├── StartNode.tsx         # Workflow trigger node
│       └── ActionNode.tsx        # Terminal action node
├── lib/
│   ├── inngest/
│   │   ├── client.ts             # Inngest client configuration
│   │   └── functions.ts          # Inngest function - each node runs as its own step.run()
│   ├── types.ts                  # TypeScript interfaces for nodes, edges, logs
│   └── presets.ts                # Built-in workflow templates
