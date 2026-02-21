import { useState, useEffect } from "react";
import { askQuestion, getProducts, saveReport } from "../api";

export default function Chat() {
  const token = localStorage.getItem("token");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [savedStatus, setSavedStatus] = useState({});

  useEffect(() => {
    getProducts(token).then(res => setProducts(res.data)).catch(console.error);
  }, [token]);

  const sendQuestion = async () => {
    if (!selectedProduct) {
      alert("Please select a product first.");
      return;
    }
    if (!question.trim()) return;

    const currentQuestion = question;
    const currentProductId = parseInt(selectedProduct);

    // Add user message immediately
    const userMsg = { role: "user", text: currentQuestion, productId: currentProductId };
    setMessages(prev => [...prev, userMsg]);
    setQuestion("");

    // Setup placeholder for AI response
    const aiMsgIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: "ai", text: "Analyzing...", productId: currentProductId, isLoading: true }]);

    try {
      const res = await askQuestion(currentProductId, currentQuestion, token);

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[aiMsgIndex] = {
          role: "ai",
          text: res.data.answer,
          productId: currentProductId,
          questionRef: currentQuestion,
          isLoading: false
        };
        return newMsgs;
      });
    } catch (e) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[aiMsgIndex] = {
          role: "ai",
          text: "Sorry, I encountered an error while generating the response.",
          productId: currentProductId,
          isLoading: false,
          isError: true
        };
        return newMsgs;
      });
    }
  };

  const handleSaveReport = async (msgIndex) => {
    const msg = messages[msgIndex];
    try {
      await saveReport(token, msg.productId, msg.questionRef, msg.text);
      setSavedStatus(prev => ({ ...prev, [msgIndex]: true }));
    } catch (e) {
      console.error(e);
      alert("Failed to save report.");
    }
  };

  const handleQuickQuestion = (q) => {
    setQuestion(q);
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">AI Assistant</h2>
        <div className="page-subtitle">Deep dive product analysis with automated insights</div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr", marginBottom: "16px" }}>
        <div className="dashboard-card" style={{ padding: "16px 24px", display: "flex", gap: "16px", alignItems: "center" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, minWidth: "140px" }}>Required Product Scope:</label>
          <select
            className="minimal-input"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{ margin: 0, flex: 1, maxWidth: "400px" }}
          >
            <option value="">-- Select a Product to Analyze --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="chat-layout-grid">
        {/* Left Side: Conversation Area */}
        <div className="dashboard-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#111" }}>
            <span style={{ color: "#2563eb" }}>✨</span> InsightLens Auto-Traceability Engine Active
          </div>

          <div className="chat-container" style={{ padding: "20px" }}>
            {messages.length === 0 && (
              <div className="chat-message-row">
                <div className="chat-avatar">🤖</div>
                <div className="chat-message ai">
                  Hello! I'm your AI product analyst. Select a product above and ask me to analyze the reviews. My responses are strictly formatted with a Summary, Key Complaints, Positive Highlights, and Recommendations.
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-message-row ${m.role}`} style={{ marginBottom: "20px", display: "flex", gap: "12px", flexDirection: m.role === 'user' ? "row-reverse" : "row" }}>
                <div className={`chat-avatar ${m.role === 'user' ? 'user-avatar' : ''}`} style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: m.role === 'user' ? '#eff6ff' : '#f3f4f6' }}>
                  {m.role === 'user' ? '👤' : '🤖'}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: m.role === 'user' ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  <div
                    className={`chat-message ${m.role}`}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
                      backgroundColor: m.role === 'user' ? '#2563eb' : '#f9fafb',
                      color: m.role === 'user' ? '#fff' : '#111827',
                      border: m.role === 'user' ? 'none' : '1px solid #e5e7eb',
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6"
                    }}
                  >
                    {m.text}
                  </div>
                  {m.role === 'ai' && !m.isLoading && !m.isError && (
                    <button
                      className="minimal-button"
                      style={{
                        marginTop: "8px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        width: "auto",
                        backgroundColor: savedStatus[i] ? "#10b981" : "#111"
                      }}
                      onClick={() => handleSaveReport(i)}
                      disabled={savedStatus[i]}
                    >
                      {savedStatus[i] ? "✓ Saved to Reports" : "Save as Report"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input-wrapper" style={{ padding: "20px", borderTop: "1px solid #eaeaea" }}>
            <div className="chat-input-row" style={{ display: "flex", gap: "12px" }}>
              <input
                className="minimal-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your analysis question..."
                onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
                style={{ margin: 0, flex: 1 }}
              />
              <button
                className="minimal-button"
                onClick={sendQuestion}
                style={{ width: "auto", padding: "0 20px" }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Questions */}
        <div className="dashboard-card" style={{ height: "fit-content" }}>
          <h3 style={{ fontSize: "14px", marginTop: 0, marginBottom: "20px", fontWeight: 600, color: "#111" }}>
            Suggested Prompts
          </h3>

          <div className="quick-question-card" style={{ cursor: "pointer", padding: "12px", border: "1px solid #eaeaea", borderRadius: "8px", marginBottom: "8px" }} onClick={() => handleQuickQuestion("Summarize the most common customer complaints.")}>
            Summarize the most common customer complaints.
          </div>

          <div className="quick-question-card" style={{ cursor: "pointer", padding: "12px", border: "1px solid #eaeaea", borderRadius: "8px", marginBottom: "8px" }} onClick={() => handleQuickQuestion("What are the best features highlighted in 5-star reviews?")}>
            What are the best features highlighted in 5-star reviews?
          </div>

          <div className="quick-question-card" style={{ cursor: "pointer", padding: "12px", border: "1px solid #eaeaea", borderRadius: "8px" }} onClick={() => handleQuickQuestion("Based on feedback, what are 3 actionable recommendations to improve this product?")}>
            Based on feedback, what are 3 actionable product improvements?
          </div>
        </div>
      </div>
    </div>
  );
}