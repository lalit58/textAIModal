import { useState, useEffect } from "react";

export default function GrokProcessor() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const processRequest = async (messages) => {
    setLoading(true);
    setAnswer("");
    let buffer = "";

    try {
      const response = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) throw new Error("API request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawData = line.replace("data: ", "").trim();
            if (!rawData || rawData === "[DONE]" || rawData === "") continue;

            try {
              const data = JSON.parse(rawData);
              if (data && typeof data.content === "string") {
                setAnswer((prev) => prev + data.content);
              }
            } catch (error) {
              console.error(
                "Failed to parse JSON:",
                error,
                "Raw data:",
                rawData
              );
            }
          }
        }
      }

      if (buffer.trim() && buffer.startsWith("data: ")) {
        const rawData = buffer.replace("data: ", "").trim();
        if (rawData && rawData !== "[DONE]") {
          try {
            const data = JSON.parse(rawData);
            if (data && typeof data.content === "string") {
              setAnswer((prev) => prev + data.content);
            }
          } catch (error) {
            console.error(
              "Final buffer parse error:",
              error,
              "Raw data:",
              rawData
            );
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setAnswer("Error processing request");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = () => {
    if (!input) return;

    const messages = [
      ...history
        .map((item) => [
          { role: "user", content: item.question },
          { role: "assistant", content: item.answer },
        ])
        .flat(),
      { role: "user", content: input },
    ];

    processRequest(messages);
    setHistory((prev) => [...prev, { question: input, answer: "" }]);
    setInput("");
  };

  useEffect(() => {
    if (answer && !loading) {
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].answer = answer;
        return updated;
      });
    }
  }, [answer, loading]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading && input) {
      handleProcess();
    }
  };

  return (
    <div className="grok-container">
      <div className="history">
        {history.length > 0 &&
          history.map((item, index) => (
            <div key={index} className="card">
              <div className="question">
                <span>You:</span>
                <p>{item.question}</p>
              </div>
              {item.answer ? (
                <div className="answer">
                  <span>Grok:</span>
                  <p>{item.answer}</p>
                </div>
              ) : loading && index === history.length - 1 ? (
                <div className="loading">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                      className="opacity-75"
                    />
                  </svg>
                  <span>Loading...</span>
                </div>
              ) : null}
            </div>
          ))}
      </div>

      <div className="input-section">
        <div className="input-card">
          <h1>Ask Grok</h1>
          <div className="input-form">
            <div className="input-row">
              <input
                type="text"
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button onClick={handleProcess} disabled={loading || !input}>
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
