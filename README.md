# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

# AI Study Assistant Frontend

AI Study Assistant Frontend is a React + Vite web interface for the AI Study Assistant project.

It connects to the FastAPI backend and lets users create study notes, upload PDF study materials, select notes or PDFs as sources, and chat with those materials using a local AI model through Ollama.

## Features

- Create new study notes
- List saved notes from the backend
- Upload PDF study materials
- List saved PDF documents from the backend
- Select a note or PDF as the active study source
- Chat with selected notes using their saved content as context
- Chat with selected PDF documents using extracted PDF text as context
- Quick action buttons for summarization, quiz generation, and simple explanation
- Clean chat-style user interface

## Tech Stack

- React
- Vite
- JavaScript
- CSS
- Fetch API

## Backend Repository

This frontend requires the backend server to be running locally.

Backend repository:

```text
https://github.com/Ahmet-Tarik/ai-study-assistant-backend
```

Backend local URL:

```text
http://127.0.0.1:8000
```

## How to Run

Clone the repository:

```bash
git clone https://github.com/Ahmet-Tarik/ai-study-assistant-frontend.git
cd ai-study-assistant-frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the app in the browser:

```text
http://localhost:5173
```

## Required Backend Setup

Before using the frontend, start the backend server:

```bash
cd ../ai-study-assistant-backend
source .venv/bin/activate
uvicorn main:app --reload
```

The backend must be running at:

```text
http://127.0.0.1:8000
```

## Main UI Flow

1. Create or select a saved study note.
2. Upload or select a saved PDF document.
3. Choose a source from the left sidebar.
4. Chat with the selected source in the main chat panel.
5. Use quick actions such as:
   - Summarize
   - Generate Quiz
   - Explain Simply

## Connected Backend Endpoints

The frontend currently uses these backend endpoints:

```text
GET  /notes
POST /notes
GET  /documents
POST /documents/upload-pdf
POST /notes/{note_id}/chat
POST /documents/{document_id}/chat
```

## Project Status

Current version includes:

- Chat-based frontend layout
- Notes list integration
- PDF document list integration
- PDF upload integration
- Contextual AI chat with notes
- Contextual AI chat with PDF documents
- Quick action buttons

Planned next steps:

- Improve mobile layout
- Add delete buttons for notes and documents
- Add loading animations
- Save chat history to the backend
- Add authentication
- Add deployment configuration

## Author

Ahmet Tarık Sevinç