import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="AI Humanizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# Groq exposes an OpenAI-compatible API, so the same client works.
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

MODEL = "openai/gpt-oss-120b"

STYLES = {
    "Natural": "Use natural, conversational and clear language.",
    "Academic": "Use clear, precise and appropriately academic language.",
    "Professional": "Use polished, professional language.",
    "Simple English": "Use simple English and shorter, clear sentences.",
}


class RewriteRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    style: str = "Natural"


@app.get("/")
def home():
    return {"message": "AI Humanizer API is running"}


@app.post("/humanize")
def humanize(request: RewriteRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Please enter some text.")

    if request.style not in STYLES:
        raise HTTPException(status_code=400, detail="Invalid writing style.")

    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not set. Check your .env file.",
        )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a writing editor. Rewrite the supplied text "
                        "to improve clarity, flow and natural expression. "
                        "Preserve the author's intended meaning and important "
                        "facts. Do not invent evidence, citations or claims. "
                        f"Writing style: {STYLES[request.style]} "
                        "Return only the revised text, with no preamble."
                    ),
                },
                {"role": "user", "content": request.text},
            ],
            temperature=0.7,
        )

        return {"result": response.choices[0].message.content}

    except Exception as e:
        print(f"AI provider error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI service could not complete the request. "
                "Check your API configuration and try again."
            ),
        )