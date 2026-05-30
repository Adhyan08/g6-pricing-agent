import { useState, useRef, useMemo } from "react";

const PROPERTIES = [
  { id: "p1", name: "Motel 6 Austin South",            city: "Austin",    state: "TX", rooms: 95,  rate: 64 },
  { id: "p2", name: "Motel 6 Nashville Airport",        city: "Nashville", state: "TN", rooms: 120, rate: 72 },
  { id: "p3", name: "Studio 6 Houston Energy Corridor", city: "Houston",   state: "TX", rooms: 140, rate: 58 },
  { id: "p4", name: "Motel 6 Phoenix North",            city: "Phoenix",   state: "AZ", rooms: 108, rate: 55 },
  { id: "p5", name: "Motel 6 Denver Airport",           city: "Denver",    state: "CO", rooms: 130, rate: 69 },
  { id: "p6", name: "Studio 6 Atlanta Perimeter",       city: "Atlanta",   state: "GA", rooms: 115, rate: 62 },
];

const fmtDate = s => !s ? "" : new Date(s + "T12:00:00").toLocaleDateString("en-US", {
  weekday: "short", month: "short", day: "numeric",
});
const fmt$ = n => "$" + Math.abs(Math.round(n)).toLocaleString();

// All API calls go to our own backend — key is never in frontend
async function runAnalysis(prop, checkin, checkout, nights) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prop, checkin, checkout, nights }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data;
}

const DC = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };
const CC = { high: "#10B981", medium: "#F59E0B", low: "#EF4444" };
const UC = { immediate: "#EF4444", "this week": "#F59E0B", monitor: "#10B981" };
const CE = { music: "🎵", sports: "🏆", conference: "🎤", festival: "🎉", corporate: "🏢" };

