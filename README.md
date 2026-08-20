# Visual AI Decision Workflow System

An interactive visual workflow builder and execution engine where each step represents an AI decision returning `YES` or `NO`. The workflow execution runs through **Inngest** durable execution while the frontend visualizes the flow in real-time using **React Flow**.

## Features

- 🎨 **Interactive Flow Canvas**: Drag-and-drop nodes, add AI Decision nodes, Start nodes, and Terminal Action nodes.
- 🔀 **YES / NO Branching**: Custom nodes with distinct `YES` (green handle) and `NO` (red handle) branching paths.
- ⚡ **Durable Execution with Inngest**: Each workflow step is executed as an isolated Inngest step (`step.run()`), ensuring fault-tolerance and dynamic graph traversal.
- 🤖 **AI Decision Evaluation**: Uses OpenAI GPT models with prompt engineering to guarantee strict binary `YES` / `NO` answers, with fallback rule heuristics when an API key isn't set.
- 🟢 **Visual Execution State & Animated Edges**: Live step-by-step path highlighting, glowing active nodes, and animated edge flows.
- 📜 **Execution Logs & Real-time Telemetry**: Full step history, reasoning breakdown, decision timings, and payload output.
- 📁 **JSON Import / Export & Starter Presets**: Save and load workflow configurations or choose pre-built templates (e.g. Support Ticket Router, Lead Classifier).

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
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
```
*(If `OPENAI_API_KEY` is not provided, the application automatically uses an intelligent simulated keyword evaluator so you can test complete workflows immediately).*

### 4. Running the Development Server

Start the Next.js app:

```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

### 5. Running the Inngest Dev Server

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
│   │   ├── inngest/route.ts      # Inngest API route handler
│   │   ├── workflow/
│   │   │   ├── execute/route.ts   # Trigger workflow execution endpoint
│   │   │   └── status/route.ts    # Fetch execution status & telemetry
│   ├── layout.tsx
│   └── page.tsx                  # Main Workflow Canvas Page
├── components/
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
│   │   └── functions.ts          # Inngest durable workflow execution steps
│   ├── types.ts                  # TypeScript interfaces for nodes, edges, logs
│   └── presets.ts                # Built-in workflow templates