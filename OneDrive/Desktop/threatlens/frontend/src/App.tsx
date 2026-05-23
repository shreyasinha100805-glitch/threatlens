import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL
  || (process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://threatlens-backend-1063359417975.us-central1.run.app");

interface Message {
  role: "user" | "assistant";
  text: string;
  toolUsed?: string;
}

interface ThreatLog {
  _id: string;
  event_type: string;
  ip: string;
  user: string;
  severity: string;
  details: string;
  timestamp: string;
}

const severityColor: Record<string, string> = {
  critical: "#ff4444",
  high: "#ff8800",
  medium: "#ffcc00",
  low: "#44bb44",
};

function getFriendlyError(err: unknown) {
  const detail = axios.isAxiosError(err)
    ? err.response?.data?.error || err.message
    : "Unknown error";
  const message = typeof detail === "string" ? detail : JSON.stringify(detail);

  if (/api key|permission_denied|credentials|leaked/i.test(message)) {
    return "ThreatLens AI credentials need attention. I can still answer direct log questions when the backend fallback is deployed.";
  }

  return message;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "I'm ThreatLens, your AI security analyst. Ask me anything about your security logs - try 'What are the critical threats right now?' or 'Check IP 192.168.1.105'" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get(`${API}/threats/recent`).then(r => setThreats(r.data)).catch(() => setThreats([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/chat`, { message: userMsg });
      setMessages(prev => [...prev, { role: "assistant", text: data.text, toolUsed: data.toolUsed }]);
    } catch (err) {
      const detail = getFriendlyError(err);
      setMessages(prev => [...prev, { role: "assistant", text: `Error contacting ThreatLens backend: ${detail}` }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "monospace" }}>

      {/* Sidebar */}
      <div style={{ width: 320, background: "#161b22", borderRight: "1px solid #30363d", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #30363d" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#58a6ff" }}>ThreatLens</div>
          <div style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>AI Security Intelligence</div>
        </div>
        <div style={{ padding: "12px 16px", fontSize: 12, color: "#8b949e", borderBottom: "1px solid #30363d" }}>
          RECENT HIGH SEVERITY EVENTS
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {threats.map(t => (
            <div
              key={t._id}
              onClick={() => setInput(`Tell me about the ${t.event_type} from IP ${t.ip}`)}
              style={{ padding: "12px 16px", borderBottom: "1px solid #21262d", cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1c2128")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: severityColor[t.severity], fontWeight: "bold", textTransform: "uppercase" }}>
                  {t.severity}
                </span>
                <span style={{ fontSize: 10, color: "#8b949e" }}>
                  {new Date(t.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#e6edf3", marginTop: 4 }}>{t.event_type.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>IP: {t.ip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #30363d", background: "#161b22" }}>
          <div style={{ fontSize: 16, fontWeight: "bold" }}>Security Intelligence Chat</div>
          <div style={{ fontSize: 12, color: "#8b949e" }}>Powered by Gemini + MongoDB Atlas</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.toolUsed && (
                <div style={{ fontSize: 10, color: "#58a6ff", marginBottom: 4 }}>
                  Used tool: {m.toolUsed}
                </div>
              )}
              <div style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "#1f6feb" : "#161b22",
                border: m.role === "assistant" ? "1px solid #30363d" : "none",
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "#161b22", border: "1px solid #30363d", fontSize: 14, color: "#8b949e" }}>
                Analyzing security data...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #30363d", background: "#161b22", display: "flex", gap: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ask about threats, IPs, incidents..."
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 8, border: "1px solid #30363d",
              background: "#0d1117", color: "#e6edf3", fontSize: 14, outline: "none", fontFamily: "monospace"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: "12px 24px", borderRadius: 8, border: "none",
              background: loading ? "#21262d" : "#1f6feb", color: "#fff",
              fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace"
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
