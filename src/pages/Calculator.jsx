import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, IndianRupee, Percent, Sparkles } from "lucide-react";
import "./Calculator.css";

export default function Calculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const finalEndDate = endDate || today;

  const totalDays = useMemo(() => {
    if (!startDate) return 0;
    const diff = Math.abs(new Date(finalEndDate) - new Date(startDate));
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [startDate, finalEndDate]);

  const principal = Number(amount);
  const monthlyInterest = (principal * Number(rate)) / 100;
  let interest = 0;

  if (totalDays > 0) {
    interest = monthlyInterest;
    if (totalDays > 31) {
      const extraDays = totalDays - 31;
      const dailyInterest = monthlyInterest / 30;
      interest += dailyInterest * extraDays;
    }
  }

  const total = principal + interest;
  const months = (totalDays / 30).toFixed(1);
  const fmt = (n) => Math.round(n || 0).toLocaleString("en-IN");

  return (
    <div className="page calculator-page">
      {/* Header */}
      <div className="calc-header">
        <div>
          <h2>
            <Sparkles size={18} className="calc-header-icon" />
            Interest Calc
          </h2>
          <p>Smart Girvi Interest System</p>
        </div>
      </div>

      {/* Hero Card */}
      <motion.div
        className="hero-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        <div className="hero-label">Estimated Total</div>
        <div className="hero-amount">₹{fmt(total)}</div>
        <div className="hero-divider" />
        <div className="hero-bottom">
          <div className="hero-stat">
            <span className="hero-stat-label">Principal</span>
            <span className="hero-stat-val">₹{fmt(principal)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Interest</span>
            <span className="hero-stat-val">₹{fmt(interest)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Days</span>
            <span className="hero-stat-val">{totalDays}</span>
          </div>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div
        className="calc-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.08,
          type: "spring",
          stiffness: 280,
          damping: 24,
        }}
      >
        <div className="calc-section-title">💰 Amount & Rate</div>
        <div className="fields-grid">
          <div className="field">
            <label>
              <IndianRupee size={12} /> Amount
            </label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              <Percent size={12} /> Rate / Month
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
        </div>

        <div className="calc-section-title" style={{ marginTop: 16 }}>
          📅 Duration
        </div>
        <div className="fields-grid">
          <div className="field">
            <label>
              <CalendarDays size={12} /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              <CalendarDays size={12} /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <small>Empty = Aaj tak</small>
          </div>
        </div>
      </motion.div>

      {/* Result Card */}
      <motion.div
        className="result-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16 }}
      >
        {[
          { label: "Total Days", value: `${totalDays} days` },
          { label: "Approx Months", value: months },
          { label: "Interest Amount", value: `₹ ${fmt(interest)}` },
        ].map((row) => (
          <div className="result-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
        <div className="result-row final">
          <span>Final Total</span>
          <strong>₹{fmt(total)}</strong>
        </div>
      </motion.div>
    </div>
  );
}
