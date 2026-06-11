/**
 * Girvi.js — FIXED VERSION
 *
 * CHANGES:
 * - FIX #5: addGirvi ab synchronous hai — seedha ID milti hai
 *   Pehle: const newId = await addGirvi(entry) → Firebase ka wait
 *   Ab:    const newId = addGirvi(entry)        → local se turant ID
 *
 * - Baaki sab same hai — sirf handleSave mein await hata diya addGirvi se
 */

import "./Girvi.css";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  CalendarDays,
  IndianRupee,
  Upload,
  User,
  Package,
  Search,
  X,
  Plus,
  MapPin,
  Phone,
  MessageCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Check,
  Banknote,
  Pencil,
  BadgeCheck,
  Trash2,
  Loader2,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Clock,
} from "lucide-react";
import "./Girvi.css";
import { useStore } from "../store/useStore";
import { compressImage } from "../utils/imageUtils";
import { saveImage, deleteImages, loadAllImages } from "../utils/imageDB";

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = [
  {
    banner: "#7F77DD",
    amount: "#534AB7",
    tagBg: "#EEEDFE",
    tagText: "#3C3489",
    avBg: "#EEEDFE",
    avText: "#3C3489",
  },
  {
    banner: "#1D9E75",
    amount: "#0F6E56",
    tagBg: "#E1F5EE",
    tagText: "#085041",
    avBg: "#E1F5EE",
    avText: "#085041",
  },
  {
    banner: "#D85A30",
    amount: "#993C1D",
    tagBg: "#FAECE7",
    tagText: "#712B13",
    avBg: "#FAECE7",
    avText: "#712B13",
  },
  {
    banner: "#378ADD",
    amount: "#185FA5",
    tagBg: "#E6F1FB",
    tagText: "#0C447C",
    avBg: "#E6F1FB",
    avText: "#0C447C",
  },
  {
    banner: "#D4537E",
    amount: "#993556",
    tagBg: "#FBEAF0",
    tagText: "#72243E",
    avBg: "#FBEAF0",
    avText: "#72243E",
  },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      className={`toast toast--${type}`}
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
    >
      {type === "success" && <CheckCircle2 size={16} />}
      {type === "loading" && <Loader2 size={16} className="spin" />}
      {message}
    </motion.div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onDone={() => removeToast(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
}

// ─── Custom Confirm Dialog ────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 20px",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              width: "100%",
              maxWidth: 340,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#fff0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} color="#c0392b" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>
                {title}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1.5px solid #e0e0e0",
                  background: "#fff",
                  color: "#555",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: "#c0392b",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Haan, Delete Karo
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

function safeNum(val) {
  const n = Number(String(val).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function calcInterest(record) {
  if (!record.date || !record.interest || !record.amount) return 0;
  const start = new Date(record.date);
  start.setHours(0, 0, 0, 0);
  const principal = safeNum(record.amount);
  const rate = safeNum(record.interest);
  if (rate === 0) return 0;
  const payments = record.payments || [];
  const paid = payments.reduce((s, p) => s + safeNum(p.amount), 0);
  let endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  if (paid > 0 && payments.length > 0) {
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    const lastPayDate = new Date(sortedPayments[0].date);
    lastPayDate.setHours(0, 0, 0, 0);
    const daysToLastPay = Math.max(
      0,
      Math.floor((lastPayDate - start) / 86400000),
    );
    const fullMonthsToLastPay = Math.floor(daysToLastPay / 30);
    const billableMonthsToLastPay =
      fullMonthsToLastPay === 0 ? 1 : fullMonthsToLastPay;
    const remDaysToLastPay = daysToLastPay % 30;
    const interestToLastPay =
      daysToLastPay === 0
        ? 0
        : Math.round((principal * rate * billableMonthsToLastPay) / 100) +
          (fullMonthsToLastPay === 0
            ? 0
            : Math.round(((principal * rate) / 100 / 30) * remDaysToLastPay));
    const remainingAtLastPay = Math.max(
      0,
      principal + interestToLastPay - paid,
    );
    if (remainingAtLastPay === 0) endDate = lastPayDate;
  }
  const days = Math.max(0, Math.floor((endDate - start) / 86400000));
  if (days === 0) return 0;
  const fullMonths = Math.floor(days / 30);
  const remainingDays = days % 30;
  const billableMonths = fullMonths === 0 ? 1 : fullMonths;
  const monthlyByaaj = Math.round((principal * rate * billableMonths) / 100);
  const dailyRate = (principal * rate) / 100 / 30;
  const extraDaysInterest =
    fullMonths === 0 ? 0 : Math.round(dailyRate * remainingDays);
  return monthlyByaaj + extraDaysInterest;
}

function totalPaid(record) {
  return (record.payments || []).reduce((s, p) => s + safeNum(p.amount), 0);
}

function remaining(record) {
  return Math.max(
    0,
    safeNum(record.amount) + calcInterest(record) - totalPaid(record),
  );
}

function monthlyInterest(record) {
  return Math.round((safeNum(record.amount) * safeNum(record.interest)) / 100);
}

function buildInitials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(String(mobile).trim());
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now - start) / 86400000));
}

