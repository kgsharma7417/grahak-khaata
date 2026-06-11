import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3 },
  }),
};

export default function ProductCard({
  product,
  index,
  products,
  updateProduct,
  removeProduct,
}) {
  /* ── Product total calculation ── */
  const itemTotal =
    Number(product.weight || 0) * Number(product.rate || 0) +
    Number(product.making || 0);

  const total = itemTotal * Number(product.qty || 1);

  return (
    <motion.div
      className="bill-card"
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── TOP ROW ── */}
      <div className="product-top">
        <div className="product-index-badge">
          <motion.div
            className="product-badge"
            key={index}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {index + 1}
          </motion.div>
          <h3 className="card-title" style={{ marginBottom: 0 }}>
            Product {index + 1}
          </h3>
        </div>

        <AnimatePresence>
          {products.length > 1 && (
            <motion.button
              className="remove-btn"
              onClick={() => removeProduct(product.id)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileTap={{ scale: 0.88 }}
              transition={{ duration: 0.2 }}
              title="Remove product"
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── GOLD / SILVER TOGGLE ── */}
      <div className="type-row">
        {["gold", "silver"].map((type) => (
          <button
            key={type}
            className={`type-btn ${product.type === type ? "active" : ""}`}
            onClick={() => updateProduct(product.id, "type", type)}
          >
            {type === "gold" ? "🥇 Gold" : "🥈 Silver"}
          </button>
        ))}
      </div>

      {/* ── FORM FIELDS ── */}
      <div className="bill-grid">
        {[
          {
            field: "item",
            label: "Item Name",
            type: "text",
            placeholder: "e.g. Necklace",
            span: 2,
          },
          {
            field: "weight",
            label: "Weight (g)",
            type: "number",
            placeholder: "0.00",
          },
          {
            field: "rate",
            label: "Rate / g (₹)",
            type: "number",
            placeholder: "0",
          },
          {
            field: "making",
            label: "Making Charges (₹)",
            type: "number",
            placeholder: "0",
          },
          { field: "qty", label: "Quantity", type: "number", placeholder: "1" },
        ].map((f, i) => (
          <motion.div
            key={f.field}
            className="input-wrapper"
            style={f.span === 2 ? { gridColumn: "span 2" } : {}}
            custom={i}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="input-label">{f.label}</label>
            <input
              className="bill-input"
              type={f.type}
              placeholder={f.placeholder}
              value={product[f.field]}
              min={f.type === "number" ? 0 : undefined}
              onChange={(e) =>
                updateProduct(product.id, f.field, e.target.value)
              }
            />
          </motion.div>
        ))}
      </div>

      {/* ── PRODUCT TOTAL ── */}
      <motion.div
        className="product-total"
        key={total}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 0.3 }}
      >
        <span>Product Total</span>
        <strong>
          ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </strong>
      </motion.div>
    </motion.div>
  );
}
