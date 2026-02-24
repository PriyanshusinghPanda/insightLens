import { useState, useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import ReactMarkdown from "react-markdown";
import { askQuestion, getProducts, saveReport } from "../api";

// ─── Plotly Chart Renderer ────────────────────────────────────────────────────

function InlineChart({ chartData }) {
  if (!chartData) return null;

  const { type, title, labels, datasets } = chartData;

  const colors = [
    "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"
  ];

  let plotData = [];

  if (type === "pie") {
    plotData = [{
      type: "pie",
      labels: labels,
      values: datasets[0]?.data || [],
      marker: { colors: ["#10b981", "#ef4444"] },
      textinfo: "label+percent",
      hole: 0.4
    }];
  } else if (type === "line") {
    plotData = datasets.map((ds, i) => ({
      type: "scatter",
      mode: "lines+markers",
      name: ds.label,
      x: labels,
      y: ds.data,
      yaxis: ds.yAxisID === "y1" ? "y2" : "y",
      line: { color: colors[i % colors.length], width: 2 },
      marker: { size: 6 }
    }));
  } else {
    // bar
    plotData = datasets.map((ds, i) => ({
      type: "bar",
      name: ds.label,
      x: labels,
      y: ds.data,
      marker: { color: colors[i % colors.length] },
      opacity: 0.85
    }));
  }

  const layout = {
    title: { text: title, font: { size: 14, color: "#111" } },
    paper_bgcolor: "#f9fafb",
    plot_bgcolor: "#f9fafb",
    margin: { t: 40, r: 20, b: 60, l: 50 },
    legend: { orientation: "h", y: -0.2 },
    font: { family: "Inter, sans-serif", size: 12 },
    ...(type === "line" && datasets.length > 1 ? {
      yaxis: { title: "NPS Score", side: "left" },
      yaxis2: { title: "Review Count", side: "right", overlaying: "y" }
    } : {}),
    ...(type === "bar" ? { barmode: "group" } : {})
  };

  return (
    <div style={{ marginTop: "12px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <Plot
        data={plotData}
        layout={layout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: "280px" }}
      />
    </div>
  );
}

// ─── Tool Badge ───────────────────────────────────────────────────────────────

const TOOL_META = {
  get_nps:                  { icon: "📊", label: "NPS Lookup",        color: "#6366f1" },
  get_best_worst_products:  { icon: "🏆", label: "Top/Worst Products", color: "#f59e0b" },
  get_product_sentiment:    { icon: "💬", label: "Sentiment Analysis", color: "#10b981" },
  get_trend:                { icon: "📈", label: "Trend Analysis",     color: "#3b82f6" },
  compare_products:         { icon: "⚖️",  label: "Product Comparison", color: "#8b5cf6" },
  summarize_product_reviews:{ icon: "🔍", label: "Review Summary",    color: "#ef4444" },
};

function ToolBadge({ toolName }) {
  if (!toolName || toolName === "none") return null;
  const meta = TOOL_META[toolName] || { icon: "🛠️", label: toolName, color: "#6b7280" };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
      fontWeight: 600, marginBottom: "6px",
      backgroundColor: meta.color + "18",
      color: meta.color, border: `1px solid ${meta.color}40`
    }}>
      {meta.icon} {meta.label}
    </div>
  );
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: "📊", text: "What is the NPS for Electronics?", tool: "get_nps" },
  { icon: "🏆", text: "Which products have the worst ratings in Computers?", tool: "get_best_worst_products" },
  { icon: "📈", text: "Show me the review trend for Home & Kitchen", tool: "get_trend" },
  { icon: "⚖️",  text: "Compare products 1 and 2", tool: "compare_products" },
  { icon: "💬", text: "What is the sentiment for product 5?", tool: "get_product_sentiment" },
  { icon: "🔍", text: "Summarize the reviews for product 3", tool: "summarize_product_reviews" },
];

// ─── Main Chat Component ─────────────────────────────────────────────────────

