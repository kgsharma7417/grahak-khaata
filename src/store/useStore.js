import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";

/* ── userId helper ── */
const uid = () => auth.currentUser?.uid;

/* ── Sync only current user's data ── */
const syncCollection = (collectionName, set) => {
  const userId = uid();
  if (!userId) return () => {};

  const ref = query(
    collection(db, collectionName),
    where("userId", "==", userId),
  );

  return onSnapshot(ref, (snapshot) => {
    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    set({ [collectionName]: data || [] });
  });
};

export const useStore = create(
  persist(
    (set, get) => ({
      /* ── CUSTOMERS ── */
      customers: [],

      init: () => {
        const unsubCustomers = get().syncCustomers();
        const unsubGirvi = get().syncGirvi();
        const unsubBills = get().syncBills();
        const unsubOrders = get().syncOrders();
        return () => {
          unsubCustomers?.();
          unsubGirvi?.();
          unsubBills?.();
          unsubOrders?.();
        };
      },

      syncCustomers: () => syncCollection("customers", set),

      addCustomer: async (data) => {
        await addDoc(collection(db, "customers"), {
          ...data,
          userId: uid(),
          createdAt: serverTimestamp(),
        });
      },

      updateCustomer: async (id, updates) => {
        if (!id) return;
        await updateDoc(doc(db, "customers", String(id)), updates);
      },

      deleteCustomer: async (id) => {
        if (!id) return;
        await deleteDoc(doc(db, "customers", String(id)));
      },

      /* ── GIRVI ── */
      girvi: [],

      syncGirvi: () => syncCollection("girvi", set),

      addGirvi: async (data) => {
        await addDoc(collection(db, "girvi"), {
          ...data,
          userId: uid(),
          createdAt: serverTimestamp(),
          payments: [],
          status: "active",
        });
      },

      updateGirvi: async (id, updates) => {
        if (!id) return;
        await updateDoc(doc(db, "girvi", String(id)), updates);
      },

      deleteGirvi: async (id) => {
        if (!id) return;
        await deleteDoc(doc(db, "girvi", String(id)));
      },

      addGirviPayment: async (girviId, amount, note = "") => {
        const item = get().girvi.find((g) => String(g.id) === String(girviId));
        if (!item) return;
        const newPayment = {
          id: Date.now(),
          amount: Number(amount),
          date: new Date().toISOString(),
          note,
        };
        await updateDoc(doc(db, "girvi", String(girviId)), {
          payments: [...(item.payments || []), newPayment],
        });
      },

      /* ── BILLS ── */
      bills: [],

      syncBills: () => syncCollection("bills", set),

      addBill: async (billData) => {
        const paid = Number(billData.paidAmount || 0);
        const total = Number(billData.total || 0);
        const remaining = Math.max(0, total - paid);

        await addDoc(collection(db, "bills"), {
          ...billData,
          userId: uid(),
          createdAt: serverTimestamp(),
          paidAmount: paid,
          discount: 0,
          remaining,
          status: remaining <= 0 ? "paid" : "pending",
          paymentHistory:
            paid > 0
              ? [
                  {
                    id: Date.now(),
                    amount: paid,
                    date: new Date().toISOString(),
                    note: "Initial Payment",
                  },
                ]
              : [],
        });
      },

      addPayment: async (billId, amount, note = "") => {
        const bill = get().bills.find((b) => String(b.id) === String(billId));
        if (!bill) return;
        const oldPaid = Number(bill.paidAmount || 0);
        const newPaid = oldPaid + Number(amount);
        const total = Number(bill.total || 0);
        const discount = Number(bill.discount || 0);
        const remaining = Math.max(0, total - discount - newPaid);

        await updateDoc(doc(db, "bills", String(billId)), {
          paidAmount: newPaid,
          remaining,
          status: remaining <= 0 ? "paid" : "pending",
          paymentHistory: [
            ...(bill.paymentHistory || []),
            {
              id: Date.now(),
              amount: Number(amount),
              date: new Date().toISOString(),
              note,
            },
          ],
        });
      },

      deleteBill: async (billId) => {
        if (!billId) return;
        await deleteDoc(doc(db, "bills", String(billId)));
      },

      applyDiscount: async (billId, discountAmt) => {
        const bill = get().bills.find((b) => String(b.id) === String(billId));
        if (!bill) return;
        const discount = Number(discountAmt) || 0;
        const totalPaid = Number(bill.paidAmount || 0);
        const total = Number(bill.total || 0);
        const remaining = Math.max(0, total - discount - totalPaid);

        await updateDoc(doc(db, "bills", String(billId)), {
          discount,
          remaining,
          status: remaining <= 0 ? "paid" : "pending",
        });
      },

      /* ── ORDERS ── */
      orders: [],

      syncOrders: () => syncCollection("orders", set),

      addOrder: async (data) => {
        await addDoc(collection(db, "orders"), {
          ...data,
          userId: uid(),
          createdAt: serverTimestamp(),
          status: data.status || "pending",
          advancePaid: Number(data.advancePaid || 0),
          totalAmount: Number(data.totalAmount || 0),
        });
      },

      updateOrder: async (id, updates) => {
        if (!id) return;
        await updateDoc(doc(db, "orders", String(id)), updates);
      },

      deleteOrder: async (id) => {
        if (!id) return;
        await deleteDoc(doc(db, "orders", String(id)));
      },

      /* ── RESTORE BACKUP ── */
      restoreBackup: async (data) => {
        try {
          const userId = uid();
          if (!userId) return { success: false };

          if (data.bills?.length) {
            for (const bill of data.bills) {
              const { id, ...billData } = bill;
              await addDoc(collection(db, "bills"), {
                ...billData,
                userId,
                restoredAt: serverTimestamp(),
              });
            }
          }

          if (data.girvi?.length) {
            for (const g of data.girvi) {
              const { id, ...girviData } = g;
              await addDoc(collection(db, "girvi"), {
                ...girviData,
                userId,
                restoredAt: serverTimestamp(),
              });
            }
          }

          if (data.customers?.length) {
            for (const c of data.customers) {
              const { id, ...custData } = c;
              await addDoc(collection(db, "customers"), {
                ...custData,
                userId,
                restoredAt: serverTimestamp(),
              });
            }
          }

          if (data.orders?.length) {
            for (const o of data.orders) {
              const { id, ...orderData } = o;
              await addDoc(collection(db, "orders"), {
                ...orderData,
                userId,
                restoredAt: serverTimestamp(),
              });
            }
          }

          return { success: true };
        } catch (err) {
          console.error("Restore error:", err);
          return { success: false };
        }
      },

      /* ── REMOVE DUPLICATES ── */
      removeDuplicates: async () => {
        try {
          const userId = uid();
          if (!userId) return { success: false, removed: 0 };

          let removed = 0;

          const checkAndRemove = async (collectionName, keyFn) => {
            const ref = query(
              collection(db, collectionName),
              where("userId", "==", userId),
            );
            const snapshot = await getDocs(ref);
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const seen = new Map();
            for (const d of docs) {
              const key = keyFn(d);
              if (seen.has(key)) {
                await deleteDoc(doc(db, collectionName, d.id));
                removed++;
              } else {
                seen.set(key, true);
              }
            }
          };

          await checkAndRemove(
            "bills",
            (d) => `${d.customer?.name}-${d.total}-${d.customer?.date}`,
          );
          await checkAndRemove(
            "girvi",
            (d) => `${d.name}-${d.amount}-${d.date}`,
          );
          await checkAndRemove("customers", (d) => `${d.name}-${d.mobile}`);
          await checkAndRemove(
            "orders",
            (d) => `${d.customerName}-${d.totalAmount}-${d.deliveryDate}`,
          );

          return { success: true, removed };
        } catch (err) {
          console.error("Remove duplicates error:", err);
          return { success: false, removed: 0 };
        }
      },

      /* ── PROFILE ── */
      profile: {
        shopName: "",
        ownerName: "",
        address: "",
        mobile: "",
        gst: "",
        logo: null,
      },

      updateProfile: (updates) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
      },
    }),

    {
      name: "jewellery-store",
      partialize: (state) => ({
        customers: state.customers || [],
        girvi: state.girvi || [],
        bills: state.bills || [],
        orders: state.orders || [],
        profile: state.profile || {},
      }),
    },
  ),
);
