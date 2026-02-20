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

  return (
    <div style={{ padding: 30 }}>
      <h2>AI Product Analyst</h2>

      <div style={{ border: "1px solid gray", padding: 10, height: 300, overflowY: "scroll" }}>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.role === "user" ? "You" : "AI"}:</b> {m.text}
          </p>
        ))}
      </div>

      <br/>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask about product reviews..."
      />

      <button onClick={sendQuestion}>Send</button>
    </div>
  );
}