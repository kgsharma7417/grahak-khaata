import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  MapPin,
  ArrowLeft,
  Receipt,
  Lock,
  CalendarDays,
  IndianRupee,
  CreditCard,
  Package,
  ChevronDown,
  ChevronUp,
  Banknote,
  Check,
  Plus,
  X,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useState } from "react";
import "./CustomerDetails.css";

// ── Interest calculator (Girvi.jsx se same logic) ──────────────────────────
function calcInterest(record) {
  if (!record.date || !record.interest || !record.amount) return 0;

  const start = new Date(record.date);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const days = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

  if (days === 0) return 0;

  const amount = Number(record.amount);
  const rate = Number(record.interest); // % per month

  const fullMonths = Math.floor(days / 30); // poore mahine
  const remainingDays = days % 30; // baaki din

  // Pehle 30 din mein ek bhi din kam ho toh poora mahina lagega
  // Matlab: pehla mahina = min 1 mahina guaranteed
  const billableMonths = fullMonths === 0 ? 1 : fullMonths;

  // Monthly byaaj
  const monthlyByaaj = Math.round((amount * rate * billableMonths) / 100);

  // Baaki dino ki byaaj (per day = monthly / 30)
  const dailyRate = (amount * rate) / 100 / 30;
  const extraDaysInterest =
    fullMonths === 0
      ? 0 // pehle mahine mein extra din nahi — poora mahina already count ho gaya
      : Math.round(dailyRate * remainingDays);

  return monthlyByaaj + extraDaysInterest;
}

function totalPaid(record) {
  return (record.payments || []).reduce((s, p) => s + Number(p.amount), 0);
}

function remaining(record) {
  return Math.max(
    0,
    Number(record.amount) + calcInterest(record) - totalPaid(record),
  );
}

const today = () => new Date().toISOString().split("T")[0];

