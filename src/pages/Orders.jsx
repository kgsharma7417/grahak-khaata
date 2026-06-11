import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Search,
  MessageCircle,
  Check,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  IndianRupee,
  Package,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Banknote,
  Sparkles,
  ArrowRight,
  Bell,
  Crown,
} from "lucide-react";
import { useStore } from "../store/useStore";
import "./Orders.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

function buildInitials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_CONFIG = {
  pending: {
    label: "Kaam Chal Raha Hai",
    icon: Clock,
    color: "var(--gold)",
    bg: "rgba(184,134,11,0.12)",
    next: "ready",
  },
  ready: {
    label: "Taiyaar Hai",
    icon: CheckCircle2,
    color: "var(--gold-light)",
    bg: "rgba(26,127,193,0.12)",
    next: "delivered",
  },
  delivered: {
    label: "De Diya Gaya",
    icon: Truck,
    color: "var(--success)",
    bg: "rgba(45,122,79,0.12)",
    next: null,
  },
};

const NEXT_BTN_LABEL = {
  ready: "Taiyaar Kar Diya ✓",
  delivered: "Saman De Diya ✓",
};

// Accent colors — using CSS custom properties so they work in both themes
const ACCENT_VARS = [
  "var(--gold)",
  "var(--gold-light)",
  "#9b59b6",
  "var(--success)",
  "var(--danger)",
];

function buildWAMessage(order, type = "ready") {
  const paid = Number(order.advancePaid || 0);
  const remaining = Math.max(0, Number(order.totalAmount || 0) - paid);
  if (type === "ready") {
    return `✨ *कृष्ण गोपाल ज्वेलर्स*\n\nनमस्ते *${order.customerName}* जी! 🙏\n\nआपका ऑर्डर *तैयार हो गया है!* 🎉\n\n━━━━━━━━━━━━━━━━━━━━\n📦 *ऑर्डर:* ${order.description || "—"}\n📅 *डिलीवरी डेट:* ${order.deliveryDate || "—"}\n━━━━━━━━━━━━━━━━━━━━\n💵 *कुल राशि:* ₹${Number(order.totalAmount).toLocaleString("hi-IN")}\n✅ *जमा (Advance):* ₹${paid.toLocaleString("hi-IN")}\n🔴 *बाकी राशि:* ₹${remaining.toLocaleString("hi-IN")}\n━━━━━━━━━━━━━━━━━━━━\n\nकृपया जल्द से जल्द आकर अपना सामान ले जाएं। 🙏\n\n— *कृष्ण गोपाल ज्वेलर्स*`;
  }
  return `🔔 *कृष्ण गोपाल ज्वेलर्स — याद दिलाना*\n\nनमस्ते *${order.customerName}* जी! 🙏\n\nआपके ऑर्डर की *डिलीवरी डेट नज़दीक है।*\n\n━━━━━━━━━━━━━━━━━━━━\n📦 *ऑर्डर:* ${order.description || "—"}\n📅 *डिलीवरी डेट:* ${order.deliveryDate || "—"}\n💵 *बाकी राशि:* ₹${remaining.toLocaleString("hi-IN")}\n━━━━━━━━━━━━━━━━━━━━\n\nसमय पर आने का कष्ट करें। धन्यवाद! 🙏\n\n— *कृष्ण गोपाल ज्वेलर्स*`;
}

