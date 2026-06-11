import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.07,
    },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function CustomerForm({ customer, setCustomer }) {
  const update = (field, value) =>
    setCustomer((prev) => ({ ...prev, [field]: value }));

  return (
    <motion.div
      className="bill-card"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <p className="section-label">Customer Details</p>
      <div className="bill-divider" />

      <div className="bill-grid">
        {/* Name */}
        <motion.div className="input-wrapper" variants={fieldVariants}>
          <label className="input-label">Full Name</label>
          <input
            className="bill-input"
            type="text"
            placeholder="e.g. Ramesh Kumar"
            value={customer.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </motion.div>

        {/* Mobile */}
        <motion.div className="input-wrapper" variants={fieldVariants}>
          <label className="input-label">Mobile</label>
          <input
            className="bill-input"
            type="tel"
            placeholder="e.g. 9876543210"
            maxLength={10}
            value={customer.mobile}
            onChange={(e) => update("mobile", e.target.value)}
          />
        </motion.div>

        {/* Village */}
        <motion.div className="input-wrapper" variants={fieldVariants}>
          <label className="input-label">Village / City</label>
          <input
            className="bill-input"
            type="text"
            placeholder="e.g. Aligarh"
            value={customer.village}
            onChange={(e) => update("village", e.target.value)}
          />
        </motion.div>

        {/* Date */}
        <motion.div className="input-wrapper" variants={fieldVariants}>
          <label className="input-label">Date</label>
          <input
            className="bill-input"
            type="date"
            value={customer.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
