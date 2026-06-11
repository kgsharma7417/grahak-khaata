import { motion } from "framer-motion";
import {
  Lock,
  Receipt,
  Users,
  BarChart2,
  Sun,
  Moon,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import "./Home.css";

const actions = [
  {
    icon: Lock,
    label: "Nayi Girvi",
    to: "/girvi",
    bg: "var(--action-gold-bg)",
    fg: "var(--action-gold-fg)",
  },
  {
    icon: Receipt,
    label: "Bill Banao",
    to: "/bills",
    bg: "var(--action-green-bg)",
    fg: "var(--action-green-fg)",
  },
  {
    icon: Users,
    label: "Customers",
    to: "/contacts",
    bg: "var(--action-blue-bg)",
    fg: "var(--action-blue-fg)",
  },
  {
    icon: BarChart2,
    label: "Reports",
    to: "/more",
    bg: "var(--action-red-bg)",
    fg: "var(--action-red-fg)",
  },
];

/* ── Relative time helper ─────────────────────────── */
function relativeTime(ts) {
  if (!ts) return "—";
  const diff = Date.now() - (ts?.seconds ? ts.seconds * 1000 : ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Abhi";
  if (m < 60) return `${m}m pehle`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h pehle`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} din pehle`;
  return new Date(ts?.seconds ? ts.seconds * 1000 : ts).toLocaleDateString(
    "en-IN",
  );
}

/* ── Real remaining for a bill ────────────────────── */
function calcRemaining(b) {
  const discount = Number(b.discount || 0);
  const initPaid = Number(b.paidAmount || 0);
  const histPaid = (b.paymentHistory || []).reduce(
    (s, p) => s + Number(p.amount || 0),
    0,
  );
  return Math.max(0, Number(b.total || 0) - discount - initPaid - histPaid);
}

export default function Home({ toggleTheme, theme }) {
  const navigate = useNavigate();

  const girvi = useStore((s) => s.girvi ?? []);
  const bills = useStore((s) => s.bills ?? []);
  const customers = useStore((s) => s.customers ?? []);

  /* ── Bug Fix #1&#2: Real stats ────────────────────── */
  const pendingBills = bills.filter((b) => calcRemaining(b) > 0);
  const pendingBillAmount = pendingBills.reduce(
    (sum, b) => sum + calcRemaining(b),
    0,
  );

  // todayReceived — aaj ke payments (paidAmount + paymentHistory today entries)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayReceived = bills.reduce((sum, b) => {
    // initial paidAmount — bill aaj create hua ho toh count karo
    const billTs = b.createdAt?.seconds
      ? b.createdAt.seconds * 1000
      : b.createdAt || 0;
    const initContrib =
      billTs >= todayStart.getTime() ? Number(b.paidAmount || 0) : 0;
    // paymentHistory — aaj ki entries
    const histContrib = (b.paymentHistory || [])
      .filter((p) => new Date(p.date).getTime() >= todayStart.getTime())
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return sum + initContrib + histContrib;
  }, 0);

  // Bug Fix #3: activeThisWeek — actually last 7 days mein bane customers
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeThisWeek = customers.filter((c) => {
    const ts = c.createdAt?.seconds
      ? c.createdAt.seconds * 1000
      : c.createdAt || 0;
    return ts >= weekAgo;
  }).length;

  const stats = {
    activeGirvi: girvi.length,
    totalGirviAmount: girvi.reduce((s, g) => s + Number(g.amount || 0), 0),
    pendingBillsCount: pendingBills.length,
    pendingBillAmount,
    todayReceived,
    todayTxCount: bills.filter((b) => {
      const ts = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : b.createdAt || 0;
      return ts >= todayStart.getTime();
    }).length,
    totalCustomers: customers.length,
    activeThisWeek,
  };

  /* ── Bug Fix #4: Real relative time in activity ─── */
  const activity = [
    ...girvi.map((g) => ({
      name: g.name || "Customer",
      type: "New Girvi",
      amt: `₹${Number(g.amount || 0).toLocaleString("en-IN")}`,
      dot: "gold",
      ts: g.createdAt,
    })),
    ...bills.map((b) => ({
      name: b.customer?.name || "Customer",
      type: "Bill Generate",
      amt: `₹${Number(b.total || 0).toLocaleString("en-IN")}`,
      dot: "green",
      ts: b.createdAt,
    })),
  ]
    .sort((a, b) => {
      const ta = a.ts?.seconds ? a.ts.seconds * 1000 : a.ts || 0;
      const tb = b.ts?.seconds ? b.ts.seconds * 1000 : b.ts || 0;
      return tb - ta;
    })
    .slice(0, 5)
    .map((a) => ({ ...a, time: relativeTime(a.ts) }));

  const today = new Date().toLocaleDateString("hi-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statCards = [
    {
      label: "Active Girvi",
      value: String(stats.activeGirvi),
      sub: `₹${stats.totalGirviAmount.toLocaleString("en-IN")} total`,
      color: "gold",
      icon: "🔒",
    },
    {
      label: "Pending Bills",
      value: String(stats.pendingBillsCount),
      sub: `₹${pendingBillAmount.toLocaleString("en-IN")} baki`,
      color: "red",
      icon: "📋",
    },
    {
      label: "Aaj Mila",
      value: `₹${stats.todayReceived.toLocaleString("en-IN")}`,
      sub: `${stats.todayTxCount} bills aaj`,
      color: "green",
      icon: "💰",
    },
    {
      label: "Customers",
      value: String(stats.totalCustomers),
      sub: `${stats.activeThisWeek} is hafte naye`,
      color: "",
      icon: "👥",
    },
  ];

  return (
    <div className="home-page">
      {/* ── Ambient glow ── */}
      <div className="home-glow home-glow-1" />
      <div className="home-glow home-glow-2" />

      {/* ── Header ── */}
      <motion.header
        className="home-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-brand">
          <span className="header-diamond">✦</span>
          <div>
            <h1 className="shop-name">Krishna Gopal Jewellers</h1>
            <p className="shop-date">{today}</p>
          </div>
        </div>
        <motion.button
          className="theme-toggle"
          onClick={toggleTheme}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.04 }}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </motion.button>
      </motion.header>

      {/* ── Greeting ── */}
      <motion.div
        className="greet-block"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
      >
        <p className="greet">Namaste, Ramesh ji 🙏</p>
        <span className="greet-badge">
          <TrendingUp size={11} /> Open for business
        </span>
      </motion.div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            className={`stat-card stat-card-${s.color || "default"}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.15 + i * 0.08,
              type: "spring",
              stiffness: 280,
              damping: 22,
            }}
          >
            <div className="stat-top">
              <span className="stat-emoji">{s.icon}</span>
              <p className="stat-label">{s.label}</p>
            </div>
            <p className={`stat-value ${s.color}`}>{s.value}</p>
            <p className="stat-sub">{s.sub}</p>
            <div className="stat-shine" />
          </motion.div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="section-header">
        <p className="section-title">Quick Actions</p>
      </div>
      <div className="actions-grid">
        {actions.map(({ icon: Icon, label, to, bg, fg }, i) => (
          <motion.button
            key={label}
            className="action-btn"
            onClick={() => navigate(to)}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.35 + i * 0.07,
              type: "spring",
              stiffness: 320,
              damping: 24,
            }}
            whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
            whileTap={{ scale: 0.94 }}
          >
            <span className="action-icon" style={{ background: bg }}>
              <Icon size={17} color={fg} />
            </span>
            <span className="action-label">{label}</span>
            <ArrowRight size={12} className="action-arrow" />
          </motion.button>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <div className="section-header">
        <p className="section-title">Recent Activity</p>
        {activity.length > 0 && (
          <span className="activity-count">{activity.length}</span>
        )}
      </div>
      <motion.div
        className="activity-list"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        {activity.length === 0 ? (
          <div className="activity-empty">
            <span className="activity-empty-icon">🪙</span>
            <p>Abhi koi activity nahi</p>
            <span>Bill ya girvi add karo</span>
          </div>
        ) : (
          activity.map((a, i) => (
            <motion.div
              key={i}
              className="act-row"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06 }}
            >
              <span className={`act-dot ${a.dot}`} />
              <div className="act-info">
                <p className="act-name">{a.name}</p>
                <p className="act-type">{a.type}</p>
              </div>
              <div className="act-right">
                <p className={`act-amt ${a.dot}`}>{a.amt}</p>
                <p className="act-time">{a.time}</p>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ── Footer tagline ── */}
      <motion.p
        className="home-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        ✦ Krishna Gopal Jewellers — Premium Billing System
      </motion.p>
    </div>
  );
}