// ─── Order Modal ──────────────────────────────────────────────────────────────
function OrderModal({ open, onClose, onSave, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial || {
      customerName: "",
      mobile: "",
      village: "",
      description: "",
      totalAmount: "",
      advancePaid: "",
      deliveryDate: "",
      notes: "",
      priority: "normal",
    },
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const set = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const remaining = Math.max(
    0,
    Number(form.totalAmount || 0) - Number(form.advancePaid || 0),
  );

  const handleSave = () => {
    if (!form.customerName.trim() || !form.totalAmount) {
      alert("Naam aur total amount zaroori hai!");
      return;
    }
    onSave(form);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ord-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="ord-modal"
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className="ord-modal-header">
              <div className="ord-modal-title-group">
                <Crown size={18} className="ord-modal-crown" />
                <h3>{isEdit ? "Order Badlein" : "Create New Order"}</h3>
              </div>
              <button className="ord-modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="ord-section-label">👤 Customer Ki Jankari</div>
            <div className="ord-form-grid">
              {[
                {
                  label: "Customer Ka Naam *",
                  name: "customerName",
                  type: "text",
                  placeholder: "Poora naam likhein",
                },
                {
                  label: "Mobile Number",
                  name: "mobile",
                  type: "tel",
                  placeholder: "10 digit number",
                },
                {
                  label: "Gaon / Sheher",
                  name: "village",
                  type: "text",
                  placeholder: "Kahan se hain",
                },
              ].map(({ label, name, type, placeholder }) => (
                <div className="ord-field" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={form[name] || ""}
                    onChange={set}
                  />
                </div>
              ))}
            </div>

            <div className="ord-section-label">📦 Order Ki Jankari</div>
            <div className="ord-field">
              <label>Kya Banana Hai *</label>
              <textarea
                rows={2}
                name="description"
                placeholder="Jaise: Sone ki anguthi 18 carat, chandi ka payal..."
                value={form.description || ""}
                onChange={set}
              />
            </div>

            <div className="ord-form-grid">
              {[
                {
                  label: "Poora Paisa (₹) *",
                  name: "totalAmount",
                  type: "number",
                  placeholder: "Kul kitne ka",
                },
                {
                  label: "Pehle Diya (Advance ₹)",
                  name: "advancePaid",
                  type: "number",
                  placeholder: "Abhi kitna liya",
                },
                {
                  label: "Delivery Ki Tarikh",
                  name: "deliveryDate",
                  type: "date",
                },
              ].map(({ label, name, type, placeholder }) => (
                <div className="ord-field" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder || ""}
                    value={form[name] || ""}
                    onChange={set}
                  />
                </div>
              ))}
            </div>

            {Number(form.totalAmount) > 0 && (
              <motion.div
                className="ord-remaining-chip"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span>💰 Baaki Milega:</span>
                <strong>₹{remaining.toLocaleString("hi-IN")}</strong>
              </motion.div>
            )}

            <div className="ord-section-label">⚡ Kitna Zaroori Hai?</div>
            <div className="ord-priority-row">
              {[
                { val: "normal", label: "Koi Jaldi Nahi", emoji: "🟢" },
                { val: "urgent", label: "Jaldi Chahiye (Urgent)", emoji: "🔴" },
              ].map(({ val, label, emoji }) => (
                <button
                  key={val}
                  type="button"
                  className={`ord-priority-btn ${form.priority === val ? "ord-priority-btn--" + val : ""}`}
                  onClick={() => setForm((p) => ({ ...p, priority: val }))}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>

            <div className="ord-field" style={{ marginTop: 14 }}>
              <label>Extra Baat (Optional)</label>
              <textarea
                rows={2}
                name="notes"
                placeholder="Koi khas baat ya design..."
                value={form.notes || ""}
                onChange={set}
              />
            </div>

            <div className="ord-modal-actions">
              <motion.button
                className="ord-btn-save"
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
              >
                <Check size={15} /> {isEdit ? "Badlaav Bachao" : "Save Order "}
              </motion.button>
              <button className="ord-btn-cancel" onClick={onClose}>
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ open, onClose, order, onSave }) {
  const [amt, setAmt] = useState("");
  const remaining = order
    ? Math.max(
        0,
        Number(order.totalAmount || 0) - Number(order.advancePaid || 0),
      )
    : 0;

  const handleSave = () => {
    if (!amt || Number(amt) <= 0) return;
    onSave(Number(amt));
    setAmt("");
  };

  return (
    <AnimatePresence>
      {open && order && (
        <motion.div
          className="ord-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="ord-modal ord-modal--sm"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
          >
            <div className="ord-modal-header">
              <div className="ord-modal-title-group">
                <Banknote size={18} style={{ color: "var(--gold)" }} />
                <h3>Paisa Jama Karo</h3>
              </div>
              <button className="ord-modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="ord-pay-summary">
              <div className="ord-pay-row">
                <span>Poora Paisa</span>
                <strong>₹{Number(order.totalAmount).toLocaleString()}</strong>
              </div>
              <div className="ord-pay-row">
                <span>Ab Tak Aaya</span>
                <strong className="green">
                  ₹{Number(order.advancePaid).toLocaleString()}
                </strong>
              </div>
              <div className="ord-pay-row ord-pay-row--rem">
                <span>Abhi Baaki Hai</span>
                <strong className="red">₹{remaining.toLocaleString()}</strong>
              </div>
            </div>

            <div className="ord-field">
              <label>Kitna Paisa Aaya Aaj? (₹)</label>
              <input
                type="number"
                placeholder="Amount likhein"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                autoFocus
              />
            </div>

            <div className="ord-modal-actions">
              <motion.button
                className="ord-btn-save"
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
              >
                <Check size={15} /> Paisa Darz Karo
              </motion.button>
              <button className="ord-btn-cancel" onClick={onClose}>
                Wapas Jaao
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── WA Modal ─────────────────────────────────────────────────────────────────
function WAModal({ open, onClose, order }) {
  if (!order) return null;

  const send = (type) => {
    if (!order.mobile) {
      alert("Mobile number nahi hai!");
      return;
    }
    window.open(
      `https://wa.me/91${order.mobile}?text=${encodeURIComponent(buildWAMessage(order, type))}`,
      "_blank",
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ord-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="ord-modal ord-modal--sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
          >
            <div className="ord-modal-header">
              <div className="ord-modal-title-group">
                <MessageCircle size={18} style={{ color: "var(--ord-wa)" }} />
                <h3>WhatsApp Message</h3>
              </div>
              <button className="ord-modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <p className="ord-wa-subtitle">
              {order.customerName} ko kaun sa message bhejein?
            </p>

            <div className="ord-wa-btns">
              <motion.button
                className="ord-wa-option ord-wa-option--ready"
                whileTap={{ scale: 0.97 }}
                onClick={() => send("ready")}
              >
                <div className="ord-wa-icon">
                  <CheckCircle2 size={22} />
                </div>
                <div className="ord-wa-text">
                  <strong>Order Taiyaar Hai ✅</strong>
                  <span>Customer ko bulao — saman ready hai</span>
                </div>
                <ArrowRight size={16} className="ord-wa-arrow" />
              </motion.button>

              <motion.button
                className="ord-wa-option ord-wa-option--reminder"
                whileTap={{ scale: 0.97 }}
                onClick={() => send("reminder")}
              >
                <div className="ord-wa-icon">
                  <Bell size={22} />
                </div>
                <div className="ord-wa-text">
                  <strong>Delivery Yaad Dilao 🔔</strong>
                  <span>Date aur baaki payment yaad dilao</span>
                </div>
                <ArrowRight size={16} className="ord-wa-arrow" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({
  order,
  index,
  onEdit,
  onDelete,
  onStatusChange,
  onPayment,
  onWA,
}) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const initials = buildInitials(order.customerName);
  const paid = Number(order.advancePaid || 0);
  const total = Number(order.totalAmount || 0);
  const remaining = Math.max(0, total - paid);
  const isDelivered = order.status === "delivered";
  const isUrgent = order.priority === "urgent";
  const progressPct =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isOverdue =
    order.deliveryDate &&
    order.status !== "delivered" &&
    new Date(order.deliveryDate) < new Date(new Date().toDateString());

  // Use CSS var accent so it respects theme
  const accent = isDelivered
    ? "var(--success)"
    : ACCENT_VARS[index % ACCENT_VARS.length];
  // Avatar bg: 15% opacity version — we use a CSS variable trick via inline style
  const avatarBg = isDelivered ? "rgba(45,122,79,0.12)" : "var(--gold-pale)";
  const avatarColor = isDelivered
    ? "var(--success)"
    : ACCENT_VARS[index % ACCENT_VARS.length];

  return (
    <motion.div
      className={`ord-card${isDelivered ? " ord-card--delivered" : ""}${isUrgent && !isDelivered ? " ord-card--urgent" : ""}`}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
        delay: index * 0.05,
      }}
      layout
    >
      {/* Left accent bar */}
      <div className="ord-accent-bar" style={{ background: accent }} />

      <div className="ord-card-inner">
        {/* Urgent ribbon */}
        {isUrgent && !isDelivered && (
          <div className="ord-urgent-ribbon">
            <AlertCircle size={11} /> JALDI CHAHIYE
          </div>
        )}

        {/* ── Header row ── */}
        <div className="ord-card-header">
          <div
            className="ord-avatar"
            style={{ background: avatarBg, color: avatarColor }}
          >
            {isDelivered ? <Truck size={18} /> : initials}
          </div>

          <div className="ord-card-name-block">
            <div className="ord-customer-name">{order.customerName}</div>
            <div className="ord-customer-meta">
              {order.village && (
                <span>
                  <MapPin size={10} /> {order.village}
                </span>
              )}
              {order.mobile && (
                <span>
                  <Phone size={10} /> {order.mobile}
                </span>
              )}
            </div>
          </div>

          <div className="ord-card-amount-block">
            <div className="ord-amount-big">₹{total.toLocaleString()}</div>
            <div
              className="ord-status-pill"
              style={{ background: status.bg, color: status.color }}
            >
              <StatusIcon size={11} /> {status.label}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="ord-inner-divider" />

        {/* ── Description & Date ── */}
        <div className="ord-detail-row">
          <Package size={13} style={{ color: accent, flexShrink: 0 }} />
          <span className="ord-description">{order.description || "—"}</span>
        </div>

        {order.deliveryDate && (
          <div
            className={`ord-date-row${isOverdue ? " ord-date--overdue" : ""}`}
          >
            <CalendarDays
              size={13}
              style={{ color: isOverdue ? "var(--danger)" : accent }}
            />
            <span>
              Delivery: <strong>{order.deliveryDate}</strong>
            </span>
            {isOverdue && (
              <span className="ord-overdue-badge">⚠ Tarikh Nikal Gayi</span>
            )}
          </div>
        )}

        {/* ── Payment Progress ── */}
        <div className="ord-payment-block">
          <div className="ord-payment-meta">
            <span className="ord-pay-label">
              Advance Mila:{" "}
              <strong style={{ color: "var(--success)" }}>
                ₹{paid.toLocaleString()}
              </strong>
            </span>
            <span className="ord-pay-label">
              Baaki:{" "}
              <strong
                style={{
                  color: remaining > 0 ? "var(--danger)" : "var(--success)",
                }}
              >
                {remaining > 0
                  ? `₹${remaining.toLocaleString()}`
                  : "✓ Poora Mila"}
              </strong>
            </span>
          </div>
          <div className="ord-progress-track">
            <motion.div
              className="ord-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{
                duration: 0.9,
                ease: "easeOut",
                delay: index * 0.05 + 0.3,
              }}
              style={{
                background: progressPct === 100 ? "var(--success)" : accent,
              }}
            />
          </div>
          <div className="ord-progress-text">{progressPct}% paisa aa gaya</div>
        </div>

        {/* ── Notes ── */}
        {order.notes && (
          <>
            <button
              className="ord-notes-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              <span>📝 Extra Baat</span>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  className="ord-notes-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {order.notes}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── Actions ── */}
        <div className="ord-actions">
          {status.next && (
            <motion.button
              className="ord-btn-primary"
              whileTap={{ scale: 0.96 }}
              onClick={() => onStatusChange(order.id, status.next)}
              style={{ background: accent }}
            >
              {(() => {
                const N = STATUS_CONFIG[status.next].icon;
                return <N size={14} />;
              })()}
              {NEXT_BTN_LABEL[status.next]}
            </motion.button>
          )}

          {!isDelivered && remaining > 0 && (
            <motion.button
              className="ord-btn-secondary ord-btn--pay"
              whileTap={{ scale: 0.96 }}
              onClick={() => onPayment(order)}
            >
              <Banknote size={13} /> Paisa Jama Karo
            </motion.button>
          )}

          <motion.button
            className="ord-btn-secondary ord-btn--wa"
            whileTap={{ scale: 0.96 }}
            onClick={() => onWA(order)}
          >
            <MessageCircle size={13} /> WhatsApp
          </motion.button>

          <motion.button
            className="ord-btn-secondary ord-btn--edit"
            whileTap={{ scale: 0.96 }}
            onClick={() => onEdit(order)}
          >
            <Pencil size={13} /> Badlein
          </motion.button>

          <motion.button
            className="ord-btn-icon ord-btn--del"
            whileTap={{ scale: 0.96 }}
            onClick={() => onDelete(order.id)}
            title="Delete karo"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────
function SummaryBar({ orders }) {
  const active = orders.filter((o) => o.status !== "delivered");
  const totalValue = active.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalPending = active.reduce(
    (s, o) =>
      s + Math.max(0, Number(o.totalAmount || 0) - Number(o.advancePaid || 0)),
    0,
  );
  const urgent = active.filter((o) => o.priority === "urgent").length;

  const stats = [
    {
      label: "Chal Rahe Orders",
      value: active.length,
      sub:
        orders.length - active.length > 0
          ? `${orders.length - active.length} de diye`
          : null,
      accent: false,
    },
    {
      label: "Kul Kamai",
      value: `₹${totalValue.toLocaleString()}`,
      sub: "Active orders",
      accent: false,
    },
    {
      label: "Jaldi Chahiye",
      value: urgent,
      sub: "Urgent orders",
      accent: urgent > 0,
    },
    {
      label: "Baaki Milega",
      value: `₹${totalPending.toLocaleString()}`,
      sub: null,
      accent: true,
    },
  ];

  return (
    <div className="ord-summary">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className={`ord-stat${s.accent ? " ord-stat--accent" : ""}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <div className="ord-stat-label">{s.label}</div>
          <div className="ord-stat-val">{s.value}</div>
          {s.sub && <div className="ord-stat-sub">{s.sub}</div>}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
function FilterTabs({ active, onChange, counts }) {
  const tabs = [
    { key: "all", label: "Sabhi", count: counts.all },
    { key: "pending", label: "Chal Raha Hai", count: counts.pending },
    { key: "ready", label: "Taiyaar Hai", count: counts.ready },
    { key: "delivered", label: "De Diya Gaya", count: counts.delivered },
  ];
  return (
    <div className="ord-filter-tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`ord-filter-tab${active === t.key ? " active" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          <span className="ord-tab-count">{t.count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Orders() {
  const addOrder = useStore((s) => s.addOrder);
  const updateOrder = useStore((s) => s.updateOrder);
  const deleteOrder = useStore((s) => s.deleteOrder);
  const ordersRaw = useStore((s) => s.orders);
  const orders = Array.isArray(ordersRaw) ? ordersRaw : [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [payOrder, setPayOrder] = useState(null);
  const [waOrder, setWaOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const match =
      (o.customerName || "").toLowerCase().includes(q) ||
      (o.mobile || "").includes(q) ||
      (o.village || "").toLowerCase().includes(q) ||
      (o.description || "").toLowerCase().includes(q);
    if (filter !== "all" && o.status !== filter) return false;
    return match;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const handleSave = (form) => {
    if (editOrder) {
      const { id, ...updates } = { ...editOrder, ...form };
      updateOrder(id, updates);
      setEditOrder(null);
    } else {
      addOrder({ ...form, status: "pending" });
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Ye order hamesha ke liye delete ho jayega. Pakka?"))
      deleteOrder(id);
  };

  const handlePayment = (amt) => {
    if (!payOrder) return;
    const newPaid = Number(payOrder.advancePaid || 0) + amt;
    updateOrder(payOrder.id, { advancePaid: newPaid });
    setPayOrder(null);
  };

  return (
    <div className="ord-page">
      {/* Header */}
      <div className="ord-header">
        <div className="ord-header-text">
          <h2 className="ord-title">
            <Sparkles size={20} className="ord-title-icon" />
            Orders
          </h2>
          <p className="ord-subtitle">Customer ke saare orders ek jagah</p>
        </div>
        <motion.button
          className="ord-new-btn"
          whileTap={{ scale: 0.93 }}
          onClick={() => {
            setEditOrder(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} /> Naya Order
        </motion.button>
      </div>

      <SummaryBar orders={orders} />

      {/* Search */}
      <div className="ord-search-wrap">
        <Search size={15} className="ord-search-icon" />
        <input
          className="ord-search-input"
          type="text"
          placeholder="Naam, mobile, gaon ya order se dhundein..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="ord-search-clear" onClick={() => setSearch("")}>
            <X size={14} />
          </button>
        )}
      </div>

      <FilterTabs active={filter} onChange={setFilter} counts={counts} />

      {/* Cards */}
      <div className="ord-list">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              className="ord-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Package size={44} />
              <p>Koi order nahi mila</p>
              <span>Upar "Naya Order" dabao</span>
            </motion.div>
          ) : (
            filtered.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                index={i}
                onEdit={(o) => {
                  setEditOrder(o);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
                onStatusChange={(id, next) => updateOrder(id, { status: next })}
                onPayment={(o) => setPayOrder(o)}
                onWA={(o) => setWaOrder(o)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <OrderModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditOrder(null);
        }}
        onSave={handleSave}
        initial={editOrder}
      />
      <PaymentModal
        open={!!payOrder}
        onClose={() => setPayOrder(null)}
        order={payOrder}
        onSave={handlePayment}
      />
      <WAModal
        open={!!waOrder}
        onClose={() => setWaOrder(null)}
        order={waOrder}
      />
    </div>
  );
}
