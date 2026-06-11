import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";

import { Loader2, Cloud } from "lucide-react";
import { syncAllData } from "../utils/syncManager";
import { auth } from "../firebase";
import {
  Download,
  Upload,
  Clock,
  FileJson,
  Table,
  Trash2,
  Store,
  User,
  MapPin,
  Phone,
  FileText,
  Camera,
  Check,
  Edit3,
  X,
  BookOpen,
  Wifi,
  WifiOff,
  CloudUpload,
  Smartphone,
} from "lucide-react";

import { useStore } from "../store/useStore";
import "./More.css";

/* ─────────────────────────────────────────────
   FIELD ROW
───────────────────────────────────────────── */

function FieldRow({
  icon: Icon,
  label,
  value,
  name,
  type = "text",
  placeholder,
  editing,
  onChange,
}) {
  return (
    <div className="field-row">
      <div className="field-icon">
        <Icon size={15} />
      </div>

      <div className="field-body">
        <span className="field-label">{label}</span>

        {editing ? (
          <input
            className="field-input"
            type={type}
            name={name}
            value={value || ""}
            placeholder={placeholder}
            onChange={onChange}
          />
        ) : (
          <span className="field-value">
            {value || <span className="field-empty">{placeholder}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function More() {
  const profile = useStore((s) => s.profile) || {};
  const updateProfile = useStore((s) => s.updateProfile);

  const bills = useStore((s) => s.bills);
  const girvi = useStore((s) => s.girvi);
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders ?? []);

  const restoreBackup = useStore((s) => s.restoreBackup);

  const removeDuplicates = useStore((s) => s.removeDuplicates);

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    shopName: profile.shopName || "",
    ownerName: profile.ownerName || "",
    address: profile.address || "",
    mobile: profile.mobile || "",
    gst: profile.gst || "",
    logo: profile.logo || "",
  });

  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [restoreMsg, setRestoreMsg] = useState(null);

  const logoRef = useRef(null);
  const importRef = useRef(null);

  /* ─────────────────────────────────────────────
     INPUT CHANGE
  ───────────────────────────────────────────── */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ─────────────────────────────────────────────
     LOGO UPLOAD
  ───────────────────────────────────────────── */

  const handleLogo = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        logo: ev.target.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  /* ─────────────────────────────────────────────
     SAVE PROFILE
  ───────────────────────────────────────────── */

  const handleSave = () => {
    updateProfile(form);

    setEditing(false);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /* ─────────────────────────────────────────────
     CANCEL EDIT
  ───────────────────────────────────────────── */

  const handleCancel = () => {
    setForm({
      shopName: profile.shopName || "",
      ownerName: profile.ownerName || "",
      address: profile.address || "",
      mobile: profile.mobile || "",
      gst: profile.gst || "",
      logo: profile.logo || "",
    });

    setEditing(false);
  };

  /* ─────────────────────────────────────────────
     TOAST
  ───────────────────────────────────────────── */

  const showMessage = (type, text) => {
    setRestoreMsg({ type, text });

    setTimeout(() => {
      setRestoreMsg(null);
    }, 4000);
  };

  /* ─────────────────────────────────────────────
     EXPORT JSON
  ───────────────────────────────────────────── */

  const handleExportJSON = () => {
    const data = {
      profile,
      bills,
      girvi,
      customers,
      orders,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `grahak-khaata-backup-${new Date()
      .toLocaleDateString("en-IN")
      .replace(/\//g, "-")}.json`;

    a.click();

    URL.revokeObjectURL(url);

    localStorage.setItem("lastBackupDate", new Date().toLocaleString("en-IN"));

    showMessage("success", "✅ Backup download ho gayi!");
  };

  /* ─────────────────────────────────────────────
     EXPORT CSV
  ───────────────────────────────────────────── */

  const handleExportCSV = () => {
    const billRows = [
      [
        "Bill ID",
        "Customer",
        "Mobile",
        "Village",
        "Total",
        "Paid",
        "Remaining",
        "Status",
        "Date",
      ],

      ...bills.map((b) => [
        b.id,
        b.customer?.name,
        b.customer?.mobile,
        b.customer?.village,
        b.total,
        b.paidAmount,
        b.remaining,
        b.status,
        b.customer?.date,
      ]),
    ];

    const girviRows = [
      [
        "ID",
        "Naam",
        "Mobile",
        "Village",
        "Item",
        "Amount",
        "Interest",
        "Date",
        "Status",
      ],

      ...girvi.map((g) => [
        g.id,
        g.name,
        g.mobile,
        g.village,
        g.item,
        g.amount,
        g.interest,
        g.date,
        g.status,
      ]),
    ];

    const billCSV = billRows.map((r) => r.join(",")).join("\n");

    const girviCSV = girviRows.map((r) => r.join(",")).join("\n");

    const orderRows = [
      [
        "ID",
        "Customer",
        "Mobile",
        "Item",
        "Total Amount",
        "Advance",
        "Status",
        "Delivery Date",
      ],
      ...(orders || []).map((o) => [
        o.id,
        o.customerName,
        o.mobile,
        o.item,
        o.totalAmount,
        o.advancePaid,
        o.status,
        o.deliveryDate,
      ]),
    ];
    const orderCSV = orderRows.map((r) => r.join(",")).join("\n");
    const combined = `BILLS\n${billCSV}\n\nGIRVI\n${girviCSV}\n\nORDERS\n${orderCSV}`;

    const blob = new Blob([combined], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `grahak-khaata-${new Date()
      .toLocaleDateString("en-IN")
      .replace(/\//g, "-")}.csv`;

    a.click();

    URL.revokeObjectURL(url);

    showMessage("success", "✅ CSV download ho gayi!");
  };

  /* ─────────────────────────────────────────────
     IMPORT JSON
  ───────────────────────────────────────────── */

  const handleImportJSON = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);

        if (typeof data !== "object" || (!data.bills && !data.girvi)) {
          throw new Error("Invalid");
        }

        showMessage("success", "Restore ho raha hai... ⏳");

        if (data.profile) {
          updateProfile(data.profile);
        }

        const result = await restoreBackup(data);

        if (result.success) {
          showMessage(
            "success",
            `✅ Restore ho gaya! ${data.bills?.length || 0} bills aur ${
              data.girvi?.length || 0
            } girvi aa gaye`,
          );
        } else {
          showMessage("error", "Restore failed, dobara try karo");
        }
      } catch {
        showMessage("error", "❌ Galat JSON file hai!");
      }
    };

    reader.readAsText(file);

    e.target.value = "";
  };

  /* ─────────────────────────────────────────────
     REMOVE DUPLICATES
  ───────────────────────────────────────────── */

  const handleRemoveDuplicates = async () => {
    const confirmDelete = window.confirm(
      "Duplicate data delete ho jayega. Ek baar delete hone ke baad wapas nahi aayega.\n\nKya aap sure hain?",
    );

    if (!confirmDelete) return;

    setRestoreMsg({
      type: "success",
      text: "Duplicates dhundh rahe hain... ⏳",
    });

    const result = await removeDuplicates();

    if (result.success) {
      setRestoreMsg({
        type: "success",
        text:
          result.removed > 0
            ? `✅ ${result.removed} duplicate records delete ho gaye!`
            : "✅ Koi duplicate nahi mila — data clean hai!",
      });
    } else {
      setRestoreMsg({
        type: "error",
        text: "❌ Kuch error aaya, dobara try karo",
      });
    }

    setTimeout(() => {
      setRestoreMsg(null);
    }, 4000);
  };
  const handleFirebaseSync = async () => {
    const ok = window.confirm(
      "Poora data Firebase pe sync hoga — Bills, Girvi, Customers, Profile sab. Continue?",
    );
    if (!ok) return;

    setSyncing(true);
    showMessage("success", "☁️ Firebase pe sync ho raha hai...");

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        showMessage("error", "❌ Pehle login karo!");
        setSyncing(false);
        return;
      }

      const result = await syncAllData(userId, {
        girvi,
        bills,
        customers,
        orders,
        profile,
      });

      if (result.failed === 0) {
        showMessage(
          "success",
          `✅ Saara data sync ho gaya! (${result.success} items)`,
        );
      } else {
        showMessage(
          "success",
          `⚠️ ${result.success} sync hue, ${result.failed} fail — dobara try karo`,
        );
      }
    } catch (err) {
      showMessage("error", "❌ Sync fail hua — internet check karo");
    } finally {
      setSyncing(false);
    }
  };
  /* ─────────────────────────────────────────────
     FIELDS
  ───────────────────────────────────────────── */

  const fields = [
    {
      icon: Store,
      label: "Dukaan ka Naam",
      name: "shopName",
      placeholder: "Apni dukaan ka naam likho",
    },

    {
      icon: User,
      label: "Malik ka Naam",
      name: "ownerName",
      placeholder: "Owner name",
    },

    {
      icon: MapPin,
      label: "Address / City",
      name: "address",
      placeholder: "Sheher ya pata",
    },

    {
      icon: Phone,
      label: "Mobile Number",
      name: "mobile",
      type: "tel",
      placeholder: "10 digit number",
    },

    {
      icon: FileText,
      label: "GST Number",
      name: "gst",
      placeholder: "Optional",
    },
  ];

  return (
    <div className="page more-page">
      {/* HEADER */}
      <div className="more-header">
        <div>
          <h2>More</h2>
          <p>Profile aur settings</p>
        </div>
        <button className="about-btn" onClick={() => setShowAbout(true)}>
          <BookOpen size={15} />
          About App
        </button>
        {/* ABOUT APP MODAL */}
        <AnimatePresence>
          {showAbout && (
            <motion.div
              className="about-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAbout(false)}
            >
              <motion.div
                className="about-modal"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="about-header">
                  <span className="about-title">📖 App Kaise Use Karein</span>
                  <button
                    className="about-close"
                    onClick={() => setShowAbout(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="about-content">
                  <div className="rule-card">
                    <div
                      className="rule-icon"
                      style={{ background: "rgba(56,130,220,0.1)" }}
                    >
                      <Smartphone size={18} color="#185FA5" />
                    </div>
                    <div className="rule-body">
                      <span className="rule-title">
                        Data Pehle Phone Mein Save Hota Hai
                      </span>
                      <span className="rule-desc">
                        Jab bhi naya entry banao, payment karo, ya edit karo —
                        sab pehle phone mein save hota hai. Internet ki zaroorat
                        nahi.
                      </span>
                    </div>
                  </div>

                  <div className="rule-card">
                    <div
                      className="rule-icon"
                      style={{ background: "rgba(45,122,79,0.1)" }}
                    >
                      <CloudUpload size={18} color="#2d7a4f" />
                    </div>
                    <div className="rule-body">
                      <span className="rule-title">
                        Firebase Sync — Jab Chahein Tab Karo
                      </span>
                      <span className="rule-desc">
                        More page pe "Firebase Sync" button dabao — Bills,
                        Girvi, Customers, Photos sab cloud pe save ho jaata hai.
                      </span>
                    </div>
                  </div>

                  <div className="rule-card">
                    <div
                      className="rule-icon"
                      style={{ background: "rgba(192,57,43,0.1)" }}
                    >
                      <WifiOff size={18} color="#c0392b" />
                    </div>
                    <div className="rule-body">
                      <span className="rule-title">
                        Bina Internet Ke Bhi Chalega
                      </span>
                      <span className="rule-desc">
                        Internet nahi hai toh bhi app poora kaam karega —
                        entries banao, dekho, edit karo. Sirf Firebase Sync ke
                        liye internet chahiye.
                      </span>
                    </div>
                  </div>

                  <div className="rule-card">
                    <div
                      className="rule-icon"
                      style={{ background: "rgba(184,134,11,0.1)" }}
                    >
                      <Wifi size={18} color="#b8860b" />
                    </div>
                    <div className="rule-body">
                      <span className="rule-title">Sync Kab Karein?</span>
                      <span className="rule-desc">
                        Roz kaam khatam hone ke baad ek baar Sync karo. Naya
                        important data daalne ke baad turant Sync kar lo.
                      </span>
                    </div>
                  </div>

                  <div className="rule-card">
                    <div
                      className="rule-icon"
                      style={{ background: "rgba(56,130,220,0.1)" }}
                    >
                      <FileJson size={18} color="#185FA5" />
                    </div>
                    <div className="rule-body">
                      <span className="rule-title">
                        JSON Backup Bhi Lete Raho
                      </span>
                      <span className="rule-desc">
                        Hafte mein ek baar "Export JSON" se backup lo. Phone
                        change karo toh "Import JSON" se saara data wapas aa
                        jayega.
                      </span>
                    </div>
                  </div>

                  <div className="rule-warning">
                    ⚠️ Agar Firebase Sync nahi kiya aur phone reset ho gaya —
                    toh data wapas nahi aayega. Isliye rozana sync karo!
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PROFILE */}

      <div className="more-section">
        <div className="section-title-row">
          <span className="section-title">👤 Profile</span>

          {!editing ? (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              <Edit3 size={13} />
              Edit
            </button>
          ) : (
            <button className="cancel-btn" onClick={handleCancel}>
              <X size={13} />
              Cancel
            </button>
          )}
        </div>

        {/* LOGO */}

        <div className="logo-row">
          <div
            className="logo-circle"
            onClick={() => editing && logoRef.current.click()}
            style={{
              cursor: editing ? "pointer" : "default",
            }}
          >
            {(editing ? form.logo : profile.logo) ? (
              <img
                src={editing ? form.logo : profile.logo}
                alt="Logo"
                className="logo-img"
              />
            ) : (
              <Store size={28} color="var(--gold)" />
            )}

            {editing && (
              <div className="logo-overlay">
                <Camera size={16} color="white" />
              </div>
            )}
          </div>

          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleLogo}
          />

          <div className="logo-info">
            <span className="logo-name">
              {profile.shopName || "Dukaan ka naam nahi hai"}
            </span>

            <span className="logo-sub">
              {profile.ownerName || "Owner name nahi hai"}
            </span>

            {editing && <span className="logo-hint">Logo pe click karo</span>}
          </div>
        </div>

        {/* FIELDS */}

        <div className="fields-list">
          {fields.map((field) => (
            <FieldRow
              key={field.name}
              {...field}
              value={editing ? form[field.name] : profile[field.name]}
              editing={editing}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* SAVE BUTTON */}

        <AnimatePresence>
          {editing && (
            <motion.button
              className="save-profile-btn"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 10,
              }}
              onClick={handleSave}
            >
              <Check size={15} />
              Profile Save Karo
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {/* LOGOUT */}
      <div className="more-section">
        <div className="section-title-row">
          <span className="section-title">🚪 Account</span>
        </div>

        <button
          className="backup-btn"
          onClick={async () => {
            const ok = window.confirm("Logout karna chahte ho?");
            if (ok) await signOut(auth);
          }}
          style={{ color: "var(--danger)" }}
        >
          <div
            className="backup-btn-icon"
            style={{ background: "rgba(192,57,43,0.1)" }}
          >
            <X size={18} color="#c0392b" />
          </div>
          <div className="backup-btn-body">
            <span className="backup-btn-title" style={{ color: "#c0392b" }}>
              Logout
            </span>
            <span className="backup-btn-sub">Account se bahar niklo</span>
          </div>
        </button>
        {/* FIREBASE SYNC */}
        <button
          className="backup-btn"
          onClick={handleFirebaseSync}
          disabled={syncing}
        >
          <div
            className="backup-btn-icon"
            style={{ background: "rgba(25,95,165,0.1)" }}
          >
            {syncing ? (
              <Loader2 size={18} color="#185FA5" className="spin" />
            ) : (
              <Cloud size={18} color="#185FA5" />
            )}
          </div>
          <div className="backup-btn-body">
            <span className="backup-btn-title">
              {syncing ? "Sync ho raha hai..." : "Firebase Sync"}
            </span>
            <span className="backup-btn-sub">
              Saara data cloud pe save karo
            </span>
          </div>
          {!syncing && <Upload size={16} />}
        </button>
      </div>

      {/* BACKUP SECTION */}

      <div className="more-section">
        <div className="section-title-row">
          <span className="section-title">💾 Backup & Restore</span>
        </div>

        {/* LAST BACKUP */}

        <div className="backup-info-row">
          <Clock size={13} />

          <span>
            Last backup:
            <strong>
              {" "}
              {localStorage.getItem("lastBackupDate") || "Abhi tak nahi hua"}
            </strong>
          </span>
        </div>

        {/* EXPORT JSON */}

        <button className="backup-btn" onClick={handleExportJSON}>
          <div
            className="backup-btn-icon"
            style={{
              background: "rgba(56,130,220,0.1)",
            }}
          >
            <FileJson size={18} color="#3882dc" />
          </div>

          <div className="backup-btn-body">
            <span className="backup-btn-title">Export JSON</span>

            <span className="backup-btn-sub">Saara data download karo</span>
          </div>

          <Download size={16} />
        </button>

        {/* EXPORT CSV */}

        <button className="backup-btn" onClick={handleExportCSV}>
          <div
            className="backup-btn-icon"
            style={{
              background: "rgba(45,122,79,0.1)",
            }}
          >
            <Table size={18} color="#2d7a4f" />
          </div>

          <div className="backup-btn-body">
            <span className="backup-btn-title">Export CSV</span>

            <span className="backup-btn-sub">Bills aur Girvi CSV me</span>
          </div>

          <Download size={16} />
        </button>

        {/* IMPORT JSON */}

        <button
          className="backup-btn"
          onClick={() => importRef.current.click()}
        >
          <div
            className="backup-btn-icon"
            style={{
              background: "rgba(184,134,11,0.1)",
            }}
          >
            <Upload size={18} color="var(--gold)" />
          </div>

          <div className="backup-btn-body">
            <span className="backup-btn-title">Import JSON</span>

            <span className="backup-btn-sub">Backup restore karo</span>
          </div>

          <Upload size={16} />
        </button>

        {/* REMOVE DUPLICATES */}

        <button className="backup-btn" onClick={handleRemoveDuplicates}>
          <div
            className="backup-btn-icon"
            style={{
              background: "rgba(192,57,43,0.1)",
            }}
          >
            <Trash2 size={18} color="#c0392b" />
          </div>

          <div className="backup-btn-body">
            <span className="backup-btn-title">Duplicates Remove Karo</span>

            <span className="backup-btn-sub">
              Same data ek baar se zyada ho toh hata do
            </span>
          </div>

          <Trash2 size={16} />
        </button>

        <input
          ref={importRef}
          type="file"
          accept=".json"
          hidden
          onChange={handleImportJSON}
        />
      </div>

      {/* TOAST */}

      <AnimatePresence>
        {(restoreMsg || saved) && (
          <motion.div
            className="saved-toast"
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            style={{
              background:
                restoreMsg?.type === "error"
                  ? "rgba(192,57,43,0.1)"
                  : "rgba(45,122,79,0.1)",

              borderColor:
                restoreMsg?.type === "error"
                  ? "rgba(192,57,43,0.25)"
                  : "rgba(45,122,79,0.25)",

              color:
                restoreMsg?.type === "error"
                  ? "var(--danger)"
                  : "var(--success)",
            }}
          >
            <Check size={13} />

            {saved ? "✅ Profile save ho gayi!" : restoreMsg?.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
