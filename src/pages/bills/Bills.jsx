import "./Bills.css";
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../../store/useStore";
import BillHeader from "./components/BillHeader";
import CustomerForm from "./components/CustomerForm";
import ProductCard from "./components/ProductCard";
import PaymentSummary from "./components/PaymentSummary";
import BillHistoryCard from "./components/BillHistoryCard";

/* ── ID generator ─────────────────────────────────── */
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const newProduct = () => ({
  id: genId(),
  item: "",
  type: "gold",
  weight: "",
  rate: "",
  making: "",
  qty: 1,
});

const defaultCustomer = () => ({
  name: "",
  mobile: "",
  village: "",
  date: new Date().toISOString().split("T")[0],
});

/* ── Validation ───────────────────────────────────── */
function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(String(mobile).trim());
}

/* ── Toast ────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            style={{
              background: t.type === "error" ? "#c0392b" : "#1D9E75",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              pointerEvents: "auto",
              whiteSpace: "pre-line",
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = genId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);
  return { toasts, addToast };
}

/* ── Main Component ───────────────────────────────── */
export default function Bills() {
  const addBill = useStore((s) => s.addBill);
  const bills = useStore((s) => s.bills);

  const [customer, setCustomer] = useState(defaultCustomer());
  const [products, setProducts] = useState([newProduct()]);
  const [paidAmount, setPaidAmount] = useState("");
  const { toasts, addToast } = useToast();

  const addProduct = () => setProducts((p) => [...p, newProduct()]);

  const removeProduct = (id) =>
    setProducts((p) => (p.length > 1 ? p.filter((x) => x.id !== id) : p));

  const updateProduct = (id, field, value) =>
    setProducts((p) =>
      p.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    );

  const grandTotal = products.reduce((sum, p) => {
    const weight = Number(p.weight) || 0;
    const rate = Number(p.rate) || 0;
    const making = Number(p.making) || 0;
    const qty = Math.max(1, Number(p.qty) || 1);
    return sum + (weight * rate + making) * qty;
  }, 0);

  const safePaid = Math.max(0, Number(paidAmount || 0));
  const remaining = Math.max(0, grandTotal - safePaid);

  /* ── Product Validation ── */
  const validateProducts = () => {
    for (const p of products) {
      if (!p.item.trim()) return "Har product ka item naam daalo";
      if (!p.weight || Number(p.weight) <= 0)
        return "Har product ka weight daalo (0 se zyada)";
      if (!p.rate || Number(p.rate) <= 0)
        return "Har product ki rate daalo (0 se zyada)";
    }
    return null;
  };

  const handleGenerateBill = () => {
    const missing = [];

    if (!customer.name.trim()) missing.push("Customer ka naam");
    if (!customer.mobile.trim()) {
      missing.push("Mobile number");
    } else if (!isValidMobile(customer.mobile)) {
      missing.push("Valid 10 digit mobile number (6-9 se shuru hona chahiye)");
    }

    const productError = validateProducts();
    if (productError) missing.push(productError);

    if (missing.length) {
      addToast(
        "❌ Yeh fields fill karo:\n" + missing.join("\n"),
        "error",
        4000,
      );
      return;
    }

    if (safePaid < 0) {
      addToast("❌ Paid amount negative nahi ho sakta", "error");
      return;
    }

    /* BUG FIX #7: customer.date bhi bill mein save karo
       taaki PDF aur WhatsApp mein sahi date aaye */
    addBill({
      id: genId(),
      customer: { ...customer }, // date field included
      products,
      paidAmount: safePaid,
      total: grandTotal,
      remaining,
      discount: 0,
      paymentHistory: [],
      createdAt: Date.now(),
    });

    addToast("✅ Bill save ho gaya!", "success");

    setCustomer(defaultCustomer());
    setProducts([newProduct()]);
    setPaidAmount("");
  };

  /* Newest bill pehle */
  const sortedBills = Array.isArray(bills)
    ? [...bills].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    : [];

  return (
    <div className="bills-page">
      <BillHeader total={grandTotal} />
      <CustomerForm customer={customer} setCustomer={setCustomer} />

      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            products={products}
            updateProduct={updateProduct}
            removeProduct={removeProduct}
          />
        ))}
      </AnimatePresence>

      <motion.button
        className="add-product-btn"
        onClick={addProduct}
        whileTap={{ scale: 0.98 }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add Product
      </motion.button>

      <PaymentSummary
        products={products}
        paidAmount={paidAmount}
        setPaidAmount={(val) => setPaidAmount(val < 0 ? "0" : val)}
        handleGenerateBill={handleGenerateBill}
      />

      <div className="bill-history">
        <h2 className="history-title">Saved Bills</h2>
        {sortedBills.length === 0 && <p className="empty-text">No Bills Yet</p>}
        <AnimatePresence>
          {sortedBills.map((bill) => (
            <BillHistoryCard key={bill.id} bill={bill} />
          ))}
        </AnimatePresence>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
