# Cinelock

**Film Research. Visuals & Budget.**

> **Status**: Active Development
> **Version**: 0.1.0

Cinelock is a comprehensive AI-powered pre-production suite for filmmakers. It bridges the gap between creative ideation and logistical planning by integrating three core pillars: **Deep Film Research**, **Cinematic Visualization**, and **Automated Budgeting**.

Unlike generic AI tools, Cinelock is "state-aware" of your production context—it knows if you are an indie production or a studio blockbuster and adjusts its financial predictions accordingly.

---

## � Table of Contents

1.  [System Architecture](#-system-architecture)
2.  [Core Workflows & Logic](#-core-workflows--logic)
    *   [1. Research & Chat Engine](#1-research--chat-engine)
    *   [2. Scene Visualization](#2-scene-visualization)
    *   [3. Auto-Budgeting Algorithm](#3-auto-budgeting-algorithm)
3.  [Data Models](#-data-models)
4.  [UI/UX Design System](#-uiux-design-system)
5.  [Project Structure](#-project-structure)
6.  [Installation & Development](#-installation--development)

---

## 🏗 System Architecture

Cinelock is built as a  **client-first Next.js 16 application** with a lightweight API layer for AI orchestration.

*   **Frontend**: React 19 (Server Components + Client Components) using Next.js App Router.
*   **State Management**: React `useState`/`useEffect` paired with **Persistence Layers**.
*   **Persistence**: Uses MongoDB (via Mongoose) as the primary data store. Data is structured into "Projects", "Sessions", "Scenes", and "Budget Items".
*   **AI Backend**: Next.js API Routes (`/api/chat`) act as a proxy to **Azure OpenAI**, managing prompt injection, system instructions, and response formatting (JSON/Markdown tables).
*   **Styling Engine**: Tailwind CSS 4 with a custom configuration for "Cinematic" aesthetics (gradients, glassmorphism, serif typography).

---

## 🧠 Core Workflows & Logic

### 1. Research & Chat Engine
*   **Component**: `ChatContent` (`src/app/chat/page.tsx`)
*   **Logic**:
    *   Maintains a conversation history array `messages: Message[]`.
    *   **System Prompting**: Injects role-specific constraints ("You are a senior line producer...", "You are a screenwriter...").
    *   **Context Awareness**: If a `projectId` is active, the chat session is linked to it, allowing the AI (theoretically) to pull context from that project's genre or scale.
    *   **Typewriter Effect**: Uses a custom `TypewriterContent` component to stream responses for a natural feel.

### 2. Scene Visualization
*   **Feature**: Users can request visuals for scenes.
*   **Current Implementation**: Currently simulates generation or displays placeholders/demo assets (e.g., panoramas).
*   **Roadmap**: Uses `three.js` and `@react-three/fiber` (dependencies installed) to eventually render 3D approximations or equirectangular panoramas for "Deep Scouting".

### 3. Auto-Budgeting Algorithm
*   **The "Magic" Feature**: Cinelock listens to your chat.
*   **Trigger**: When a user types a command like `/finalize` or explicitly asks for a budget breakdown.
*   **Process**:
    1.  **Extraction**: The system scans the chat history for the most recent "scene" description.
    2.  **Inference**: It sends this text to the AI with a strict **System Instruction**: _"Generate a line-item budget table. Output ONLY a Markdown table."_
    3.  **Parsing**: The frontend (`src/app/budget/page.tsx`) detects Markdown tables in the `assistant` response.
    4.  **Ingestion**: It parses the Markdown table rows into structured `BudgetItem` objects.
    5.  **Storage**: These items are saved to MongoDB, associated with the current `sessionId` and `projectId`.
*   **Project Isolation**: If the user selects the "Unassigned" project, the budgeting engine **locks**. A UI guard in `BudgetPage` prevents data pollution by forcing the user to select/create a project before running calculations.

---

## 💾 Data Models

The application relies on relational data stored in MongoDB.

### **Project**
```typescript
interface Project {
  id: string;           // UUID
  name: string;         // e.g., "Neon Nights"
  scale: 'indie' | 'standard' | 'studio'; // Determines budget multipliers
  budgetLimit?: number; // Optional hard cap
  createdAt: number;
}
```

### **ChatSession**
```typescript
interface ChatSession {
  id: string;
  projectId: string;    // Links chat to a project
  messages: Message[];  // Full history
  title: string;        // Auto-generated summary
  updatedAt: number;
}
```

### **BudgetItem**
```typescript
interface BudgetItem {
  id: string;
  projectId: string;
  item: string;         // e.g., "ARRI Alexa Mini Rental"
  category: string;     // "Camera", "Cast", "Location", etc.
  status: 'Paid' | 'Pending' | 'Estimated' | 'Over-budget';
  estimated: number;    // AI predicted cost
  actual: number;       // User entered cost
}
```

---

## 🎨 UI/UX Design System

Cinelock uses a bespoke design language called **"Dark Cinema"**.

*   **Color Palette**:
    *   **Background**: Deep Navy/Black (`#020617` with radial blue gradients).
    *   **Accent**: "Cinelock Accent" (Blue-Cyan gradients) and "Cream White" (`#F5F5DC`) for text contrast.
    *   **Semantic**: Emerald (Safe), Amber (Warning), Red (Over-budget).
*   **Glassmorphism**:
    *   Panels use `bg-white/5` with `backdrop-blur-md` and `border-white/10`.
    *   Inputs use `ring-1 ring-white/10` to simulate etched glass.
*   **Animations**:
    *   **GSAP (GreenSock)**: Used on the Landing Page for complex scroll-triggered reveals (`ScrollTrigger`).
    *   **CSS Transitions**: Used for hover states, modal fades, and sidebar expansion.
*   **Typography**:
    *   **Headings**: Serif fonts (e.g., Playfair Display or similar system serif) for a "Screenplay" feel.
    *   **UI**: Sans-serif (Inter/Geist) for legibility.

---

## 📂 Project Structure

```bash
/src
├── app/
│   ├── api/chat/       # Backend route for Azure OpenAI
│   ├── budget/         # Budget Dashboard (Logic + UI)
│   ├── chat/           # Main AI Chat Interface
│   ├── scenes/         # Asset/Image Gallery
│   ├── page.tsx        # Landing Page (Hero, Features, Pricing)
│   └── layout.tsx      # Global Root Layout (Fonts, Metadata)
├── components/
│   ├── AppSidebar.tsx  # Global Navigation (Collapsible)
│   ├── Hero.tsx        # Landing Page Hero Section
│   ├── HowItWorks.tsx  # Workflow explainer
│   ├── Typewriter.tsx  # Custom text streaming effect
│   └── ui/             # Reusable atoms (MagneticButton, etc.)
├── lib/
│   ├── data.ts         # Shared types/constants
│   ├── actions.ts      # MongoDB server actions
│   └── utils.tsx       # CN (Classname) helper
└── styles/             # Global CSS
```

---

## 📦 Installation & Development

### Prerequisites
*   Node.js 18+
*   npm or pnpm

### Setup Steps

1.  **Clone & Install**:
    ```bash
    git clone [repo-url]
    cd cinelock
    npm install
    ```

2.  **Configure Environment**:
    Create `.env.local` in the root:
    ```env
    # Required for Chat/Auto-Budgeting
    AZURE_OPENAI_API_KEY=your_key_here
    AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
    AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
    ```

3.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Open the URL printed by Next.js in your terminal output.

### Building for Production
```bash
npm run build
npm start
```

---

*Verified locally on Linux env. Optimized for Chrome/Edge.*
