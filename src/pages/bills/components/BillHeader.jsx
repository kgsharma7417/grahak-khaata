import { motion, AnimatePresence } from "framer-motion";

export default function BillHeader({ total }) {
  return (
    <motion.div
      className="bill-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* LEFT */}
      <div className="bill-header-left">
        <h1 className="bill-title">Jewellery Bills</h1>
        <p className="bill-subtitle">Premium Billing System</p>
      </div>

      {/* RIGHT — Total Chip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={total}
          className="bill-total-chip"
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
        >
          ₹{Number(total).toLocaleString("en-IN")}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