// ── Girvi Payment Section ───────────────────────────────────────────────────
function GirviPaymentSection({ record }) {
  const addGirviPayment = useStore((s) => s.addGirviPayment);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [amt, setAmt] = useState("");

  const paid = totalPaid(record);

  const handleSave = () => {
    if (!amt) return;
    addGirviPayment(record.id, Number(amt));
    setAmt("");
    setFormOpen(false);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-page)",
          border: "1px solid var(--border-color)",
          borderRadius: 10,
          padding: "8px 12px",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontSize: 13,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Banknote size={13} /> Jama History ({(record.payments || []).length})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: "#dcfce7",
              color: "#166534",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Jama: ₹{paid.toLocaleString("en-IN")}
          </span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                border: "1px solid var(--border-color)",
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                padding: "10px 12px",
                background: "var(--bg-page)",
              }}
            >
              {(record.payments || []).length === 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    margin: "8px 0",
                  }}
                >
                  Abhi koi payment nahi hui
                </p>
              )}
              {(record.payments || []).map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid var(--border-color)",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CalendarDays size={11} />{" "}
                    {p.date
                      ? new Date(p.date).toLocaleDateString("en-IN")
                      : "—"}
                  </span>
                  <strong style={{ color: "#16a34a" }}>
                    +₹{Number(p.amount).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}

              <AnimatePresence>
                {formOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{ display: "flex", gap: 8, marginTop: 10 }}
                  >
                    <input
                      type="number"
                      placeholder="Amount ₹"
                      value={amt}
                      onChange={(e) => setAmt(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                      }}
                    />
                    <button
                      onClick={handleSave}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "#16a34a",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <Check size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setFormOpen(!formOpen)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "7px",
                  borderRadius: 8,
                  border: "1px dashed var(--border-color)",
                  background: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                {formOpen ? (
                  <>
                    <X size={12} /> Cancel
                  </>
                ) : (
                  <>
                    <Plus size={12} /> Paise Jama Karo
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Bill Payment Section ────────────────────────────────────────────────────
function BillPaymentSection({ bill }) {
  const addPayment = useStore((s) => s.addPayment);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [amt, setAmt] = useState("");

  const handleSave = () => {
    if (!amt) return;
    addPayment(bill.id, Number(amt));
    setAmt("");
    setFormOpen(false);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-page)",
          border: "1px solid var(--border-color)",
          borderRadius: 10,
          padding: "8px 12px",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontSize: 13,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Banknote size={13} /> Payment History (
          {(bill.paymentHistory || []).length})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: "#dcfce7",
              color: "#166534",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Paid: ₹{Number(bill.paidAmount || 0).toLocaleString("en-IN")}
          </span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                border: "1px solid var(--border-color)",
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                padding: "10px 12px",
                background: "var(--bg-page)",
              }}
            >
              {(bill.paymentHistory || []).length === 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    margin: "8px 0",
                  }}
                >
                  Koi payment nahi hui abhi
                </p>
              )}
              {(bill.paymentHistory || []).map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid var(--border-color)",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CalendarDays size={11} />{" "}
                    {p.date
                      ? new Date(p.date).toLocaleDateString("en-IN")
                      : "—"}
                    {p.note && (
                      <span style={{ fontSize: 11 }}> · {p.note}</span>
                    )}
                  </span>
                  <strong style={{ color: "#16a34a" }}>
                    +₹{Number(p.amount).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}

              <AnimatePresence>
                {formOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{ display: "flex", gap: 8, marginTop: 10 }}
                  >
                    <input
                      type="number"
                      placeholder="Amount ₹"
                      value={amt}
                      onChange={(e) => setAmt(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                      }}
                    />
                    <button
                      onClick={handleSave}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "#16a34a",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <Check size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setFormOpen(!formOpen)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "7px",
                  borderRadius: 8,
                  border: "1px dashed var(--border-color)",
                  background: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                {formOpen ? (
                  <>
                    <X size={12} /> Cancel
                  </>
                ) : (
                  <>
                    <Plus size={12} /> Payment Add Karo
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CustomerDetails() {
  const { id } = useParams(); // id = mobile number
  const navigate = useNavigate();
  const bills = useStore((s) => s.bills);
  const girvi = useStore((s) => s.girvi);

  // Mobile se match karo (id = mobile number)
  const customerBills = bills.filter((b) => b.customer?.mobile === id);
  const customerGirvi = girvi.filter((g) => g.mobile === id);

  // Name + village pehle bill/girvi se uthao
  const name =
    customerBills[0]?.customer?.name || customerGirvi[0]?.name || "Customer";
  const village =
    customerBills[0]?.customer?.village || customerGirvi[0]?.village || "";
  const mobile = id;

  // ── SUMMARY CALCULATIONS ─────────────────────────────────────────────────
  const totalBillAmount = customerBills.reduce(
    (s, b) => s + Number(b.total || 0),
    0,
  );
  const totalBillPaid = customerBills.reduce(
    (s, b) => s + Number(b.paidAmount || 0),
    0,
  );
  const totalBillPending = customerBills.reduce(
    (s, b) => s + Number(b.remaining || 0),
    0,
  );

  const totalGirviAmount = customerGirvi.reduce(
    (s, g) => s + Number(g.amount || 0),
    0,
  );
  const totalGirviInterest = customerGirvi.reduce(
    (s, g) => s + calcInterest(g),
    0,
  );
  const totalGirviPaid = customerGirvi.reduce((s, g) => s + totalPaid(g), 0);
  const totalGirviPending = customerGirvi.reduce((s, g) => s + remaining(g), 0);

  const grandPending = totalBillPending + totalGirviPending;

  // Not found
  if (customerBills.length === 0 && customerGirvi.length === 0) {
    return (
      <div className="page" style={{ padding: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <p>Koi record nahi mila.</p>
      </div>
    );
  }

  return (
    <div className="page customer-page" style={{ paddingBottom: 90 }}>
      {/* ── BACK BUTTON ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
          fontSize: 13,
          padding: 0,
        }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* ── PROFILE HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          border: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "var(--accent-color, #7F77DD)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{name}</h2>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 5,
                flexWrap: "wrap",
              }}
            >
              {village && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <MapPin size={11} /> {village}
                </span>
              )}
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Phone size={11} /> {mobile}
              </span>
            </div>
          </div>
        </div>

        {/* Grand Pending */}
        {grandPending > 0 && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "#fef2f2",
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "#991b1b" }}>
              ⚠️ Total Baaki
            </span>
            <strong style={{ fontSize: 17, color: "#dc2626" }}>
              ₹{grandPending.toLocaleString("en-IN")}
            </strong>
          </div>
        )}
      </motion.div>

      {/* ── SUMMARY STATS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Bills Total",
            value: totalBillAmount,
            icon: <Receipt size={14} />,
            color: "#3b82f6",
          },
          {
            label: "Bill Paid",
            value: totalBillPaid,
            icon: <Check size={14} />,
            color: "#16a34a",
          },
          {
            label: "Girvi Total",
            value: totalGirviAmount,
            icon: <Lock size={14} />,
            color: "#7c3aed",
          },
          {
            label: "Girvi Interest",
            value: totalGirviInterest,
            icon: <IndianRupee size={14} />,
            color: "#d97706",
          },
          {
            label: "Girvi Paid",
            value: totalGirviPaid,
            icon: <Banknote size={14} />,
            color: "#16a34a",
          },
          {
            label: "Girvi Baaki",
            value: totalGirviPending,
            icon: <CreditCard size={14} />,
            color: "#dc2626",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: "var(--bg-card)",
              borderRadius: 12,
              padding: "12px 14px",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: stat.color,
                marginBottom: 4,
              }}
            >
              {stat.icon}
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {stat.label}
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>
              ₹{stat.value.toLocaleString("en-IN")}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── GIRVI RECORDS ── */}
      {customerGirvi.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Lock size={15} style={{ color: "#7c3aed" }} />
            Girvi Records ({customerGirvi.length})
          </h3>

          {customerGirvi.map((record, i) => {
            const interest = calcInterest(record);
            const paid = totalPaid(record);
            const rem = remaining(record);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  background: "var(--bg-card)",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 12,
                  border: "1px solid var(--border-color)",
                }}
              >
                {/* Item name + amount */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Package size={13} style={{ color: "#7c3aed" }} />
                      {record.item || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        marginTop: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <CalendarDays size={10} /> {record.date || "—"}
                      {record.interest && (
                        <span> · {record.interest}%/month</span>
                      )}
                    </div>
                    {record.notes && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          marginTop: 3,
                        }}
                      >
                        📝 {record.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#7c3aed",
                      }}
                    >
                      ₹{Number(record.amount).toLocaleString("en-IN")}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--text-secondary)" }}
                    >
                      Principal
                    </div>
                  </div>
                </div>

                {/* Interest summary */}
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    { label: "Byaaj", value: interest, color: "#d97706" },
                    { label: "Jama", value: paid, color: "#16a34a" },
                    { label: "Baaki", value: rem, color: "#dc2626" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: "var(--bg-page)",
                        borderRadius: 8,
                        padding: "8px 10px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{ fontSize: 11, color: "var(--text-secondary)" }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: s.color,
                          marginTop: 2,
                        }}
                      >
                        ₹{s.value.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total banta hai */}
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "var(--bg-page)",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: "var(--text-secondary)" }}
                  >
                    Total banta hai
                  </span>
                  <strong style={{ fontSize: 14 }}>
                    ₹
                    {(Number(record.amount) + interest).toLocaleString("en-IN")}
                  </strong>
                </div>

                {/* Payment section */}
                <GirviPaymentSection record={record} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── BILL RECORDS ── */}
      {customerBills.length > 0 && (
        <div>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Receipt size={15} style={{ color: "#3b82f6" }} />
            Bill Records ({customerBills.length})
          </h3>

          {customerBills.map((bill, i) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: "var(--bg-card)",
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                border: "1px solid var(--border-color)",
              }}
            >
              {/* Bill header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Receipt size={13} style={{ color: "#3b82f6" }} />
                    Bill #{String(bill.id).slice(-4)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CalendarDays size={10} />
                    {bill.customer?.date ||
                      (bill.createdAt
                        ? new Date(bill.createdAt).toLocaleDateString("en-IN")
                        : "—")}
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: bill.status === "paid" ? "#dcfce7" : "#fef9c3",
                    color: bill.status === "paid" ? "#166534" : "#854d0e",
                  }}
                >
                  {bill.status === "paid" ? "✓ Paid" : "Pending"}
                </span>
              </div>

              {/* Products */}
              {(bill.products || []).length > 0 && (
                <div
                  style={{
                    background: "var(--bg-page)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    marginBottom: 10,
                  }}
                >
                  {bill.products.map((p, pi) => {
                    const itemTotal =
                      (Number(p.weight) * Number(p.rate) + Number(p.making)) *
                      Number(p.qty || 1);
                    return (
                      <div
                        key={pi}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 0",
                          fontSize: 12,
                          borderBottom:
                            pi < bill.products.length - 1
                              ? "1px solid var(--border-color)"
                              : "none",
                        }}
                      >
                        <span style={{ color: "var(--text-primary)" }}>
                          {p.item || "Item"} {p.weight ? `· ${p.weight}g` : ""}{" "}
                          {p.qty > 1 ? `×${p.qty}` : ""}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          ₹{Math.round(itemTotal).toLocaleString("en-IN")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Amount summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  {
                    label: "Total",
                    value: Number(bill.total || 0),
                    color: "#3b82f6",
                  },
                  {
                    label: "Paid",
                    value: Number(bill.paidAmount || 0),
                    color: "#16a34a",
                  },
                  {
                    label: "Baaki",
                    value: Number(bill.remaining || 0),
                    color: "#dc2626",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "var(--bg-page)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{ fontSize: 11, color: "var(--text-secondary)" }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: s.color,
                        marginTop: 2,
                      }}
                    >
                      ₹{s.value.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment section */}
              <BillPaymentSection bill={bill} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