function buildWAMessage(record) {
  const interest = calcInterest(record);
  const paid = totalPaid(record);
  const rem = remaining(record);
  const totalBantaHai = safeNum(record.amount) + interest;
  const paymentsText =
    (record.payments || []).length > 0
      ? "\n💰 *जमा राशि का विवरण:*\n" +
        record.payments
          .map(
            (p, i) =>
              `  ${i + 1}. ₹${safeNum(p.amount).toLocaleString("hi-IN")} — ${p.date}`,
          )
          .join("\n") +
        "\n━━━━━━━━━━━━━━━━━━━━"
      : "";
  return `🙏 *कृष्ण गोपाल ज्वेलर्स*\n\n ${record.name} जी,\nसादर नमस्कार!\n\nयहाँ आपके गिरवी (अमानत) खाते का विवरण दिया गया है:\n\n━━━━━━━━━━━━━━━━━━━━\n👤 *नाम:* ${record.name}\n📱 *मोबाइल:* ${record.mobile}${record.village ? `\n📍 *पता:* ${record.village}` : ""}\n━━━━━━━━━━━━━━━━━━━━\n\n🪙 *गिरवी रखा सामान:* ${record.item || "—"}\n📅 *तारीख:* ${record.date || "—"}\n💵 *मूल राशि (उधार):* ₹${safeNum(record.amount).toLocaleString("hi-IN")}\n📈 *ब्याज दर:* ${record.interest}% प्रति माह\n\n━━━━━━━━━━━━━━━━━━━━\n💸 *आज तक का ब्याज:* ₹${interest.toLocaleString("hi-IN")}\n✅ *कुल राशि (मूल + ब्याज):* ₹${totalBantaHai.toLocaleString("hi-IN")}\n━━━━━━━━━━━━━━━━━━━━${paymentsText}\n\n💳 *अब तक कुल जमा:* ₹${paid.toLocaleString("hi-IN")}\n🔴 *शेष (बाकी) राशि:* ₹${rem.toLocaleString("hi-IN")}\n\n${record.notes ? `📝 *अन्य जानकारी:* ${record.notes}\n\n` : ""}हम पर अपना विश्वास बनाए रखने के लिए आपका बहुत-बहुत धन्यवाद।\n\n🙏 *आपका दिन शुभ हो!*\n— *कृष्ण गोपाल ज्वेलर्स*`;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className="lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.img
            src={src}
            alt="Preview"
            className="lightbox-img"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-close" onClick={onClose}>
            <X size={20} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Upload Box ───────────────────────────────────────────────────────────────
function UploadBox({ label, icon: Icon, image, onChange, uploading }) {
  return (
    <div className="upload-section">
      <div className="upload-label">
        <Icon size={13} />
        {label}
      </div>
      <label className="upload-box">
        {uploading ? (
          <div className="upload-placeholder upload-loading">
            <Loader2 size={22} className="spin" />
            <span>Compress ho raha hai...</span>
          </div>
        ) : image ? (
          <img src={image} alt={label} className="upload-preview" />
        ) : (
          <div className="upload-placeholder">
            <Upload size={20} />
            <span>Upload karo (auto compress)</span>
          </div>
        )}
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={onChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

// ─── Entry Modal ──────────────────────────────────────────────────────────────
function EntryModal({ open, onClose, onSave }) {
  const emptyForm = {
    name: "",
    village: "",
    mobile: "",
    amount: "",
    interest: "",
    date: today(),
    item: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [custImg, setCustImg] = useState(null);
  const [itemImg, setItemImg] = useState(null);
  const [custUploading, setCustUploading] = useState(false);
  const [itemUploading, setItemUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setCustImg(null);
      setItemImg(null);
      setErrors({});
    }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleImg = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "customer") setCustUploading(true);
    else setItemUploading(true);
    try {
      const compressed = await compressImage(file);
      if (type === "customer") {
        setCustImg(compressed);
        setCustUploading(false);
      } else {
        setItemImg(compressed);
        setItemUploading(false);
      }
    } catch {
      if (type === "customer") setCustUploading(false);
      else setItemUploading(false);
      alert("Image process nahi ho paya, dobara try karo.");
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Naam required hai";
    if (!form.amount.trim() || safeNum(form.amount) <= 0)
      errs.amount = "Valid amount daalo";
    if (!form.interest.trim() || safeNum(form.interest) <= 0)
      errs.interest = "Byaaj % required hai";
    if (form.mobile && !isValidMobile(form.mobile))
      errs.mobile = "10 digit valid mobile daalo";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, payments: [] }, custImg, itemImg);
    } finally {
      setSaving(false);
    }
  };

  const formFields = [
    {
      label: "Naam *",
      name: "name",
      placeholder: "Customer ka naam",
      type: "text",
    },
    {
      label: "Village / Gaon",
      name: "village",
      placeholder: "Village",
      type: "text",
    },
    {
      label: "Mobile",
      name: "mobile",
      placeholder: "10 digit mobile",
      type: "tel",
    },
    { label: "Date", name: "date", placeholder: "", type: "date" },
    {
      label: "Amount (₹) *",
      name: "amount",
      placeholder: "Girvi amount",
      type: "number",
    },
    {
      label: "Byaaj % (monthly) *",
      name: "interest",
      placeholder: "e.g. 2",
      type: "number",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Naya Girvi Entry</h3>
              <button className="modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            <div className="form-grid">
              {formFields.map(({ label, name, placeholder, type }) => (
                <div className="field" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    style={errors[name] ? { borderColor: "#e74c3c" } : {}}
                  />
                  {errors[name] && (
                    <div
                      style={{ fontSize: 11, color: "#e74c3c", marginTop: 3 }}
                    >
                      {errors[name]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="field">
              <label>Girvi Item</label>
              <textarea
                rows={2}
                name="item"
                placeholder="Item ka description..."
                value={form.item}
                onChange={handleChange}
              />
            </div>
            <div className="upload-row">
              <UploadBox
                label="Customer Photo"
                icon={User}
                image={custImg}
                onChange={(e) => handleImg(e, "customer")}
                uploading={custUploading}
              />
              <UploadBox
                label="Item Photo"
                icon={Package}
                image={itemImg}
                onChange={(e) => handleImg(e, "item")}
                uploading={itemUploading}
              />
            </div>
            <p className="img-hint">
              📸 Photos automatically compress ho jaati hain (~300KB)
            </p>
            <div className="field">
              <label>Notes</label>
              <textarea
                rows={2}
                name="notes"
                placeholder="Extra notes..."
                value={form.notes}
                onChange={handleChange}
              />
            </div>
            <div className="modal-actions">
              <motion.button
                className="btn-save"
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={saving || custUploading || itemUploading}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={15} /> Save Entry
                  </>
                )}
              </motion.button>
              <button
                className="btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ open, onClose, onSave, record, images }) {
  const [form, setForm] = useState(record || {});
  const [custImg, setCustImg] = useState(undefined);
  const [itemImg, setItemImg] = useState(undefined);
  const [custUploading, setCustUploading] = useState(false);
  const [itemUploading, setItemUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (record && open) {
      setForm(record);
      setCustImg(undefined);
      setItemImg(undefined);
      setErrors({});
    }
  }, [record, open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleImg = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "customer") setCustUploading(true);
    else setItemUploading(true);
    try {
      const compressed = await compressImage(file);
      if (type === "customer") {
        setCustImg(compressed);
        setCustUploading(false);
      } else {
        setItemImg(compressed);
        setItemUploading(false);
      }
    } catch {
      if (type === "customer") setCustUploading(false);
      else setItemUploading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Naam required hai";
    if (!form.amount?.toString().trim() || safeNum(form.amount) <= 0)
      errs.amount = "Valid amount daalo";
    if (!form.interest?.toString().trim() || safeNum(form.interest) <= 0)
      errs.interest = "Byaaj % required hai";
    if (form.mobile && !isValidMobile(form.mobile))
      errs.mobile = "10 digit valid mobile daalo";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onSave(form, custImg, itemImg);
    } finally {
      setSaving(false);
    }
  };

  const custPreview =
    custImg !== undefined ? custImg : images?.customer || null;
  const itemPreview = itemImg !== undefined ? itemImg : images?.item || null;

  const formFields = [
    {
      label: "Naam *",
      name: "name",
      placeholder: "Customer ka naam",
      type: "text",
    },
    {
      label: "Village / Gaon",
      name: "village",
      placeholder: "Village",
      type: "text",
    },
    {
      label: "Mobile",
      name: "mobile",
      placeholder: "10 digit mobile",
      type: "tel",
    },
    { label: "Date", name: "date", placeholder: "", type: "date" },
    {
      label: "Amount (₹) *",
      name: "amount",
      placeholder: "Girvi amount",
      type: "number",
    },
    {
      label: "Byaaj % (monthly) *",
      name: "interest",
      placeholder: "e.g. 2",
      type: "number",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Entry Edit Karo</h3>
              <button className="modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            <div className="form-grid">
              {formFields.map(({ label, name, placeholder, type }) => (
                <div className="field" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={form[name] || ""}
                    onChange={handleChange}
                    style={errors[name] ? { borderColor: "#e74c3c" } : {}}
                  />
                  {errors[name] && (
                    <div
                      style={{ fontSize: 11, color: "#e74c3c", marginTop: 3 }}
                    >
                      {errors[name]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="field">
              <label>Girvi Item</label>
              <textarea
                rows={2}
                name="item"
                placeholder="Item ka description..."
                value={form.item || ""}
                onChange={handleChange}
              />
            </div>
            <div className="upload-row">
              <UploadBox
                label="Customer Photo"
                icon={User}
                image={custPreview}
                onChange={(e) => handleImg(e, "customer")}
                uploading={custUploading}
              />
              <UploadBox
                label="Item Photo"
                icon={Package}
                image={itemPreview}
                onChange={(e) => handleImg(e, "item")}
                uploading={itemUploading}
              />
            </div>
            <p className="img-hint">
              📸 Photos automatically compress ho jaati hain
            </p>
            <div className="field">
              <label>Notes</label>
              <textarea
                rows={2}
                name="notes"
                placeholder="Extra notes..."
                value={form.notes || ""}
                onChange={handleChange}
              />
            </div>
            <div className="modal-actions">
              <motion.button
                className="btn-save"
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={saving || custUploading || itemUploading}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={15} /> Save Changes
                  </>
                )}
              </motion.button>
              <button
                className="btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Payment Section ──────────────────────────────────────────────────────────
function PaymentSection({ record, onAddPayment, onDeletePayment }) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [amt, setAmt] = useState("");
  const [date, setDate] = useState(today());
  const [deleteIdx, setDeleteIdx] = useState(null);
  const isCleared = remaining(record) === 0 && totalPaid(record) > 0;

  const isDuplicate = (amount, payDate) =>
    (record.payments || []).some(
      (p) => safeNum(p.amount) === safeNum(amount) && p.date === payDate,
    );

  const handleSave = () => {
    if (!amt || safeNum(amt) <= 0) return;
    if (isDuplicate(amt, date)) {
      alert(
        `⚠️ Ye payment already exist karti hai!\n₹${safeNum(amt).toLocaleString()} — ${date}`,
      );
      return;
    }
    onAddPayment(record.id, safeNum(amt), date);
    setAmt("");
    setDate(today());
    setFormOpen(false);
  };

  const paid = totalPaid(record);

  return (
    <>
      <ConfirmDialog
        open={deleteIdx !== null}
        title="Payment Delete Karo?"
        message={
          deleteIdx !== null
            ? `₹${safeNum((record.payments || [])[deleteIdx]?.amount).toLocaleString()} ki payment delete hogi.`
            : ""
        }
        onConfirm={() => {
          onDeletePayment(record.id, deleteIdx);
          setDeleteIdx(null);
        }}
        onCancel={() => setDeleteIdx(null)}
      />
      <div className="payment-section">
        <button className="payment-toggle" onClick={() => setOpen(!open)}>
          <span className="payment-toggle-left">
            <Banknote size={14} />
            Jama History ({(record.payments || []).length})
          </span>
          <span className="payment-toggle-right">
            <span className="paid-badge">Jama: ₹{paid.toLocaleString()}</span>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="payment-list-wrap"
            >
              <div className="payment-list">
                {(record.payments || []).length === 0 && (
                  <div className="no-payments">Abhi koi payment nahi hui</div>
                )}
                {(record.payments || []).map((p, i) => (
                  <motion.div
                    key={i}
                    className="payment-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span className="payment-date">
                      <CalendarDays size={12} />
                      {p.date}
                    </span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="payment-amount">
                        +₹{safeNum(p.amount).toLocaleString()}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteIdx(i)}
                        style={{
                          background: "rgba(192,57,43,0.08)",
                          border: "none",
                          borderRadius: 6,
                          padding: "3px 6px",
                          cursor: "pointer",
                          color: "#c0392b",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={11} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
                <AnimatePresence>
                  {formOpen && (
                    <motion.div
                      className="payment-form"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <input
                        type="number"
                        placeholder="Amount ₹"
                        value={amt}
                        onChange={(e) => setAmt(e.target.value)}
                        className="pay-input"
                      />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pay-input pay-date"
                      />
                      <motion.button
                        className="pay-save-btn"
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                      >
                        <Check size={14} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isCleared && (
                  <button
                    className="add-payment-btn"
                    onClick={() => setFormOpen(!formOpen)}
                  >
                    {formOpen ? (
                      <>
                        <X size={13} />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        Paise Jama Karo
                      </>
                    )}
                  </button>
                )}
                {isCleared && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      color: "#16a34a",
                      padding: "6px 0",
                      fontWeight: 600,
                    }}
                  >
                    ✓ Poora Hisaab Clear Ho Gaya
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ─── Overdue Badge ─────────────────────────────────────────────────────────────
function OverdueBadge({ days }) {
  if (days < 90) return null;
  const months = Math.floor(days / 30);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#fff0f0",
        color: "#c0392b",
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        border: "1px solid rgba(192,57,43,0.2)",
        marginTop: 4,
      }}
    >
      <Clock size={9} />
      {months} mahine se pending
    </motion.div>
  );
}

// ─── Cleared Stamp ────────────────────────────────────────────────────────────
function ClearedStamp() {
  return (
    <motion.div
      className="cleared-stamp"
      initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
    >
      <BadgeCheck size={13} strokeWidth={2.5} />
      CLEARED
    </motion.div>
  );
}

// ─── Record Card ──────────────────────────────────────────────────────────────
function RecordCard({
  record,
  index,
  onAddPayment,
  onDeletePayment,
  onLightbox,
  onEdit,
  onDelete,
  images,
}) {
  const c = COLORS[index % COLORS.length];
  const initials = buildInitials(record.name);
  const interest = calcInterest(record);
  const paid = totalPaid(record);
  const rem = remaining(record);
  const moInterest = monthlyInterest(record);
  const isCleared = rem === 0 && paid > 0;
  const days = daysSince(record.date);
  const custImg = images?.customer || null;
  const itemImg = images?.item || null;
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleWA = () => {
    if (!record.mobile) {
      alert("Mobile number nahi hai!");
      return;
    }
    if (!isValidMobile(record.mobile)) {
      alert("Mobile number galat hai!");
      return;
    }
    window.open(
      `https://wa.me/91${record.mobile}?text=${encodeURIComponent(buildWAMessage(record))}`,
      "_blank",
    );
  };

  const handleWapasi = () => {
    if (!record.mobile || !isValidMobile(record.mobile)) {
      alert("Valid mobile number nahi hai!");
      return;
    }
    const msg = `🏪 *कृष्ण गोपाल ज्वेलर्स*\n\nनमस्ते *${record.name}* जी! 🙏\n\nआपका जो सामान हमारे पास रखा था, वो आज *वापस कर दिया गया है।* ✅\n\n━━━━━━━━━━━━━━━━━━━━\n🪙 *सामान:* ${record.item || "—"}\n📅 *रखा था:* ${record.date || "—"}\n📅 *वापस किया:* ${new Date().toLocaleDateString("en-IN")}\n━━━━━━━━━━━━━━━━━━━━\n\nधन्यवाद! 🙏\n— *कृष्ण गोपाल ज्वेलर्स*`;
    window.open(
      `https://wa.me/91${record.mobile}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <>
      <ConfirmDialog
        open={confirmDelete}
        title="Entry Delete Karo?"
        message="Ye girvi entry aur uski sari photos permanently delete ho jaayengi."
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(record.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
      <motion.div
        className={`rec-card${isCleared ? " rec-card--cleared" : ""}`}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 24,
          delay: index * 0.06,
        }}
        layout
      >
        {isCleared && <ClearedStamp />}
        <div
          className="rec-banner"
          style={{ background: isCleared ? "#16a34a" : c.banner }}
        />
        <div className="rec-body">
          <div className="rec-top">
            {custImg ? (
              <img
                src={custImg}
                className="rec-avatar"
                alt="Customer"
                onClick={() => onLightbox(custImg)}
              />
            ) : (
              <div
                className="rec-avatar-fallback"
                style={
                  isCleared
                    ? { background: "#dcfce7", color: "#15803d" }
                    : { background: c.avBg, color: c.avText }
                }
              >
                {isCleared ? <BadgeCheck size={20} /> : initials}
              </div>
            )}
            <div className="rec-info">
              <div className="rec-name">{record.name}</div>
              <div className="rec-meta">
                <MapPin size={11} /> {record.village || "—"}
              </div>
              <div className="rec-meta">
                <Phone size={11} /> {record.mobile || "—"}
              </div>
              {!isCleared && <OverdueBadge days={days} />}
            </div>
            <div className="rec-amount-block">
              <div
                className="rec-amount"
                style={{ color: isCleared ? "#16a34a" : c.amount }}
              >
                ₹{safeNum(record.amount).toLocaleString()}
              </div>
              <div className="rec-rate">{record.interest}% / month</div>
              <motion.button
                className="edit-btn"
                whileTap={{ scale: 0.92 }}
                onClick={() => onEdit(record)}
              >
                <Pencil size={13} /> Edit
              </motion.button>
            </div>
          </div>
          <div className="rec-divider" />
          <div className="rec-item-row">
            {itemImg ? (
              <img
                src={itemImg}
                className="rec-item-img"
                alt="Item"
                onClick={() => onLightbox(itemImg)}
              />
            ) : (
              <div className="rec-item-fallback">
                <Package size={20} />
              </div>
            )}
            <div className="rec-item-details">
              <div className="rec-item-label">Girvi Item</div>
              <div className="rec-item-name">{record.item || "—"}</div>
              <div className="rec-notes">{record.notes || "No notes"}</div>
            </div>
          </div>
          <div className="tags-row">
            <span
              className="tag"
              style={
                isCleared
                  ? { background: "#dcfce7", color: "#15803d" }
                  : { background: c.tagBg, color: c.tagText }
              }
            >
              <CalendarDays size={11} /> {record.date || "—"}
            </span>
            <span className="tag tag-green">
              <IndianRupee size={11} /> Byaaj/mo: ₹{moInterest.toLocaleString()}
            </span>
            <span
              className={`tag ${isCleared ? "tag-cleared-baaki" : "tag-coral"}`}
            >
              <CreditCard size={11} />
              {isCleared ? "✓ Poora Chukta" : `Baaki: ₹${rem.toLocaleString()}`}
            </span>
          </div>
          <div className="interest-summary">
            <div className="interest-row">
              <span className="is-label">Aaj tak byaaj</span>
              <span className="is-val">₹{interest.toLocaleString()}</span>
            </div>
            <div className="interest-row">
              <span className="is-label">Total banta hai</span>
              <span className="is-val is-total">
                ₹{(safeNum(record.amount) + interest).toLocaleString()}
              </span>
            </div>
            <div className="interest-row">
              <span className="is-label">Ab tak jama</span>
              <span className="is-val is-paid">₹{paid.toLocaleString()}</span>
            </div>
            <div className="interest-row">
              <span className={`is-label ${isCleared ? "" : "is-rem-label"}`}>
                Baaki bacha
              </span>
              <span className={`is-val ${isCleared ? "is-zero" : "is-rem"}`}>
                {isCleared ? "✓ ₹0" : `₹${rem.toLocaleString()}`}
              </span>
            </div>
          </div>
          <PaymentSection
            record={record}
            onAddPayment={onAddPayment}
            onDeletePayment={onDeletePayment}
          />
          <div className="action-btns-row">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setDetailOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: isCleared ? "#dcfce7" : "#EEEDFE",
                color: isCleared ? "#15803d" : "#3C3489",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Eye size={14} /> Detail
            </motion.button>
            <motion.button
              className="wa-btn"
              whileTap={{ scale: 0.96 }}
              onClick={handleWA}
            >
              <MessageCircle size={15} /> Statement bhejo
            </motion.button>
            {isCleared && (
              <motion.button
                className="wapasi-btn"
                whileTap={{ scale: 0.96 }}
                onClick={handleWapasi}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Check size={15} /> Wapasi Message
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setConfirmDelete(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: "rgba(192,57,43,0.1)",
                color: "#c0392b",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} /> Delete
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────
function SummaryBar({ records }) {
  const activeRecords = records.filter((r) => remaining(r) > 0);
  const clearedRecords = records.filter(
    (r) => remaining(r) === 0 && totalPaid(r) > 0,
  );
  const totalGirvi = activeRecords.reduce((s, r) => s + safeNum(r.amount), 0);
  const totalBaaki = activeRecords.reduce((s, r) => s + remaining(r), 0);
  const totalJama = activeRecords.reduce((s, r) => s + totalPaid(r), 0);
  const overdueCount = activeRecords.filter(
    (r) => daysSince(r.date) >= 90,
  ).length;
  const stats = [
    {
      label: "Active Records",
      value: activeRecords.length,
      sub:
        overdueCount > 0
          ? `${overdueCount} overdue`
          : clearedRecords.length > 0
            ? `${clearedRecords.length} cleared`
            : null,
      accent: false,
      subColor: overdueCount > 0 ? "#c0392b" : undefined,
    },
    {
      label: "Total Girvi",
      value: `₹${totalGirvi.toLocaleString()}`,
      sub: "Active only",
      accent: false,
    },
    {
      label: "Total Jama",
      value: `₹${totalJama.toLocaleString()}`,
      sub: null,
      accent: false,
    },
    {
      label: "Total Baaki",
      value: `₹${totalBaaki.toLocaleString()}`,
      sub: null,
      accent: true,
    },
  ];
  return (
    <div className="summary-bar">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className={`stat-card${s.accent ? " stat-card--accent" : ""}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <div className="stat-label">{s.label}</div>
          <div className="stat-val">{s.value}</div>
          {s.sub && (
            <div
              className="stat-sub"
              style={s.subColor ? { color: s.subColor, fontWeight: 600 } : {}}
            >
              {s.sub}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
function FilterTabs({ active, onChange, counts }) {
  const tabs = [
    { key: "all", label: `Sabhi (${counts.all})` },
    { key: "active", label: `Active (${counts.active})` },
    { key: "cleared", label: `Cleared (${counts.cleared})` },
    { key: "overdue", label: `Overdue (${counts.overdue})` },
  ];
  return (
    <div className="filter-tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`filter-tab${active === t.key ? " filter-tab--active" : ""}`}
          onClick={() => onChange(t.key)}
          style={
            t.key === "overdue" && counts.overdue > 0 && active !== t.key
              ? { color: "#c0392b", borderColor: "rgba(192,57,43,0.3)" }
              : {}
          }
        >
          {t.key === "cleared" && active === t.key && <BadgeCheck size={13} />}
          {t.key === "overdue" && counts.overdue > 0 && <Clock size={13} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Girvi() {
  // FIX #1 & #5: Ab ye sab synchronous local functions hain
  const addGirvi = useStore((state) => state.addGirvi);
  const updateGirvi = useStore((state) => state.updateGirvi);
  const deleteGirvi = useStore((state) => state.deleteGirvi);
  const girviRecords = useStore((state) => state.girvi);

  const records = Array.isArray(girviRecords)
    ? [...girviRecords].sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0),
      )
    : [];

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [imagesMap, setImagesMap] = useState({});
  const [imagesLoading, setImagesLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();
  const loadedIdsRef = useRef(new Set());

  useEffect(() => {
    if (records.length === 0) {
      setImagesLoading(false);
      return;
    }
    const allIds = records.map((r) => String(r.id));
    const newIds = allIds.filter((id) => !loadedIdsRef.current.has(id));
    if (newIds.length === 0) {
      setImagesLoading(false);
      return;
    }
    setImagesLoading(true);
    loadAllImages(allIds).then((map) => {
      setImagesMap(map);
      allIds.forEach((id) => loadedIdsRef.current.add(id));
      setImagesLoading(false);
    });
  }, [records.map((r) => String(r.id)).join(",")]);

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      (r.name || "").toLowerCase().includes(q) ||
      (r.mobile || "").includes(q) ||
      (r.village || "").toLowerCase().includes(q) ||
      (r.item || "").toLowerCase().includes(q);
    const rem = remaining(r);
    const isCleared = rem === 0 && totalPaid(r) > 0;
    const isOverdue = !isCleared && daysSince(r.date) >= 90;
    if (filter === "active") return matchSearch && !isCleared;
    if (filter === "cleared") return matchSearch && isCleared;
    if (filter === "overdue") return matchSearch && isOverdue;
    return matchSearch;
  });

  const counts = {
    all: records.length,
    active: records.filter((r) => !(remaining(r) === 0 && totalPaid(r) > 0))
      .length,
    cleared: records.filter((r) => remaining(r) === 0 && totalPaid(r) > 0)
      .length,
    overdue: records.filter(
      (r) =>
        !(remaining(r) === 0 && totalPaid(r) > 0) && daysSince(r.date) >= 90,
    ).length,
  };

  // ── FIX #5: addGirvi ab synchronous — no await, seedha ID milti hai ──
  const handleSave = async (entry, custImg, itemImg) => {
    // Seedha ID milti hai — no await, no fallback needed
    const newId = addGirvi(entry);
    const idStr = String(newId);

    const saves = [];
    if (custImg) saves.push(saveImage(idStr, "customer", custImg));
    if (itemImg) saves.push(saveImage(idStr, "item", itemImg));
    if (saves.length > 0) await Promise.all(saves);

    setImagesMap((prev) => ({
      ...prev,
      [idStr]: { customer: custImg || null, item: itemImg || null },
    }));
    loadedIdsRef.current.add(idStr);

    setModalOpen(false);
    addToast("✅ Entry save ho gayi! Photos bhi safe hain.", "success");
  };

  const handleEditSave = async (updatedRecord, custImg, itemImg) => {
    const { id, ...updates } = updatedRecord;
    updateGirvi(id, updates);
    const idStr = String(id);
    const saves = [];
    if (custImg !== undefined)
      saves.push(saveImage(idStr, "customer", custImg));
    if (itemImg !== undefined) saves.push(saveImage(idStr, "item", itemImg));
    if (saves.length > 0) await Promise.all(saves);
    setImagesMap((prev) => {
      const existing = prev[idStr] || {};
      return {
        ...prev,
        [idStr]: {
          customer: custImg !== undefined ? custImg : existing.customer,
          item: itemImg !== undefined ? itemImg : existing.item,
        },
      };
    });
    setEditModalOpen(false);
    setEditRecord(null);
    addToast("✅ Changes save ho gaye!", "success");
  };

  const handleAddPayment = (id, amount, date) => {
    const rec = records.find((r) => String(r.id) === String(id));
    if (!rec) return;
    const newPayments = [...(rec.payments || []), { amount, date }];
    updateGirvi(id, { payments: newPayments });
    addToast(`💰 ₹${amount.toLocaleString()} jama ho gaye!`, "success");
  };

  const handleDeletePayment = (recordId, paymentIndex) => {
    const rec = records.find((r) => String(r.id) === String(recordId));
    if (!rec) return;
    const newPayments = (rec.payments || []).filter(
      (_, i) => i !== paymentIndex,
    );
    updateGirvi(recordId, { payments: newPayments });
    addToast("🗑️ Payment delete ho gayi.", "success");
  };

  const handleDelete = async (id) => {
    await deleteImages(String(id));
    setImagesMap((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      return next;
    });
    loadedIdsRef.current.delete(String(id));
    deleteGirvi(id);
    addToast("🗑️ Entry delete ho gayi.", "success");
  };

  return (
    <div className="girvi-page">
      <div className="girvi-header">
        <div>
          <h2 className="girvi-title">Girvi Records</h2>
          <p className="girvi-subtitle">Customer ka poora hisaab</p>
        </div>
        <motion.button
          className="new-entry-btn"
          whileTap={{ scale: 0.93 }}
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} /> New Entry
        </motion.button>
      </div>

      <SummaryBar records={records} />

      <div className="search-wrap">
        <Search size={15} className="search-icon" />
        <input
          className="search-input"
          type="text"
          placeholder="Search by naam, mobile, village, item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")}>
            <X size={14} />
          </button>
        )}
      </div>

      <FilterTabs active={filter} onChange={setFilter} counts={counts} />

      <div className="records-list">
        {imagesLoading && records.length > 0 && (
          <div className="images-loading-bar">
            <Loader2 size={15} className="spin" /> Photos load ho rahi hain...
          </div>
        )}
        <AnimatePresence>
          {filteredRecords.length === 0 ? (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Package size={40} />
              <p>
                {filter === "overdue"
                  ? "Koi overdue record nahi hai 👍"
                  : "Koi record nahi mila"}
              </p>
            </motion.div>
          ) : (
            filteredRecords.map((record, i) => (
              <RecordCard
                key={record.id}
                record={record}
                index={i}
                onAddPayment={handleAddPayment}
                onDeletePayment={handleDeletePayment}
                onLightbox={setLightboxSrc}
                onEdit={(r) => {
                  setEditRecord(r);
                  setEditModalOpen(true);
                }}
                onDelete={handleDelete}
                images={imagesMap[String(record.id)]}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <EntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <EditModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditRecord(null);
        }}
        onSave={handleEditSave}
        record={editRecord}
        images={editRecord ? imagesMap[String(editRecord?.id)] : null}
      />
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