export default function App() {
  const [prop, setProp]         = useState(PROPERTIES[0]);
  const [checkin, setCheckin]   = useState("2026-06-06");
  const [checkout, setCheckout] = useState("2026-06-08");
  const [result, setResult]     = useState(null);
  const [log, setLog]           = useState([]);
  const [busy, setBusy]         = useState(false);
  const [step, setStep]         = useState("");
  const [err, setErr]           = useState("");
  const logRef = useRef(null);

  const nights = useMemo(() =>
    Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000)),
    [checkin, checkout]
  );

  const addLog = (msg, type = "info") => {
    setLog(p => [...p.slice(-20), { msg, type, id: Math.random() }]);
    setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
  };

  const run = async () => {
    setBusy(true); setErr(""); setResult(null); setLog([]);
    setStep("Running all three agents…");
    addLog(`Analysis started for ${prop.name}`, "info");
    addLog("Market Intel + Demand Scout + Pricing Engine — single backend call", "search");
    try {
      const data = await runAnalysis(prop, checkin, checkout, nights);
      setResult(data);
      const r = data.recommendation;
      addLog(`${data.competitors?.length} competitors found`, "success");
      addLog(`${data.signals?.length} demand signals found`, "success");
      addLog(`Recommendation: ${r.rateChangeDirection} to $${r.recommendedRate}/night → ${fmt$(r.revenueImpactTotal)} total impact`, "success");
      setStep("");
    } catch (e) {
      setErr(e.message);
      addLog("Error: " + e.message.slice(0, 100), "error");
      setStep("");
    }
    setBusy(false);
  };

  const reset = p => { setProp(p); setResult(null); setErr(""); setLog([]); };

  const rec         = result?.recommendation;
  const competitors = result?.competitors || [];
  const signals     = result?.signals     || [];
  const impactColor = rec?.rateChangeDirection === "increase" ? "#10B981"
                    : rec?.rateChangeDirection === "decrease" ? "#EF4444" : "#F59E0B";

  const card = { background: "#0C1420", border: "1px solid #0F1C28", borderRadius: 10, overflow: "hidden" };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "system-ui,sans-serif", background: "#060A10", color: "#E2E8F4" }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{ width: 242, background: "#08101A", borderRight: "1px solid #0F1C28", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Brand */}
        <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid #0F1C28" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#3B82F6,#1D4ED8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>↑</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F4" }}>Pricing Agent</div>
              <div style={{ fontSize: 10, color: "#1E3A56" }}>G6 Hospitality · Revenue AI</div>
            </div>
          </div>

          {/* Agent pipeline status */}
          {[
            { l: "Market Intel",   c: "#3B82F6", done: (result?.competitors?.length || 0) > 0 },
            { l: "Demand Scout",   c: "#F59E0B", done: (result?.signals?.length     || 0) > 0 },
            { l: "Pricing Engine", c: "#10B981", done: !!rec },
          ].map(a => (
            <div key={a.l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.done ? a.c : busy ? a.c + "55" : "#1A2A3A" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: a.done ? a.c : busy ? a.c + "88" : "#1A3A50" }}>{a.l}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: a.done ? "#2A5A40" : "#1A2A3A" }}>
                {a.done ? "✓ DONE" : busy ? "RUNNING" : "IDLE"}
              </span>
            </div>
          ))}
        </div>

        {/* Dates */}
        <div style={{ padding: "12px 13px", borderBottom: "1px solid #0F1C28" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#1E3A56", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Analysis Period</div>
          {[{ l: "Check-in", v: checkin, s: setCheckin }, { l: "Check-out", v: checkout, s: setCheckout }].map(f => (
            <div key={f.l} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#2A4560", marginBottom: 3 }}>{f.l}</div>
              <input type="date" value={f.v} onChange={e => f.s(e.target.value)} disabled={busy}
                style={{ width: "100%", padding: "7px 9px", borderRadius: 6, border: "1px solid #0F1C28", background: "#060A10", color: "#8ABADC", fontSize: 12 }} />
            </div>
          ))}
          <div style={{ textAlign: "center", fontSize: 11, color: "#2A4560" }}>{nights} night{nights !== 1 ? "s" : ""}</div>
        </div>

        {/* Properties */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#1E3A56", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 4px 8px" }}>G6 Properties</div>
          {PROPERTIES.map(p => (
            <button key={p.id} onClick={() => reset(p)}
              style={{ width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 7, border: prop.id === p.id ? "1px solid #1E3A56" : "1px solid transparent", cursor: "pointer", marginBottom: 3, background: prop.id === p.id ? "#0D1E30" : "transparent" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: prop.id === p.id ? "#8ABADC" : "#3A5570" }}>{p.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 10, color: "#1E3A56" }}>{p.city}, {p.state} · {p.rooms} rooms</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B" }}>${p.rate}/nt</span>
              </div>
            </button>
          ))}
        </div>

        {/* Agent log */}
        <div style={{ borderTop: "1px solid #0F1C28", padding: "10px 12px", height: 155, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#1E3A56", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Agent Log</div>
          <div ref={logRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {log.length === 0
              ? <div style={{ color: "#1A2E40", fontSize: 11 }}>Ready — pick a property and run</div>
              : log.map(l => (
                <div key={l.id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                    background: l.type === "error" ? "#EF4444" : l.type === "success" ? "#10B981" : l.type === "search" ? "#3B82F6" : "#F59E0B" }} />
                  <span style={{ fontSize: 10, lineHeight: 1.5,
                    color: l.type === "error" ? "#EF4444" : l.type === "success" ? "#34D399" : "#3A5570" }}>{l.msg}</span>
                </div>
              ))}
          </div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #0F1C28", background: "#08101A", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F4" }}>{prop.name}</div>
            <div style={{ fontSize: 12, color: "#2A4560" }}>
              {fmtDate(checkin)} → {fmtDate(checkout)} · {prop.rooms} rooms ·
              Current: <span style={{ color: "#F59E0B", fontWeight: 700 }}>${prop.rate}/night</span>
            </div>
          </div>
          <button onClick={run} disabled={busy}
            style={{ background: busy ? "#0A1825" : "#3B82F6", color: "#fff", border: "none", borderRadius: 8,
              padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer",
              flexShrink: 0, opacity: busy ? 0.7 : 1 }}>
            {busy ? `⟳  ${step || "Analysing…"}` : "▶  Run Pricing Analysis"}
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {err && (
            <div style={{ background: "#140810", border: "1px solid #EF444455", borderRadius: 8,
              padding: "12px 16px", color: "#EF4444", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              ⚠ {err}
            </div>
          )}

          {/* Landing */}
          {!result && !busy && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ fontSize: 11, color: "#1E4060", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                G6 Hospitality · AI Revenue Management
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#C8D8EC", marginBottom: 8 }}>Dynamic Pricing Agent</h2>
              <p style={{ fontSize: 13, color: "#3A5570", lineHeight: 1.8, marginBottom: 20 }}>
                Three specialist AI agents run in one backend call — searches real competitor rates, finds local demand signals, and generates a specific rate recommendation with exact revenue impact.
              </p>
              {[
                { c: "#3B82F6", l: "Market Intel Agent",   d: "Searches Booking.com & Expedia for real competitor hotel rates for your exact dates" },
                { c: "#F59E0B", l: "Demand Scout Agent",   d: "Finds real local events — concerts, sports, conferences — driving occupancy demand" },
                { c: "#10B981", l: "Pricing Engine",       d: "Recommends exact rate with revenue impact across all rooms × nights, 0% OTA commission" },
              ].map(s => (
                <div key={s.l} style={{ display: "flex", gap: 14, padding: "12px 14px", background: "#0C1420", border: "1px solid #0F1C28", borderRadius: 9, marginBottom: 8 }}>
                  <div style={{ width: 4, borderRadius: 2, background: s.c, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.c, marginBottom: 3 }}>{s.l}</div>
                    <div style={{ fontSize: 12, color: "#3A5570", lineHeight: 1.6 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {busy && !result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}>
              <p style={{ fontSize: 13, color: "#3A5570", marginBottom: 4 }}>Running all three agents via secure backend…</p>
              {[
                { c: "#3B82F6", l: "Market Intel Agent",   d: "Searching competitor rates in " + prop.city + "…" },
                { c: "#F59E0B", l: "Demand Scout Agent",   d: "Scanning local events and demand signals…" },
                { c: "#10B981", l: "Pricing Engine",       d: "Generating rate recommendation with revenue impact…" },
              ].map(a => (
                <div key={a.l} style={{ background: "#0C1420", border: `1px solid ${a.c}33`, borderRadius: 10,
                  padding: "13px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.c, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: a.c }}>{a.l}</div>
                    <div style={{ fontSize: 11, color: "#3A5570", marginTop: 2 }}>{a.d}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 18, color: a.c + "55" }}>⟳</div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 16, alignItems: "start" }}>

              {/* LEFT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Competitor table */}
                <div style={card}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #0F1C28", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.07em" }}>Market Intel · Competitor Rates</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#1E3A56" }}>{fmtDate(checkin)}</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#080D14" }}>
                        {["Property", "Tier", "Rate/Night", "vs Ours", "Status"].map(h => (
                          <th key={h} style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: "#1E3A56", textTransform: "uppercase", textAlign: "left", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: "#0D1E30", borderBottom: "1px solid #0F1C28" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6" }}>
                            {prop.name} <span style={{ fontSize: 9, background: "#3B82F622", color: "#3B82F6", padding: "1px 5px", borderRadius: 3 }}>OURS</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#3A5570" }}>economy</td>
                        <td style={{ padding: "10px 14px", fontSize: 17, fontWeight: 900, color: "#F59E0B" }}>${prop.rate}</td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#1E3A56" }}>baseline</td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#10B981" }}>available</td>
                      </tr>
                      {competitors.map((c, i) => {
                        const diff = c.ratePerNight - prop.rate;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #090E16" }}>
                            <td style={{ padding: "9px 14px" }}>
                              <div style={{ fontSize: 12, color: "#8AA8C4", fontWeight: 500 }}>{c.name}</div>
                              <div style={{ fontSize: 10, color: "#1E3A56" }}>{c.distanceMiles} mi · {c.brand}</div>
                            </td>
                            <td style={{ padding: "9px 14px", fontSize: 11, color: "#3A5570", textTransform: "capitalize" }}>{c.tier}</td>
                            <td style={{ padding: "9px 14px", fontSize: 14, fontWeight: 700, color: "#C8D8E8" }}>${c.ratePerNight}</td>
                            <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700,
                              color: diff > 8 ? "#10B981" : diff < -5 ? "#EF4444" : "#F59E0B" }}>
                              {diff > 0 ? "+" : ""}{diff}
                            </td>
                            <td style={{ padding: "9px 14px", fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                              color: c.availability === "sold out" ? "#EF4444" : c.availability === "limited" ? "#F59E0B" : "#10B981" }}>
                              {c.availability}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Demand signals */}
                <div style={card}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #0F1C28", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.07em" }}>Demand Scout · Local Events</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#1E3A56" }}>{signals.length} signals</span>
                  </div>
                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {signals.map((s, i) => (
                      <div key={i} style={{ background: "#080D14", borderRadius: 8, padding: "11px 13px", display: "flex", gap: 12 }}>
                        <div style={{ width: 36, height: 36, background: (DC[s.demandImpact] || "#10B981") + "18", borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                          {CE[s.category] || "📅"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#C8D8E8" }}>{s.event}</span>
                            <span style={{ background: (DC[s.demandImpact] || "#10B981") + "22", color: DC[s.demandImpact] || "#10B981",
                              fontSize: 9, padding: "2px 7px", borderRadius: 99, fontWeight: 700 }}>
                              {s.demandImpact?.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#2A4560" }}>{s.date} · {s.venue} · {s.expectedAttendance} expected</div>
                          {s.note && <div style={{ fontSize: 11, color: "#3A5570", marginTop: 4, fontStyle: "italic" }}>{s.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {rec && (
                  <div style={{ background: "#0C1420", border: "1px solid #10B98144", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #0F1C28", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.07em" }}>Pricing Engine</span>
                      {rec.urgency && (
                        <span style={{ marginLeft: "auto", background: (UC[rec.urgency] || "#F59E0B") + "22",
                          color: UC[rec.urgency] || "#F59E0B", fontSize: 9, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                          {rec.urgency?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "18px 16px" }}>
                      {/* Rate */}
                      <div style={{ display: "flex", alignItems: "center", background: "#080D14", borderRadius: 9, padding: "14px", marginBottom: 16 }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#2A4560", marginBottom: 4 }}>CURRENT</div>
                          <div style={{ fontSize: 26, fontWeight: 900, color: "#EF4444", textDecoration: "line-through" }}>${prop.rate}</div>
                        </div>
                        <div style={{ fontSize: 22, color: impactColor, padding: "0 10px" }}>→</div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#2A4560", marginBottom: 4 }}>RECOMMENDED</div>
                          <div style={{ fontSize: 34, fontWeight: 900, color: "#10B981" }}>${rec.recommendedRate}</div>
                        </div>
                      </div>
                      {/* Primary reason */}
                      <div style={{ background: "#0A1018", borderRadius: 8, padding: "11px 13px", marginBottom: 12, borderLeft: "3px solid #10B981" }}>
                        <div style={{ fontSize: 13, color: "#A8D0B8", lineHeight: 1.6 }}>{rec.primaryReason}</div>
                      </div>
                      {/* Reasoning */}
                      <div style={{ marginBottom: 14 }}>
                        {(rec.reasoning || []).map((r, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                            <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>
                            <span style={{ fontSize: 12, color: "#3A5570", lineHeight: 1.5 }}>{r}</span>
                          </div>
                        ))}
                      </div>
                      {/* Badges */}
                      <div style={{ display: "flex", gap: 8, marginBottom: rec.riskNote ? 12 : 0 }}>
                        {[
                          { l: "Confidence", v: rec.confidence,    c: CC[rec.confidence] || "#10B981" },
                          { l: "Position",   v: rec.marketPosition, c: rec.marketPosition === "below market" ? "#EF4444" : rec.marketPosition === "at market" ? "#F59E0B" : "#10B981" },
                        ].map(b => (
                          <div key={b.l} style={{ flex: 1, background: "#080D14", borderRadius: 7, padding: "8px", textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#1E3A56", textTransform: "uppercase", marginBottom: 3 }}>{b.l}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: b.c, textTransform: "capitalize" }}>{b.v}</div>
                          </div>
                        ))}
                      </div>
                      {rec.riskNote && (
                        <div style={{ fontSize: 11, color: "#2A4560", fontStyle: "italic", borderTop: "1px solid #0F1C28", paddingTop: 10, marginTop: 12 }}>
                          ⚠ {rec.riskNote}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {rec && (
                  <div style={card}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid #0F1C28" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.07em" }}>Revenue Impact</span>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      {[
                        { l: `Per night (${Math.round(prop.rooms * 0.75)} rooms @ 75% occ)`, v: fmt$(rec.revenueImpactPerNight), c: impactColor, big: false },
                        { l: `Total (${nights} night${nights !== 1 ? "s" : ""})`,             v: fmt$(rec.revenueImpactTotal),    c: impactColor, big: true  },
                        { l: "Competitor economy avg", v: "$" + rec.competitorEconomyAvg + "/night", c: "#3B82F6", big: false },
                        { l: "Price floor",            v: "$" + rec.priceFloor,                      c: "#3A5570", big: false },
                        { l: "Price ceiling",          v: "$" + rec.priceCeiling,                    c: "#3A5570", big: false },
                      ].map(m => (
                        <div key={m.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #090E16" }}>
                          <span style={{ fontSize: 12, color: "#3A5570" }}>{m.l}</span>
                          <span style={{ fontSize: m.big ? 19 : 13, fontWeight: m.big ? 800 : 600, color: m.c }}>{m.v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 10, background: "#0A1825", borderRadius: 7, padding: "9px 11px", fontSize: 11, color: "#2A4560", lineHeight: 1.6 }}>
                        Direct booking · 0% OTA commission · {prop.rooms} rooms total
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
