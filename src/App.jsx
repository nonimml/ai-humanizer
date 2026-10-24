
import { useEffect, useState } from "react";
import "./App.css";

const styles = ["Natural", "Academic", "Professional", "Simple English"];

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [style, setStyle] = useState("Natural");
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("humanizer-history") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("humanizer-history", JSON.stringify(history));
  }, [history]);

  // Local demo only: this does not call an AI model.
  function demoRewrite(input) {
    let output = input.trim();

    if (style === "Simple English") {
      output = output
        .replace(/\butilize\b/gi, "use")
        .replace(/\bdemonstrate\b/gi, "show")
        .replace(/\bapproximately\b/gi, "about")
        .replace(/\bfacilitate\b/gi, "help");
    }

    if (style === "Professional") {
      output = output.replace(/\bcan't\b/gi, "cannot");
    }

    return output;
  }

  async function handleHumanize() {
    if (!text.trim()) {
      setMessage("Please enter some text first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1. Point to your FastAPI endpoint
      const response = await fetch("http://localhost:8000/humanize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          style: style,
        }),
      });

      if (!response.ok) {
        throw new Error("Server responded with an error.");
      }

      const data = await response.json();
      const rewritten = data.result; // <--- Matches {"result": ...} from FastAPI

      setResult(rewritten);
      setHistory((old) => [
        {
          id: Date.now(),
          original: text,
          result: rewritten,
          style,
        },
        ...old,
      ].slice(0, 20));
      
      setMessage("AI Humanized successfully!");
    } catch (error) {
      setMessage("Error: Could not reach backend or OpenAI API key issue.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result);
      setMessage("Text copied to clipboard!");
    } catch {
      setMessage("Copy failed. Please select and copy the text manually.");
    }
  }

  function clearText() {
    setText("");
    setResult("");
    setMessage("");
  }

  function loadHistory(item) {
    setText(item.original);
    setResult(item.result);
    setStyle(item.style);
    setMessage("Previous rewrite loaded.");
  }

  function deleteHistory(id) {
    setHistory((old) => old.filter((item) => item.id !== id));
  }

  return (
    <main className={dark ? "app dark" : "app light"}>
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">✦</span>
          Humanize<span className="brand-accent">AI</span>
        </a>

        <nav>
          <a href="#workspace">Workspace</a>
          <a href="#history">History</a>
        </nav>

        <button
          className="theme-button"
          onClick={() => setDark(!dark)}
          aria-label="Toggle theme"
        >
          {dark ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      <section className="hero" id="home">
        <div className="eyebrow">
          <span>✦</span> YOUR PERSONAL WRITING ASSISTANT
        </div>

        <h1>
          Make every word
          <br />
          <span>sound like you.</span>
        </h1>

        <p>
          Refine your writing, improve clarity, and express your
          ideas in your own voice.
        </p>
      </section>

      <section className="workspace" id="workspace">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="step-label">01 / INPUT</span>
              <h2>Original text</h2>
            </div>
            <button className="text-button" onClick={clearText}>
              Clear all
            </button>
          </div>

          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setMessage("");
            }}
            placeholder="Paste your text here and start refining your writing..."
            maxLength={10000}
          />

          <div className="counts">
            <span>{countWords(text)} words</span>
            <span>{text.length} characters</span>
          </div>

          <label htmlFor="style">Writing style</label>
          <select
            id="style"
            value={style}
            onChange={(event) => setStyle(event.target.value)}
          >
            {styles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <button
            className="primary-button"
            onClick={handleHumanize}
            disabled={loading || !text.trim()}
          >
            {loading ? "◌ Processing..." : "✦ Humanize text"}
          </button>

          <p className="privacy-note">
            ◈ Demo mode · Text stays in this browser unless you
            connect an external service.
          </p>
        </article>

        <article className="panel output-panel">
          <div className="panel-heading">
            <div>
              <span className="step-label">02 / OUTPUT</span>
              <h2>Improved version</h2>
            </div>
            <button
              className="text-button"
              onClick={copyResult}
              disabled={!result}
            >
              ▢ Copy
            </button>
          </div>

          {result ? (
            <>
              <div className="result-text">{result}</div>
              <div className="counts">
                <span>{countWords(result)} words</span>
                <span>{result.length} characters</span>
              </div>
              <button
                className="secondary-button"
                onClick={() => setText(result)}
              >
                Use as original text ↗
              </button>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✧</div>
              <h3>Your improved text starts here</h3>
              <p>
                Enter your text on the left and click Humanize text
                to preview the interface.
              </p>
            </div>
          )}

          {message && <p className="status-message">{message}</p>}
        </article>
      </section>

      <section className="history-section" id="history">
        <div className="history-heading">
          <div>
            <span className="step-label">YOUR WORKSPACE</span>
            <h2>Recent rewrites</h2>
          </div>
          {history.length > 0 && (
            <button
              className="text-button"
              onClick={() => {
                if (window.confirm("Clear all rewrite history?")) {
                  setHistory([]);
                }
              }}
            >
              Clear history
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="history-empty">
            Your demo rewrites will appear here.
          </p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div className="history-item" key={item.id}>
                <button
                  className="history-content"
                  onClick={() => loadHistory(item)}
                >
                  <strong>{item.style}</strong>
                  <span>
                    {item.original.slice(0, 85)}
                    {item.original.length > 85 ? "..." : ""}
                  </span>
                </button>
                <button
                  className="delete-button"
                  onClick={() => deleteHistory(item.id)}
                  aria-label="Delete history item"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer>
        <span>✦ HumanizeAI</span>
        <span>Write clearly. Keep your voice.</span>
      </footer>
    </main>
  );
}
