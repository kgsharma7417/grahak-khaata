import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, MapPin, Receipt, Lock, X } from "lucide-react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom"; // ← NEW
import "./Contacts.css";

export default function Contacts() {
  const navigate = useNavigate(); // ← NEW
  const bills = useStore((state) => state.bills);
  const girvi = useStore((state) => state.girvi);
  const orders = useStore((state) => state.orders ?? []);
  const contactsMap = {};

  bills.forEach((bill) => {
    const mobile = bill.customer?.mobile || "";
    if (!mobile) return;
    if (!contactsMap[mobile]) {
      contactsMap[mobile] = {
        id: mobile,
        name: bill.customer?.name || "Customer",
        mobile,
        village: bill.customer?.village || "",
        billCount: 0,
        girviCount: 0,
        orderCount: 0,
        totalBillAmount: 0,
        totalGirviAmount: 0,
        totalOrderAmount: 0,
        pendingBillAmount: 0,
      };
    }
    contactsMap[mobile].billCount += 1;
    contactsMap[mobile].totalBillAmount += Number(bill.total || 0);
    contactsMap[mobile].pendingBillAmount += Number(bill.remaining || 0);
  });

  girvi.forEach((g) => {
    const mobile = g.mobile || "";
    if (!mobile) return;
    if (!contactsMap[mobile]) {
      contactsMap[mobile] = {
        id: mobile,
        name: g.name || "Customer",
        mobile,
        village: g.village || "",
        billCount: 0,
        girviCount: 0,
        orderCount: 0,
        totalBillAmount: 0,
        totalGirviAmount: 0,
        totalOrderAmount: 0,
        pendingBillAmount: 0,
      };
    }
    contactsMap[mobile].girviCount += 1;
    contactsMap[mobile].totalGirviAmount += Number(g.amount || 0);
  });
  orders.forEach((o) => {
    const mobile = o.mobile || "";
    if (!mobile) return;
    if (!contactsMap[mobile]) {
      contactsMap[mobile] = {
        id: mobile,
        name: o.customerName || "Customer",
        mobile,
        village: o.village || "",
        billCount: 0,
        girviCount: 0,
        orderCount: 0,
        totalBillAmount: 0,
        totalGirviAmount: 0,
        totalOrderAmount: 0,
        pendingBillAmount: 0,
      };
    }
    contactsMap[mobile].orderCount += 1;
    contactsMap[mobile].totalOrderAmount += Number(o.totalAmount || 0);
  });

  const contacts = Object.values(contactsMap);
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.village || "").toLowerCase().includes(q)
    );
  });

  const handleCall = (e, mobile) => {
    e.stopPropagation();
    window.open(`tel:${mobile}`);
  };

  const handleWhatsApp = (e, mobile) => {
    e.stopPropagation();
    window.open(`https://wa.me/91${mobile}`, "_blank");
  };

  return (
    <div className="page contacts-page">
      {/* HEADER */}
      <div className="contacts-header">
        <div>
          <h2>Customers</h2>
          <p>{contacts.length} contacts — Bills + Girvi se</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <Search size={15} />
        <input
          placeholder="Naam, mobile, village..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => setSearch("")}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {contacts.length === 0 && (
        <motion.div
          className="contacts-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p style={{ fontSize: 32 }}>👥</p>
          <p style={{ fontWeight: 600, marginTop: 8 }}>
            Koi customer nahi mila
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Pehle koi Bill ya Girvi add karo — customer yahan dikhe ga
          </p>
        </motion.div>
      )}

      {/* LIST */}
      <div className="customer-list">
        <AnimatePresence>
          {filtered.map((contact, i) => (
            <motion.div
              key={contact.id}
              className="customer-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => navigate(`/customer/${contact.mobile}`)} // ← NEW
              style={{ cursor: "pointer" }} // ← NEW
            >
              {/* TOP ROW */}
              <div className="customer-top">
                <div className="contact-avatar">
                  {contact.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                    {contact.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 3,
                    }}
                  >
                    {contact.village && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <MapPin size={10} /> {contact.village}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Phone size={10} /> {contact.mobile}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={(e) => handleCall(e, contact.mobile)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-card)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-secondary)",
                    }}
                    title="Call"
                  >
                    <Phone size={14} />
                  </button>
                  <button
                    onClick={(e) => handleWhatsApp(e, contact.mobile)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      border: "none",
                      background: "#25D366",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 14,
                    }}
                    title="WhatsApp"
                  >
                    💬
                  </button>
                </div>
              </div>

              {/* STATS ROW */}
              <div className="customer-stats">
                <div className="contact-stat">
                  <Receipt size={11} />
                  <span>
                    {contact.billCount} Bill{contact.billCount !== 1 ? "s" : ""}
                  </span>
                  {contact.totalBillAmount > 0 && (
                    <strong>
                      ₹{contact.totalBillAmount.toLocaleString("en-IN")}
                    </strong>
                  )}
                </div>

                <div className="contact-stat">
                  <Lock size={11} />
                  <span>{contact.girviCount} Girvi</span>
                  {contact.totalGirviAmount > 0 && (
                    <strong>
                      ₹{contact.totalGirviAmount.toLocaleString("en-IN")}
                    </strong>
                  )}
                </div>
                {contact.orderCount > 0 && (
                  <div className="contact-stat">
                    <span>📦</span>
                    <span>{contact.orderCount} Order</span>
                    {contact.totalOrderAmount > 0 && (
                      <strong>
                        ₹{contact.totalOrderAmount.toLocaleString("en-IN")}
                      </strong>
                    )}
                  </div>
                )}

                {contact.pendingBillAmount > 0 && (
                  <div className="contact-stat contact-stat-danger">
                    <span>Pending</span>
                    <strong>
                      ₹{contact.pendingBillAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {contacts.length > 0 && filtered.length === 0 && (
          <motion.div
            className="contacts-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              "{search}" ke liye koi result nahi
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
