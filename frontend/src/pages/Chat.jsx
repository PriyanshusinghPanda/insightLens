import { useState } from "react";
import { askQuestion } from "../api";

export default function Chat() {
  const token = localStorage.getItem("token");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const sendQuestion = async () => {
    const res = await askQuestion(1, question, token);

    setMessages([
      ...messages,
      { role: "user", text: question },
      { role: "ai", text: res.data.answer },
    ]);

    setQuestion("");
  };

  const handleQuickQuestion = (q) => {
    setQuestion(q);
    // Optionally trigger sendQuestion() automatically
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">AI Chat Assistant</h2>
        <div className="page-subtitle">Ask questions about your product reviews and get AI-powered insights</div>
      </div>

      <div className="chat-layout-grid">
        {/* Left Side: Conversation Area */}
        <div className="dashboard-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#111" }}>
            <span style={{ color: "#2563eb" }}>✨</span> Conversation
          </div>

          <div className="chat-container">
            {messages.length === 0 && (
              <div className="chat-message-row">
                <div className="chat-avatar">🤖</div>
                <div className="chat-message ai">
                  Hello! I'm your AI analytics assistant. You can ask me questions about product reviews, NPS scores, customer sentiment, and more. Try asking:
                  <ul style={{ marginTop: "12px", paddingLeft: "20px", color: "#4b5563" }}>
                    <li>Why is iPhone 13 Pro getting mixed ratings?</li>
                    <li>Show me the best performing products</li>
                    <li>What are common complaints about Coffee Maker Pro?</li>
                    <li>Analyze NPS trends for Electronics category</li>
                  </ul>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-message-row ${m.role}`}>
                <div className={`chat-avatar ${m.role === 'user' ? 'user-avatar' : ''}`}>
                  {m.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`chat-message ${m.role}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input-wrapper">
            <div className="chat-input-row">
              <input
                className="minimal-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about product reviews..."
                onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
              />
              <button
                className="minimal-button"
                onClick={sendQuestion}
                style={{ backgroundColor: "transparent", color: "#6b7280", padding: "8px" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Questions */}
        <div className="dashboard-card" style={{ height: "fit-content" }}>
          <h3 style={{ fontSize: "14px", marginTop: 0, marginBottom: "20px", fontWeight: 600, color: "#111" }}>
            Quick Questions
          </h3>

          <div className="quick-question-card" onClick={() => handleQuickQuestion("Why is iPhone 13 Pro getting mixed ratings?")}>
            Why is iPhone 13 Pro getting mixed ratings?
          </div>

          <div className="quick-question-card" onClick={() => handleQuickQuestion("Show me top performing products in Home & Kitchen")}>
            Show me top performing products in Home & Kitchen
          </div>

          <div className="quick-question-card" onClick={() => handleQuickQuestion("What are the main complaints about low-rated products?")}>
            What are the main complaints about low-rated products?
          </div>
        </div>
      </div>
    </div>
  );
}