import { motion, AnimatePresence } from "framer-motion";

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.3 },
  }),
};

export default function PaymentSummary({
  products,
  paidAmount,
  setPaidAmount,
  handleGenerateBill,
}) {
  /* ── Gold Total ── */
  const goldTotal = products
    .filter((p) => p.type === "gold")
    .reduce(
      (sum, p) =>
        sum +
        (Number(p.weight || 0) * Number(p.rate || 0) + Number(p.making || 0)) *
          Number(p.qty || 1),
      0,
    );

  /* ── Silver Total ── */
  const silverTotal = products
    .filter((p) => p.type === "silver")
    .reduce(
      (sum, p) =>
        sum +
        (Number(p.weight || 0) * Number(p.rate || 0) + Number(p.making || 0)) *
          Number(p.qty || 1),
      0,
    );

  /* ── Grand Total ── */
  const grandTotal = goldTotal + silverTotal;

  /* ── Remaining ── */
  const remaining = grandTotal - Number(paidAmount || 0);

  /* ── Rows ── */
  const rows = [
    { label: "Gold Items", value: goldTotal, show: goldTotal > 0 },
    { label: "Silver Items", value: silverTotal, show: silverTotal > 0 },
    { label: "Total Items", value: products.length, isCount: true, show: true },
  ].filter((r) => r.show);

  return (
    <motion.div
      className="bill-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
    >
      {/* Title */}
      <p className="section-label">Payment Summary</p>
      <div className="bill-divider" />

      {/* Rows */}
      <AnimatePresence>
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            className="summary-row"
            custom={i}
            variants={rowVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            <span className="label">{row.label}</span>
            <span className="value">
              {row.isCount
                ? row.value
                : `₹${row.value.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}`}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Paid Input */}
      <div className="input-wrapper" style={{ marginTop: 16 }}>
        <label className="input-label">Paid Amount (₹)</label>
        <input
          className="bill-input"
          type="number"
          placeholder="Enter Paid Amount"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
        />
      </div>

      {/* Grand Total */}
      <motion.div
        className="summary-total-row"
        style={{ marginTop: 16 }}
        key={grandTotal}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 0.35 }}
      >
        <span className="total-label">Grand Total</span>
        <span className="total-value">
          ₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </span>
      </motion.div>

      {/* Remaining */}
      <div
        className="summary-total-row remaining-row"
        style={{ marginTop: 10 }}
      >
        <span className="total-label">Remaining</span>
        <span
          className="remaining-value"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: remaining <= 0 ? "var(--success)" : "var(--danger)",
            letterSpacing: "-0.5px",
          }}
        >
          ₹{remaining.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Generate Button */}
      <motion.button
        className="generate-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerateBill}
      >
        Generate Bill ✦
      </motion.button>
    </motion.div>
  );
}