export default function Chat() {
  const token = localStorage.getItem("token");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [contextProduct, setContextProduct] = useState("");
  const [savedStatus, setSavedStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getProducts(token).then(res => setProducts(res.data)).catch(console.error);
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuery = async () => {
    const q = query.trim();
    if (!q) return;
    if (isLoading) return;

    const userMsg = { role: "user", text: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    const placeholderIndex = messages.length + 1;
    setMessages(prev => [...prev, {
      role: "ai", text: "", tool_used: null, chart_data: null, isLoading: true
    }]);

    try {
      const res = await askQuestion(q, token, contextProduct ? parseInt(contextProduct) : null);
      const { answer, tool_used, chart_data } = res.data;

      setMessages(prev => {
        const updated = [...prev];
        updated[placeholderIndex] = {
          role: "ai",
          text: answer,
          tool_used,
          chart_data,
          questionRef: q,
          isLoading: false
        };
        return updated;
      });
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[placeholderIndex] = {
          role: "ai",
          text: "Sorry, something went wrong while processing your request. Please try again.",
          tool_used: null,
          chart_data: null,
          isLoading: false,
          isError: true
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async (msgIndex) => {
    const msg = messages[msgIndex];
    try {
      await saveReport(token, contextProduct ? parseInt(contextProduct) : null, msg.questionRef, msg.text, msg.tool_used);
      setSavedStatus(prev => ({ ...prev, [msgIndex]: true }));
    } catch {
      alert("Failed to save report.");
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2 className="page-title">AI Analytics Chat</h2>
        <div className="page-subtitle">Ask questions in plain English — the LLM picks the right tool and queries real data</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", height: "calc(100vh - 200px)", minHeight: "500px" }}>

        {/* ── Left: Chat Panel ──────────────────────────────────────── */}
        <div className="dashboard-card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Chat Header */}
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #eaeaea",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", color: "#111" }}>
              <span style={{ fontSize: "18px" }}>✨</span>
              InsightLens — Tool-Calling Chat
            </div>
            {/* Optional product context */}
            <select
              value={contextProduct}
              onChange={e => setContextProduct(e.target.value)}
              className="minimal-input"
              style={{ margin: 0, width: "220px", fontSize: "12px", padding: "6px 10px" }}
            >
              <option value="">No product context</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name?.slice(0, 35)}</option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>🤖</div>
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px 16px", maxWidth: "80%", fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>
                  Hello! I'm your AI analytics assistant. Ask me anything about your Amazon review data — I'll call the right analysis function automatically and show you charts where useful.
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                flexDirection: m.role === "user" ? "row-reverse" : "row",
                gap: "10px", alignItems: "flex-start"
              }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: m.role === "user" ? "#eff6ff" : "#f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "16px"
                }}>
                  {m.role === "user" ? "👤" : "🤖"}
                </div>

                <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: "4px" }}>
                  {/* Tool badge */}
                  {m.role === "ai" && !m.isLoading && <ToolBadge toolName={m.tool_used} />}

                  {/* Bubble */}
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.role === "user" ? "#2563eb" : (m.isError ? "#fef2f2" : "#f9fafb"),
                    color: m.role === "user" ? "#fff" : (m.isError ? "#dc2626" : "#111827"),
                    border: m.role === "user" ? "none" : ("1px solid " + (m.isError ? "#fecaca" : "#e5e7eb")),
                    fontSize: "14px", lineHeight: "1.7"
                  }}>
                    {m.isLoading ? (
                      <div style={{ display: "flex", gap: "5px", alignItems: "center", padding: "4px 0" }}>
                        {[0, 1, 2].map(j => (
                          <div key={j} style={{
                            width: "7px", height: "7px", borderRadius: "50%",
                            background: "#6366f1", opacity: 0.7,
                            animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite`
                          }} />
                        ))}
                        <style>{`@keyframes bounce { 0%, 80%, 100% { transform:translateY(0) } 40% { transform:translateY(-6px) } }`}</style>
                      </div>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Inline chart */}
                  {m.role === "ai" && !m.isLoading && m.chart_data && (
                    <div style={{ width: "100%" }}>
                      <InlineChart chartData={m.chart_data} />
                    </div>
                  )}

                  {/* Save button */}
                  {m.role === "ai" && !m.isLoading && !m.isError && m.text && (
                    <button
                      className="minimal-button"
                      onClick={() => handleSaveReport(i)}
                      disabled={savedStatus[i]}
                      style={{
                        marginTop: "4px", padding: "5px 12px",
                        fontSize: "12px", width: "auto",
                        background: savedStatus[i] ? "#10b981" : "#111"
                      }}
                    >
                      {savedStatus[i] ? "✓ Saved" : "Save Report"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid #eaeaea", background: "#fff" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                className="minimal-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendQuery()}
                placeholder='Ask anything, e.g. "What is the NPS for Electronics?"'
                disabled={isLoading}
                style={{ margin: 0, flex: 1, fontSize: "14px" }}
              />
              <button
                className="minimal-button"
                onClick={sendQuery}
                disabled={isLoading || !query.trim()}
                style={{ width: "auto", padding: "0 20px", opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Suggested Prompts ────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="dashboard-card" style={{ height: "fit-content" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginTop: 0, marginBottom: "14px", color: "#111", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Suggested Questions
            </h3>
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => setQuery(p.text)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "8px",
                  width: "100%", marginBottom: "8px", padding: "10px 12px",
                  background: "#f9fafb", border: "1px solid #e5e7eb",
                  borderRadius: "8px", cursor: "pointer", textAlign: "left",
                  fontSize: "13px", color: "#374151", lineHeight: 1.4,
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
              >
                <span style={{ fontSize: "15px", flexShrink: 0 }}>{p.icon}</span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>

          <div className="dashboard-card" style={{ height: "fit-content" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginTop: 0, marginBottom: "10px", color: "#111", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Available Tools
            </h3>
            {Object.entries(TOOL_META).map(([name, meta]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#6b7280" }}>
                <span>{meta.icon}</span>
                <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}