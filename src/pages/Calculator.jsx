import { useState, useMemo } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Math.round(n || 0).toLocaleString("en-IN");

const daysBetween = (a, b) => {
  const ms = new Date(b) - new Date(a);
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
};

// Simple interest: principal × rate% × days / 30
const calcSimple = (p, r, days) => (p * r * days) / (100 * 30);

// Compound interest: compounded yearly
// Monthly rate r% → annual rate = r × 12
// A = P(1 + annualRate/100)^years — fractional years handled via exact days
const calcCompound = (p, r, days) => {
  const annualRate = r * 12;
  const years = days / 365;
  return p * (Math.pow(1 + annualRate / 100, years) - 1);
};

// ─── component ──────────────────────────────────────────────────────────────
export default function Calculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mode, setMode] = useState("simple"); // "simple" | "compound"
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const finalEnd = endDate || today;

  // ── validation flags ──────────────────────────────────────────────────────
  const endBeforeStart =
    startDate && endDate && new Date(endDate) < new Date(startDate);

  const rateNum = Number(rate);
  const rateWarning = rateNum > 0 && rateNum > 10; // warn if > 10%/month

  // ── core calculation ──────────────────────────────────────────────────────
  const { totalDays, interest, total, months } = useMemo(() => {
    const principal = Number(amount);
    if (!startDate || !principal || !rateNum || endBeforeStart) {
      return { totalDays: 0, interest: 0, total: principal, months: "0.0" };
    }
    const d = daysBetween(startDate, finalEnd);
    const m = (d / 30).toFixed(1);
    const i =
      mode === "compound"
        ? calcCompound(principal, rateNum, d)
        : calcSimple(principal, rateNum, d);
    return { totalDays: d, interest: i, total: principal + i, months: m };
  }, [amount, rate, startDate, finalEnd, mode, endBeforeStart]);

  const principal = Number(amount) || 0;

  // ── copy result to clipboard ───────────────────────────────────────────────
  const handleCopy = () => {
    const text =
      `Girvi Calculation\n` +
      `Loan: ₹${fmt(principal)}\n` +
      `Rate: ${rateNum}%/month (${mode === "compound" ? "Compound" : "Simple"})\n` +
      `Duration: ${totalDays} days (${months} months)\n` +
      `Interest: ₹${fmt(interest)}\n` +
      `Total: ₹${fmt(total)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── ready state ───────────────────────────────────────────────────────────
  const isReady = principal > 0 && rateNum > 0 && startDate && totalDays > 0;

  return (
    <div style={{ padding: "16px", fontFamily: "inherit", maxWidth: 420 }}>
      {/* ── header ── */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          ✦ Interest Calculator
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
          Smart Girvi Interest System
        </p>
      </div>

      {/* ── hero card ── */}
      <div
        style={{
          background: isReady
            ? "linear-gradient(135deg, #92400e, #b45309)"
            : "#f3f4f6",
          borderRadius: 16,
          padding: "20px 20px 16px",
          marginBottom: 16,
          transition: "background 0.4s",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: isReady ? "rgba(255,255,255,0.7)" : "#9ca3af",
            marginBottom: 4,
          }}
        >
          ESTIMATED TOTAL
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: isReady ? "#fff" : "#d1d5db",
          }}
        >
          {isReady ? `₹${fmt(total)}` : "—"}
        </div>

        {isReady && (
          <>
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.2)",
                margin: "14px 0",
              }}
            />
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { label: "Principal", value: `₹${fmt(principal)}` },
                { label: "Interest", value: `₹${fmt(interest)}` },
                { label: "Days", value: totalDays },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#fff",
                      marginTop: 2,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── interest type toggle ── */}
      <div
        style={{
          display: "flex",
          background: "#f3f4f6",
          borderRadius: 10,
          padding: 4,
          marginBottom: 16,
          gap: 4,
        }}
      >
        {[
          { id: "simple", label: "Simple Interest" },
          { id: "compound", label: "Compound Interest" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: mode === m.id ? 700 : 400,
              background: mode === m.id ? "#fff" : "transparent",
              color: mode === m.id ? "#92400e" : "#6b7280",
              boxShadow: mode === m.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── form card ── */}
      <div
        style={{
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#9ca3af",
            marginBottom: 12,
          }}
        >
          💰 AMOUNT & RATE
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {/* amount */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 4,
              }}
            >
              ₹ Amount
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
            />
          </div>
          {/* rate */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 4,
              }}
            >
              % Rate / Month
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              placeholder="0.0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: rateWarning ? "#f59e0b" : "#e5e7eb",
              }}
            />
            {rateWarning && (
              <div style={{ fontSize: 10, color: "#b45309", marginTop: 3 }}>
                ⚠️ Rate {rateNum}% — unusually high
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#9ca3af",
            marginBottom: 12,
            marginTop: 16,
          }}
        >
          📅 DURATION
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 4,
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 4,
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: endBeforeStart ? "#ef4444" : "#e5e7eb",
              }}
            />
            {endBeforeStart ? (
              <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>
                ✗ End date before start
              </div>
            ) : (
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>
                Khali = Aaj tak
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── result breakdown ── */}
      {isReady && (
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          {[
            { label: "Total Days", value: `${totalDays} days` },
            { label: "Approx Months", value: `${months} months` },
            {
              label: "Interest Type",
              value: mode === "compound" ? "Compound (yearly)" : "Simple",
            },
            { label: "Interest Amount", value: `₹${fmt(interest)}` },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#6b7280" }}>{row.label}</span>
              <strong style={{ color: "#1a1a1a" }}>{row.value}</strong>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0 0",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            <span>Final Total</span>
            <span style={{ color: "#b45309" }}>₹{fmt(total)}</span>
          </div>
        </div>
      )}

      {/* ── copy button ── */}
      {isReady && (
        <button
          onClick={handleCopy}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "none",
            background: copied ? "#d1fae5" : "#fef3c7",
            color: copied ? "#065f46" : "#92400e",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy Result"}
        </button>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 10,
  border: "1.5px solid #e5e7eb",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: "#fafafa",
};
