<div align="center">
  <img src="https://img.shields.io/badge/Veda_AI-Assessment_Platform-6366f1?style=for-the-badge&logo=openai" alt="Veda AI Logo" />
  <br />
  <p>
    <strong>A production-grade, AI-powered assessment generation tool for modern educators.</strong>
  </p>
</div>

---

## ✨ Features

Veda AI is designed to streamline the assessment creation process using advanced AI. By simply providing a topic or uploading study material, Veda AI orchestrates a robust generation pipeline to deliver print-ready question papers.

- **🤖 Google Gemini Integration**: Leverages `gemini-2.5-flash` or custom endpoints for high-speed, highly structured reasoning and multiple-choice generation.
- **📄 Document Processing**: Upload PDF or TXT reference materials. The backend automatically extracts and synthesizes the content.
- **🛡️ Ironclad Validation**: Uses `Zod` schemas and a discriminated union architecture to guarantee the AI outputs strict JSON structures (e.g. enforcing 4 options for MCQs).
- **🔁 Autonomous Self-Correction**: The AI service automatically catches validation failures and prompts the LLM to correct its own schema formatting, retrying up to 3 times before failing gracefully.
- **🛡️ Asynchronous Queue Processing**: Powered by `BullMQ` and `Redis`. Heavy generation tasks run in background workers, preventing API timeouts and ensuring UI responsiveness.
- **📡 Real-Time WebSockets**: Live progress tracking via `Socket.IO`. Watch as the backend parses documents, queries the AI, and formats the PDF in real-time.
- **🖨️ High-Fidelity PDF Export**: Uses `pdf-lib` to generate beautifully formatted, student-ready, printable exam papers instantly.
- **UI/UX**: Stunning `Next.js 14` App Router frontend with glassmorphism design, built with `Tailwind CSS`, `Zustand`, and `Lucide React`.

---

## 🛠 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14, Zustand, Tailwind CSS, Lucide React, Axios, React Hook Form |
| **Backend** | Node.js, Express, TypeScript, Zod, Socket.IO, pdf-lib, pdf-parse, Winston |
| **AI Layer** | `@google/generative-ai` (Gemini SDK), Prompt Engineering |
| **Data & Queue** | MongoDB (Mongoose), Redis, BullMQ |

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
*   [MongoDB](https://www.mongodb.com/) (Running locally or hosted)
*   [Redis](https://redis.io/) (Running locally or hosted)

---

## ⚙️ Environment Variables

### Backend Configuration
Create a `.env` file inside the `backend/` directory:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/assessify
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your-gemini-api-key-here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend Configuration
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

---

## 🚀 Running the Project

### 1. Installation
Install dependencies in both directories:
```bash
# Backend dependencies
npm install --prefix backend

# Frontend dependencies
npm install --prefix frontend
```

### 2. Databases & Broker (Local)
Start your MongoDB and Redis servers:
```bash
# Start MongoDB (if using Brew on macOS)
brew services start mongodb-community

# Start Redis (if using Brew on macOS)
brew services start redis
```

### 3. Run Development Servers
Start both servers concurrently or in separate terminal tabs:

#### Start Backend Service
```bash
npm run dev --prefix backend
```
*Runs on port **5001**.*

#### Start Frontend Service
```bash
npm run dev --prefix frontend
```
*Runs on port **3000**.*

---

## 📁 Project Architecture

```
Veda_ai/
├── backend/
│   ├── src/
│   │   ├── config/          # database.ts, cache.ts, logger.ts configuration
│   │   ├── controllers/     # Route controllers (exam.controller.ts)
│   │   ├── listeners/       # Event-based database & websocket broadcasters
│   │   ├── middlewares/     # Rate limiter and Zod validator middlewares
│   │   ├── models/          # MongoDB Exam schema (Exam.ts)
│   │   ├── routes/          # Express API route endpoints (exam.routes.ts)
│   │   ├── services/
│   │   │   ├── llm/         # LLM service provider, Zod Validators, schemas
│   │   │   ├── chunking.service.ts  # Text chunker & parser
│   │   │   └── export.service.ts    # pdf-lib layout and PDF exporter
│   │   ├── sockets/         # Socket.IO Gateway configuration
│   │   └── workers/         # BullMQ queue consumer (examWorker.ts)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (build-paper, paper-view, library)
│   │   ├── hooks/           # Websocket custom listener hook (useWebsocket.ts)
│   │   ├── store/           # Zustand stores (useExamStore.ts, useUIStore.ts)
│   │   └── utils/           # Axios instance
│   ├── package.json
│   └── tsconfig.json
└── README.md
```