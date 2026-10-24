# HumanizeAI

A small full-stack web app that rewrites text to improve clarity, flow and natural expression. Paste your text, pick a writing style, and get an improved version back. The rewriting is done by an LLM through a FastAPI backend.

## Features

- Four writing styles: Natural, Academic, Professional, Simple English
- Live word and character counts
- One-click copy of the result
- "Use as original text" to refine a result again
- Rewrite history (last 20, saved in the browser's localStorage)
- Dark and light theme

## Tech stack

- **Frontend:** React (Vite), plain CSS
- **Backend:** Python, FastAPI, Uvicorn
- **AI:** Groq's OpenAI-compatible API, called through the `openai` Python SDK

## Project structure

```
ai-humanizer/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env            # your API key (not committed)
│   └── .env.example
└── frontend/           # React app (use your actual folder name)
    └── src/App.jsx
```

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Groq API key from [console.groq.com](https://console.groq.com)

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi "uvicorn[standard]" openai python-dotenv pydantic
```

Create `backend/.env`:

```
GROQ_API_KEY=your_key_here
```

Start the server:

```powershell
python -m uvicorn main:app --reload --port 8000
```

The API runs at http://localhost:8000. Visiting it should return `{"message": "AI Humanizer API is running"}`.

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## API

### `POST /humanize`

Request body:

```json
{
  "text": "Your text here",
  "style": "Natural"
}
```

`style` must be one of `Natural`, `Academic`, `Professional`, `Simple English`.

Response:

```json
{
  "result": "The rewritten text"
}
```

Errors: `400` for empty text or an invalid style, `500` if the API key is missing, `502` if the AI provider call fails (the real cause is printed in the backend terminal).

## Configuration

| Setting | Where | Notes |
| --- | --- | --- |
| `GROQ_API_KEY` | `backend/.env` | Required |
| `MODEL` | `backend/main.py` | Defaults to `openai/gpt-oss-120b`. Groq's model lineup changes, so check their models page if you get a `model_not_found` error. |
| CORS origins | `backend/main.py` | Set to the Vite dev server (`localhost:5173`). Update if you deploy the frontend elsewhere. |
| API URL | `frontend/src/App.jsx` | Hardcoded to `http://localhost:8000/humanize`. |

## Troubleshooting

- **502 Bad Gateway:** Check the backend terminal for the `AI provider error:` line. A 401 means the key is wrong or not loading, a 404 means the model name is wrong, and a 429 means a rate limit or no credits.
- **`.env` changes not picked up:** Uvicorn's reload doesn't watch `.env`. Stop and restart the server.
- **CORS error in the browser console:** Make sure the frontend runs on `localhost:5173` or add your origin to `allow_origins`.

## Privacy

Text you submit is sent to the AI provider (Groq) to be rewritten. Rewrite history is stored only in your browser's localStorage. Don't submit sensitive or confidential text.

## Notes

- Never commit your `.env` file. It is listed in `.gitignore`.
- This tool is intended for editing your own writing for clarity and tone.
