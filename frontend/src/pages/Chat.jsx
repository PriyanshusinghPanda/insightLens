import { useState } from "react";
import { askQuestion } from "../api";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const token = localStorage.getItem("token");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  const sendQuestion = async () => {
    const res = await askQuestion(1, question, token);

    setMessages([
      ...messages,
      { role: "user", text: question },
      { role: "ai", text: res.data.answer },
    ]);

    setQuestion("");
  };

  return (
    <div className="app-container page-container">
      <div>
        <h2 className="page-title">AI Product Analyst</h2>
        <div className="page-subtitle">Ask questions about your product reviews and customer feedback.</div>
      </div>

      <div className="chat-container">
        {messages.length === 0 && (
          <div style={{ margin: "auto", color: "#888", fontSize: "14px" }}>Send a message to start the analysis.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          className="minimal-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about product reviews... e.g., 'What do users complain about?'"
          onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
        />
        <button className="minimal-button" onClick={sendQuestion}>Send</button>
      </div>

      <button className="minimal-button secondary" onClick={() => navigate("/dashboard")} style={{ width: "fit-content", marginTop: "12px" }}>
        &larr; Back to Dashboard
      </button>
    </div>
  );
}