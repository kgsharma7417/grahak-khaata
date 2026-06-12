import "./Bills.css";
import { useState, useEffect, useRef, useCallback } from "react";
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

/* FIX #11: ab har product ki saari errors collect hoti hain,
   sirf pehli wali pe nahi ruk jaate. Making charge (negative)
   aur qty (<=0) ke liye bhi proper validation add ki gayi hai. */
function validateProducts(products) {
  const errors = [];

  products.forEach((p, idx) => {
    const n = idx + 1;

    if (!p.item.trim()) {
      errors.push(`Product ${n}: item ka naam daalo`);
    }
    if (!p.weight || Number(p.weight) <= 0) {
      errors.push(`Product ${n}: weight 0 se zyada hona chahiye`);
    }
    if (!p.rate || Number(p.rate) <= 0) {
      errors.push(`Product ${n}: rate 0 se zyada hona chahiye`);
    }
    // FIX: making charge ke liye validation (negative allowed nahi)
    if (p.making !== "" && Number(p.making) < 0) {
      errors.push(`Product ${n}: making charge negative nahi ho sakta`);
    }
    // FIX: qty ke liye proper validation (pehle silently 1 clamp ho jaata tha)
    const qty = Number(p.qty);
    if (!p.qty || isNaN(qty) || qty <= 0) {
      errors.push(`Product ${n}: quantity 1 ya usse zyada hona chahiye`);
    }
  });

  return errors;
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

/* FIX #1: setTimeout ke timeout-ids ko track karke unmount pe
   clearTimeout kiya jaata hai, taaki unmounted component pe
   setState call na ho (memory leak / warning fix). */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((tid) => clearTimeout(tid));
      timeoutsRef.current = [];
    };
  }, []);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = genId();
    setToasts((prev) => [...prev, { id, message, type }]);
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== timeoutId);
    }, duration);
    timeoutsRef.current.push(timeoutId);
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

  /* FIX #10: final total ko 2 decimal places tak round kiya
     jaata hai taaki floating point precision issues
     (0.1 + 0.2 type) na aaye. */
  const rawTotal = products.reduce((sum, p) => {
    const weight = Number(p.weight) || 0;
    const rate = Number(p.rate) || 0;
    const making = Number(p.making) || 0;
    const qty = Math.max(1, Number(p.qty) || 1);
    return sum + (weight * rate + making) * qty;
  }, 0);
  const grandTotal = Math.round(rawTotal * 100) / 100;

  const safePaid = Math.max(0, Number(paidAmount || 0));
  const remaining = Math.max(
    0,
    Math.round((grandTotal - safePaid) * 100) / 100,
  );

  /* FIX #2: agar customer ne zyada paisa de diya (paid > total),
     toh ye extra/advance amount track karte hain taaki paisa
     "gayab" na ho jaaye — UI is value ko dikha sakta hai. */
  const advanceAmount = Math.max(
    0,
    Math.round((safePaid - grandTotal) * 100) / 100,
  );

  /* FIX #4: PaidAmount input ko sanitize karte hain — sirf
     numbers/decimal allow, negative ya garbage text allow nahi. */
  const handlePaidAmountChange = (val) => {
    if (val === "" || val === null || val === undefined) {
      setPaidAmount("");
      return;
    }
    const str = String(val);
    // sirf digits aur ek decimal point allow karo (negative reject)
    if (!/^\d*\.?\d*$/.test(str)) return;
    setPaidAmount(str);
  };

  const handleGenerateBill = () => {
    const missing = [];

    if (!customer.name.trim()) missing.push("Customer ka naam");
    if (!customer.mobile.trim()) {
      missing.push("Mobile number");
    } else if (!isValidMobile(customer.mobile)) {
      missing.push("Valid 10 digit mobile number (6-9 se shuru hona chahiye)");
    }

    /* FIX #6: ab saare products ki saari errors ek saath dikhti hain */
    const productErrors = validateProducts(products);
    missing.push(...productErrors);

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

    /* FIX #7: agar customer.date kisi tarah empty reh gayi ho
       (form se clear ho gayi ho), toh aaj ki date fallback ke
       roop mein use hogi — taaki PDF/WhatsApp mein date kabhi
       blank na jaaye. */
    const customerData = {
      ...customer,
      date: customer.date || new Date().toISOString().split("T")[0],
    };

    /* FIX #9: addBill ko try/catch mein wrap kiya gaya, taaki
       store mein koi issue aaye toh app crash na ho aur user ko
       error toast dikhe. */
    try {
      addBill({
        id: genId(),
        customer: customerData,
        products,
        paidAmount: safePaid,
        total: grandTotal,
        remaining,
        advance: advanceAmount,
        discount: 0,
        paymentHistory: [],
        createdAt: Date.now(),
      });

      addToast("✅ Bill save ho gaya!", "success");

      setCustomer(defaultCustomer());
      setProducts([newProduct()]);
      setPaidAmount("");
    } catch (err) {
      console.error("Bill save error:", err);
      addToast("❌ Bill save karte waqt error aaya, dobara try karo", "error");
    }
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
        aria-label="Naya product add karo"
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add Product
      </motion.button>

      <PaymentSummary
        products={products}
        paidAmount={paidAmount}
        setPaidAmount={handlePaidAmountChange}
        handleGenerateBill={handleGenerateBill}
        advanceAmount={advanceAmount}
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
