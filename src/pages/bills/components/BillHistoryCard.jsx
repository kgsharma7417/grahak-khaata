import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  MessageCircle,
  ChevronDown,
  Plus,
  Trash2,
  Download,
  Tag,
  Clock,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useStore } from "../../../store/useStore";

export default function BillHistoryCard({ bill }) {
  const addPayment = useStore((s) => s.addPayment);
  const deleteBill = useStore((s) => s.deleteBill);
  const applyDiscount = useStore((s) => s.applyDiscount);

  /* ── Panel state: null | "pay" | "discount" | "details" ── */
  const [activePanel, setActivePanel] = useState(null);
  const togglePanel = (name) =>
    setActivePanel((prev) => (prev === name ? null : name));

  const [payAmt, setPayAmt] = useState("");
  const [payNote, setPayNote] = useState("");
  const [discountAmt, setDiscountAmt] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);

  /* ── Loading states for async actions ── */
  const [deletingBill, setDeletingBill] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);

  /* ── Custom delete confirm modal ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setDiscountAmt(bill.discount > 0 ? String(bill.discount) : "");
  }, [bill.discount]);

  const discount = Number(bill.discount || 0);
  const totalPaid = Number(bill.paidAmount || 0);
  const billTotal = Number(bill.total || 0);
  const remaining = Math.max(0, billTotal - discount - totalPaid);
  const isPaid = remaining <= 0;

  const formatDate = (val) => {
    if (!val) return "—";
    const ms = val?.seconds ? val.seconds * 1000 : val;
    return new Date(ms).toLocaleDateString("en-IN");
  };

  /* ── PDF Download ── */
  const downloadPDF = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);

    try {
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: 595px; background: white;
        font-family: 'Noto Sans Devanagari', 'Mangal', Arial, sans-serif;
        font-size: 13px; color: #1c1c1c; padding: 0; margin: 0;
      `;

      const productRows = (bill.products || [])
        .map((p) => {
          const lt =
            (Number(p.weight || 0) * Number(p.rate || 0) +
              Number(p.making || 0)) *
            Number(p.qty || 1);
          return `
            <tr style="border-bottom: 1px dashed #e5e7eb;">
              <td style="padding: 8px 10px;">
                ${p.item || "सामान"}
                <span style="font-size:11px;color:#6b7280;margin-left:4px;">(${p.type === "gold" ? "सोना" : "चांदी"})</span>
              </td>
              <td style="padding:8px 10px;text-align:center;">${p.weight || 0}g</td>
              <td style="padding:8px 10px;text-align:center;">₹${Number(p.rate || 0).toLocaleString("en-IN")}</td>
              <td style="padding:8px 10px;text-align:center;">${p.qty || 1}</td>
              <td style="padding:8px 10px;text-align:right;font-weight:700;">₹${Math.round(lt).toLocaleString("en-IN")}</td>
            </tr>
            ${Number(p.making) > 0 ? `<tr><td colspan="5" style="font-size:11px;color:#9ca3af;padding:2px 10px 6px;">मेकिंग चार्ज: ₹${Number(p.making).toLocaleString("en-IN")}</td></tr>` : ""}
          `;
        })
        .join("");

      const paymentRows =
        (bill.paymentHistory || []).length === 0
          ? `<tr><td colspan="4" style="padding:10px;color:#9ca3af;font-size:12px;">अभी तक कोई भुगतान दर्ज नहीं है</td></tr>`
          : (bill.paymentHistory || [])
              .map(
                (ph, i) => `
                <tr style="border-bottom:1px solid #f3f4f6;">
                  <td style="padding:7px 10px;">${i + 1}.</td>
                  <td style="padding:7px 10px;color:#166534;font-weight:600;">₹${Number(ph.amount).toLocaleString("en-IN")}</td>
                  <td style="padding:7px 10px;">${new Date(ph.date).toLocaleDateString("en-IN")}</td>
                  <td style="padding:7px 10px;color:#9ca3af;font-size:11px;">${ph.note || "—"}</td>
                </tr>`,
              )
              .join("");

      container.innerHTML = `
        <div style="background:#1c1c1c;padding:22px 30px;text-align:center;">
          <div style="color:#FFD700;font-size:22px;font-weight:700;letter-spacing:1px;">कृष्ण गोपाल ज्वेलर्स</div>
          <div style="color:#d1d5db;font-size:12px;margin-top:5px;">ज्वेलरी बिलिंग इनवॉइस</div>
        </div>
        <div style="border-left:3px solid #DAA520;border-right:3px solid #DAA520;border-bottom:3px solid #DAA520;padding:20px 30px;">
          <div style="text-align:right;margin-bottom:-10px;">
            <span style="display:inline-block;border:3px double ${isPaid ? "#16a34a" : "#dc2626"};color:${isPaid ? "#16a34a" : "#dc2626"};font-size:15px;font-weight:900;padding:4px 16px;border-radius:6px;opacity:0.6;letter-spacing:2px;transform:rotate(-5deg);">
              ${isPaid ? "✓ PAID" : "⏳ PENDING"}
            </span>
          </div>
          <div style="background:#f9fafb;border-radius:10px;padding:14px 18px;margin:14px 0;">
            <div style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;margin-bottom:10px;">ग्राहक का विवरण (CUSTOMER DETAILS)</div>
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tr>
                <td style="padding:3px 0;color:#374151;width:50%;"><span style="color:#9ca3af;">ग्राहक का नाम: </span><strong>${bill.customer?.name || "—"}</strong></td>
                <td style="padding:3px 0;color:#374151;"><span style="color:#9ca3af;">दिनांक: </span><strong>${formatDate(bill.createdAt)}</strong></td>
              </tr>
              <tr>
                <td style="padding:3px 0;color:#374151;"><span style="color:#9ca3af;">मोबाइल: </span>${bill.customer?.mobile || "—"}</td>
                ${bill.customer?.village ? `<td style="padding:3px 0;color:#374151;"><span style="color:#9ca3af;">गांव: </span>${bill.customer.village}</td>` : "<td></td>"}
              </tr>
            </table>
          </div>
          <div style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;margin:16px 0 8px;">सामान का विवरण (ITEMS)</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:8px 10px;text-align:left;font-weight:600;">सामान</th>
                <th style="padding:8px 10px;text-align:center;font-weight:600;">वजन</th>
                <th style="padding:8px 10px;text-align:center;font-weight:600;">दर</th>
                <th style="padding:8px 10px;text-align:center;font-weight:600;">मात्रा</th>
                <th style="padding:8px 10px;text-align:right;font-weight:600;">कुल</th>
              </tr>
            </thead>
            <tbody>${productRows}</tbody>
          </table>
          <div style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;margin:18px 0 8px;">भुगतान इतिहास (PAYMENT HISTORY)</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:7px 10px;text-align:left;width:30px;">#</th>
                <th style="padding:7px 10px;text-align:left;">जमा राशि</th>
                <th style="padding:7px 10px;text-align:left;">दिनांक</th>
                <th style="padding:7px 10px;text-align:left;">नोट</th>
              </tr>
            </thead>
            <tbody>${paymentRows}</tbody>
          </table>
          <div style="background:#f9fafb;border-radius:10px;padding:14px 18px;margin-top:18px;">
            <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;">
              <span style="color:#6b7280;">कुल मूल्य</span>
              <span style="font-weight:600;">₹${billTotal.toLocaleString("en-IN")}</span>
            </div>
            ${discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;"><span style="color:#b45309;">छूट</span><span style="font-weight:600;color:#b45309;">-₹${discount.toLocaleString("en-IN")}</span></div>` : ""}
            <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;">
              <span style="color:#166534;">कुल जमा</span>
              <span style="font-weight:600;color:#166534;">₹${totalPaid.toLocaleString("en-IN")}</span>
            </div>
            <div style="border-top:1px solid #e5e7eb;margin-top:6px;padding-top:8px;display:flex;justify-content:space-between;font-size:15px;font-weight:700;">
              <span style="color:${isPaid ? "#166534" : "#dc2626"};">शेष राशि</span>
              <span style="color:${isPaid ? "#166534" : "#dc2626"};">₹${remaining.toLocaleString("en-IN")}</span>
            </div>
            <div style="text-align:center;margin-top:10px;font-size:13px;font-weight:700;color:${isPaid ? "#166534" : "#dc2626"};">
              ${isPaid ? "✅ स्थिति: पूरा भुगतान प्राप्त हुआ" : "⏳ स्थिति: भुगतान बाकी है"}
            </div>
          </div>
          <div style="text-align:center;margin-top:22px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
            हमारे यहाँ व्यापार करने के लिए धन्यवाद! — कृष्ण गोपाल ज्वेलर्स
          </div>
        </div>
      `;

      document.body.appendChild(container);
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 600));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 595,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const imgH = (canvas.height * pageW) / canvas.width;

      if (imgH <= pageH) {
        pdf.addImage(imgData, "JPEG", 0, 0, pageW, imgH);
      } else {
        let yOffset = 0;
        while (yOffset < imgH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, -yOffset, pageW, imgH);
          yOffset += pageH;
        }
      }

      const safeName = (bill.customer?.name || "Customer").replace(/\s+/g, "_");
      pdf.save(`KGJ_${safeName}_Invoice.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("PDF generate karne mein problem aayi. Dobara try karein.");
    } finally {
      setPdfGenerating(false);
    }
  };

  /* ── WhatsApp ── */
  const sendWhatsApp = () => {
    const raw = bill.customer?.mobile?.trim() || "";
    // Strip +91, 91 prefix, spaces, dashes
    const mobile = raw.replace(/^(\+91|91|0)/, "").replace(/[\s\-]/g, "");
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert(
        `Mobile number sahi nahi hai: "${raw}"\n10 digit ka number chahiye (6-9 se shuru)।`,
      );
      return;
    }

    const productLines = (bill.products || [])
      .map((p, i) => {
        const lt =
          (Number(p.weight || 0) * Number(p.rate || 0) +
            Number(p.making || 0)) *
          Number(p.qty || 1);
        return `  ${i + 1}. ${p.item || "Item"} (${p.type === "gold" ? "Gold" : "Silver"})\n     ${p.weight}g × ₹${p.rate}/g + ₹${p.making} मेकिंग × ${p.qty} = ₹${Math.round(lt).toLocaleString("en-IN")}`;
      })
      .join("\n\n");

    const payLines =
      (bill.paymentHistory || []).length > 0
        ? bill.paymentHistory
            .map(
              (ph, i) =>
                `  ${i + 1}. ₹${Number(ph.amount).toLocaleString("en-IN")} — ${new Date(ph.date).toLocaleDateString("en-IN")}${ph.note ? ` (${ph.note})` : ""}`,
            )
            .join("\n")
        : "  अभी तक कोई भुगतान दर्ज नहीं है";

    const msg = `🙏 *कृष्ण गोपाल ज्वेलर्स*

${bill.customer?.name} जी,

आपके bill की जानकारी निम्नानुसार है —
━━━━━━━━━━━━━━━━━━━━
👤 *ग्राहक का नाम:* ${bill.customer?.name}
📱 *मोबाइल:* ${mobile}${bill.customer?.village ? `\n🏠 *गांव:* ${bill.customer.village}` : ""}
━━━━━━━━━━━━━━━━━━━━
🛍️ *खरीदे गए सामान*

${productLines}
━━━━━━━━━━━━━━━━━━━━
💰 *भुगतान विवरण*

कुल राशि: ₹${billTotal.toLocaleString("en-IN")}${discount > 0 ? `\nछूट: -₹${discount.toLocaleString("en-IN")}` : ""}
जमा राशि: ₹${totalPaid.toLocaleString("en-IN")}
बाकी राशि: ₹${remaining.toLocaleString("en-IN")}
━━━━━━━━━━━━━━━━━━━━
📋 *भुगतान इतिहास*

${payLines}
━━━━━━━━━━━━━━━━━━━━
${isPaid ? "✅ आपका पूरा बिल जमा हो चुका है। आपका बहुत-बहुत धन्यवाद।" : `⏳ कृपया शेष ₹${remaining.toLocaleString("en-IN")} राशि सुविधानुसार जमा कर दें।`}

🙏 धन्यवाद
*कृष्ण गोपाल ज्वेलर्स*`;

    window.open(
      `https://wa.me/91${mobile}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  /* ── Add Payment (async fixed) ── */
  const handleAddPayment = async () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) {
      alert("Sahi amount daalo");
      return;
    }
    if (amt > remaining) {
      alert(`Sirf ₹${remaining.toLocaleString("en-IN")} baaki hai.`);
      return;
    }
    setSavingPayment(true);
    try {
      await addPayment(bill.id, amt, payNote.trim());
      setPayAmt("");
      setPayNote("");
      setActivePanel(null);
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment save karne mein problem aayi.");
    } finally {
      setSavingPayment(false);
    }
  };

  /* ── Apply Discount (async fixed) ── */
  const handleDiscount = async () => {
    const d = Number(discountAmt);
    if (isNaN(d) || d < 0) {
      alert("Valid discount daalo");
      return;
    }
    if (d > billTotal) {
      alert("Discount total se zyada nahi ho sakta!");
      return;
    }
    setSavingDiscount(true);
    try {
      await applyDiscount(bill.id, d);
      setActivePanel(null);
    } catch (err) {
      console.error("Discount error:", err);
      alert("Discount apply karne mein problem aayi.");
    } finally {
      setSavingDiscount(false);
    }
  };

  /* ── Delete Bill (async fixed, custom modal) ── */
  const handleDelete = async () => {
    setDeletingBill(true);
    try {
      await deleteBill(bill.id);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete karne mein problem aayi. Dobara try karein.");
    } finally {
      setDeletingBill(false);
      setShowDeleteModal(false);
    }
  };

  const remainingAfterDiscount = Math.max(
    0,
    billTotal - Number(discountAmt || 0) - totalPaid,
  );

  return (
    <>
      <style>{`
        :root {
          --gold: #DAA520;
          --gold-gradient: linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
          --charcoal: #1c1c1c;
        }
        .premium-history-card {
          background: white;
          border-radius: 20px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          border: 1px solid #eee;
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
          margin-bottom: 18px;
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .premium-history-card:hover {
          box-shadow: 0 12px 36px rgba(184,134,11,0.12);
          border-color: #DAA520;
        }
        .premium-stamp {
          position: absolute; top: 14px; right: 12px;
          transform: rotate(12deg);
          border: 2.5px double #22c55e; color: #22c55e;
          font-weight: 900; font-size: 12px; padding: 4px 14px;
          opacity: 0.3; border-radius: 6px; pointer-events: none;
          letter-spacing: 2px;
        }
        .phc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
        .phc-client-name { font-family: 'Playfair Display', Georgia, serif; font-size: 1.35rem; color: var(--charcoal); margin: 3px 0 4px; line-height: 1.2; }
        .phc-date { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #aaa; }
        .phc-remaining-amt { font-size: 1.65rem; font-weight: 800; margin: 2px 0; line-height: 1.1; }
        .text-gold { background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .text-red { color: #dc2626; }
        .phc-total-tag { font-size: 11px; color: #888; }
        .phc-action-bar { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #f0f0f0; flex-wrap: wrap; gap: 8px; }
        .phc-main-actions { display: flex; gap: 8px; }
        .phc-btn { display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; transition: all 0.2s; }
        .luxury-wa { background: #f0fdf4; color: #166534; }
        .luxury-wa:hover { background: #dcfce7; }
        .luxury-pdf { background: var(--charcoal); color: white; }
        .luxury-pdf:hover { background: #333; }
        .luxury-pdf:disabled { background: #777; cursor: not-allowed; opacity: 0.8; }
        .phc-tool-actions { display: flex; gap: 7px; }
        .phc-tool-btn { background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #666; cursor: pointer; transition: all 0.2s; }
        .phc-tool-btn:hover { background: #ebebeb; }
        .phc-tool-btn.active { background: var(--gold); color: white; }
        .phc-tool-btn.danger { color: #dc2626; }
        .phc-tool-btn.danger:hover { background: #fee2e2; color: #b91c1c; }
        .phc-tool-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .bhc-panel { background: #fafafa; padding: 14px; border-radius: 12px; margin-top: 12px; border: 1px solid #eee; overflow: hidden; }
        .bhc-form-grid { display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap; }
        .bhc-form-grid .bill-input { flex: 1; min-width: 120px; }
        .bill-input { padding: 8px 12px; border: 1.5px solid #ddd; border-radius: 8px; width: 100%; font-size: 13px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
        .bill-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(218,165,32,0.12); }
        .bhc-save-btn { background: var(--charcoal); color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; width: 100%; font-size: 13px; font-weight: 600; margin-top: 6px; transition: background 0.2s; }
        .bhc-save-btn:hover { background: #333; }
        .bhc-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .bhc-expanded { margin-top: 14px; border-top: 1px solid #eee; padding-top: 14px; overflow: hidden; }
        .bhc-product-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 13px; gap: 10px; }
        .bhc-pay-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; color: #555; border-bottom: 1px solid #f5f5f5; }
        .bhc-summary-bar { background: #f8f8f8; padding: 12px; border-radius: 8px; margin-top: 14px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-weight: 700; font-size: 13px; }
        .hint-text { font-size: 11px; color: #888; margin: 4px 0 8px; }

        /* Delete Modal */
        .delete-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .delete-modal {
          background: white; border-radius: 20px; padding: 28px 24px;
          max-width: 360px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          text-align: center;
        }
        .delete-modal-icon { font-size: 42px; margin-bottom: 12px; }
        .delete-modal h3 { font-size: 18px; font-weight: 700; color: #1c1c1c; margin: 0 0 8px; }
        .delete-modal p { font-size: 14px; color: #666; margin: 0 0 24px; line-height: 1.5; }
        .delete-modal-btns { display: flex; gap: 10px; }
        .btn-cancel { flex: 1; padding: 12px; border: 1.5px solid #ddd; border-radius: 12px; background: white; font-size: 14px; font-weight: 600; cursor: pointer; color: #555; transition: all 0.2s; }
        .btn-cancel:hover { background: #f5f5f5; }
        .btn-delete-confirm { flex: 1; padding: 12px; border: none; border-radius: 12px; background: #dc2626; color: white; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-delete-confirm:hover { background: #b91c1c; }
        .btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 600px) {
          .phc-header { flex-direction: column; gap: 10px; }
          .phc-btn span { display: none; }
        }
      `}</style>

      {/* Custom Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="delete-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deletingBill && setShowDeleteModal(false)}
          >
            <motion.div
              className="delete-modal"
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="delete-modal-icon">🗑️</div>
              <h3>Bill Delete Karen?</h3>
              <p>
                <strong>{bill.customer?.name || "Is bill"}</strong> ka bill
                permanently delete ho jaayega.
                <br />
                Yeh action undo nahi hoga।
              </p>
              <div className="delete-modal-btns">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingBill}
                >
                  Cancel
                </button>
                <button
                  className="btn-delete-confirm"
                  onClick={handleDelete}
                  disabled={deletingBill}
                >
                  {deletingBill ? "Delete ho raha hai..." : "Haan, Delete Karo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="premium-history-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        layout
      >
        {isPaid && <div className="premium-stamp">PAID ✓</div>}

        {/* Header */}
        <div className="phc-header">
          <div>
            <span className="phc-date">{formatDate(bill.createdAt)}</span>
            <h3 className="phc-client-name">{bill.customer?.name || "—"}</h3>
            <p className="phc-total-tag">
              {bill.customer?.village ? `${bill.customer.village} · ` : ""}
              {(bill.products || []).length} item
              {(bill.products || []).length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="phc-total-tag">Balance Due</span>
            <h2
              className={`phc-remaining-amt ${isPaid ? "text-gold" : "text-red"}`}
            >
              ₹{remaining.toLocaleString("en-IN")}
            </h2>
            <div className="phc-total-tag">
              Total: ₹{billTotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="phc-action-bar">
          <div className="phc-main-actions">
            <button className="phc-btn luxury-wa" onClick={sendWhatsApp}>
              <MessageCircle size={15} /> <span>WhatsApp</span>
            </button>
            <button
              className="phc-btn luxury-pdf"
              onClick={downloadPDF}
              disabled={pdfGenerating}
            >
              <Download size={15} />
              <span>{pdfGenerating ? "बन रहा है..." : "Invoice"}</span>
            </button>
          </div>

          <div className="phc-tool-actions">
            {!isPaid && (
              <button
                className={`phc-tool-btn ${activePanel === "pay" ? "active" : ""}`}
                title="Payment Add करें"
                onClick={() => togglePanel("pay")}
              >
                <Plus size={15} />
              </button>
            )}
            {!isPaid && (
              <button
                className={`phc-tool-btn ${activePanel === "discount" ? "active" : ""}`}
                title="Discount लगाएं"
                onClick={() => togglePanel("discount")}
              >
                <Tag size={15} />
              </button>
            )}
            <button
              className={`phc-tool-btn ${activePanel === "details" ? "active" : ""}`}
              title="Details देखें"
              onClick={() => togglePanel("details")}
            >
              <ChevronDown
                size={17}
                style={{
                  transform:
                    activePanel === "details"
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            <button
              className="phc-tool-btn danger"
              title="Bill Delete करें"
              onClick={() => setShowDeleteModal(true)}
              disabled={deletingBill}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Payment Form */}
        <AnimatePresence>
          {activePanel === "pay" && (
            <motion.div
              className="bhc-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <p
                style={{
                  fontWeight: "700",
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                + नया Payment
              </p>
              <div className="bhc-form-grid">
                <input
                  className="bill-input"
                  type="number"
                  placeholder={`Amount (max ₹${remaining.toLocaleString("en-IN")})`}
                  value={payAmt}
                  onChange={(e) => setPayAmt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
                />
                <input
                  className="bill-input"
                  type="text"
                  placeholder="Note (जैसे: Cash, UPI)"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
                />
              </div>
              <button
                className="bhc-save-btn"
                onClick={handleAddPayment}
                disabled={savingPayment}
              >
                {savingPayment ? "Save ho raha hai..." : "Save Payment ✦"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discount Form */}
        <AnimatePresence>
          {activePanel === "discount" && (
            <motion.div
              className="bhc-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <p
                style={{
                  fontWeight: "700",
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                Discount लगाएं
              </p>
              <div className="bhc-form-grid">
                <input
                  className="bill-input"
                  type="number"
                  placeholder="Discount Amount (₹)"
                  value={discountAmt}
                  onChange={(e) => setDiscountAmt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDiscount()}
                />
              </div>
              <p className="hint-text">
                Discount ke baad remaining: ₹
                {remainingAfterDiscount.toLocaleString("en-IN")}
              </p>
              <button
                className="bhc-save-btn"
                style={{ background: "#DAA520" }}
                onClick={handleDiscount}
                disabled={savingDiscount}
              >
                {savingDiscount ? "Apply ho raha hai..." : "Apply Discount ✦"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Details */}
        <AnimatePresence>
          {activePanel === "details" && (
            <motion.div
              className="bhc-expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <p
                style={{
                  fontWeight: "700",
                  marginBottom: "10px",
                  fontSize: "13px",
                }}
              >
                Products
              </p>
              {(bill.products || []).map((p, i) => {
                const lt =
                  (Number(p.weight || 0) * Number(p.rate || 0) +
                    Number(p.making || 0)) *
                  Number(p.qty || 1);
                return (
                  <div key={i} className="bhc-product-row">
                    <div>
                      <strong>{p.item || "Item"}</strong>{" "}
                      <span style={{ fontSize: "11px", color: "#aaa" }}>
                        ({p.type === "gold" ? "Gold" : "Silver"})
                      </span>
                      <br />
                      <span style={{ fontSize: "11px", color: "#888" }}>
                        {p.weight}g × ₹{p.rate}/g + ₹{p.making} making × {p.qty}
                      </span>
                    </div>
                    <div style={{ fontWeight: "700", whiteSpace: "nowrap" }}>
                      ₹{Math.round(lt).toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}

              <p
                style={{
                  fontWeight: "700",
                  marginTop: "18px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "13px",
                }}
              >
                <Clock size={13} /> Payment History
              </p>
              {(bill.paymentHistory || []).length === 0 ? (
                <p style={{ fontSize: "12px", color: "#bbb" }}>
                  अभी तक कोई payment नहीं हुआ
                </p>
              ) : (
                (bill.paymentHistory || []).map((ph, i) => (
                  <div key={ph.id || i} className="bhc-pay-row">
                    <div>
                      {new Date(ph.date).toLocaleDateString("en-IN")}
                      {ph.note && (
                        <>
                          <br />
                          <span style={{ fontSize: "11px", color: "#bbb" }}>
                            {ph.note}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={{ color: "#166534", fontWeight: "700" }}>
                      +₹{Number(ph.amount).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))
              )}

              <div className="bhc-summary-bar">
                <span style={{ color: "#166534" }}>
                  Paid: ₹{totalPaid.toLocaleString("en-IN")}
                </span>
                {discount > 0 && (
                  <span style={{ color: "#DAA520" }}>
                    Disc: -₹{discount.toLocaleString("en-IN")}
                  </span>
                )}
                <span style={{ color: isPaid ? "#166534" : "#dc2626" }}>
                  Remaining: ₹{remaining.toLocaleString("en-IN")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
