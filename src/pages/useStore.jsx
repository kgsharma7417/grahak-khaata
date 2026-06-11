/**
 * useStore.js — LOCAL FIRST ARCHITECTURE
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────
 * 1. Har action pehle LOCAL (localStorage) mein save hota hai
 * 2. UI turant update hota hai — internet ki zaroorat nahi
 * 3. Firebase sync SIRF tab hota hai jab "Sync" button dabao
 * 4. Bina internet ke bhi poora app kaam karta hai
 * ─────────────────────────────────────────────────────
 *
 * BUGS FIXED:
 * - Bug #1: set() ab har action mein call hota hai → localStorage save hoga
 * - Bug #2: onSnapshot hata diya → offline pe data nahi jaayega
 * - Bug #3: syncManager path fix → ek hi jagah data save/read hoga
 * - Bug #4: removeDuplicates add kiya → More.js crash nahi karega
 * - Bug #5: addGirvi ab ID return karta hai → photos sahi record pe save hongi
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── ID generator — crypto.randomUUID with fallback ──
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

export const useStore = create(
  persist(
    (set, get) => ({
      // ════════════════════════════════════════
      // CUSTOMERS
      // ════════════════════════════════════════
      customers: [],

      addCustomer: (data) => {
        const newCustomer = {
          ...data,
          id: genId(),
          createdAt: Date.now(),
        };
        set((state) => ({
          customers: [...(state.customers || []), newCustomer],
        }));
        return newCustomer.id;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: (state.customers || []).map((c) =>
            String(c.id) === String(id) ? { ...c, ...updates } : c,
          ),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: (state.customers || []).filter(
            (c) => String(c.id) !== String(id),
          ),
        }));
      },

      // ════════════════════════════════════════
      // GIRVI
      // ════════════════════════════════════════
      girvi: [],

      /**
       * FIX #5: Ab ID return karta hai
       * Girvi.js mein: const newId = addGirvi(entry) → seedha milega
       */
      addGirvi: (data) => {
        const newId = genId();
        const newRecord = {
          ...data,
          id: newId,
          payments: data.payments || [],
          status: "active",
          createdAt: Date.now(),
          synced: false, // track karo sync hua ya nahi
        };
        set((state) => ({
          girvi: [...(state.girvi || []), newRecord],
        }));
        return newId; // ← FIX: ID return karo
      },

      updateGirvi: (id, updates) => {
        set((state) => ({
          girvi: (state.girvi || []).map((g) =>
            String(g.id) === String(id)
              ? { ...g, ...updates, synced: false }
              : g,
          ),
        }));
      },

      deleteGirvi: (id) => {
        set((state) => ({
          girvi: (state.girvi || []).filter((g) => String(g.id) !== String(id)),
        }));
      },

      // ════════════════════════════════════════
      // BILLS
      // ════════════════════════════════════════
      bills: [],

      addBill: (billData) => {
        const newId = genId();
        const paid = Number(billData.paidAmount || 0);
        const total = Number(billData.total || 0);
        const remaining = Math.max(0, total - paid);

        const newBill = {
          ...billData,
          id: newId,
          createdAt: Date.now(),
          paidAmount: paid,
          discount: 0,
          remaining,
          status: remaining <= 0 ? "paid" : "pending",
          synced: false,
          paymentHistory:
            paid > 0
              ? [
                  {
                    id: genId(),
                    amount: paid,
                    date: new Date().toISOString(),
                    note: "Initial Payment",
                  },
                ]
              : [],
        };

        set((state) => ({
          bills: [...(state.bills || []), newBill],
        }));
        return newId;
      },

      addPayment: (billId, amount, note = "") => {
        const bill = (get().bills || []).find(
          (b) => String(b.id) === String(billId),
        );
        if (!bill) return;

        const oldPaid = Number(bill.paidAmount || 0);
        const newPaid = oldPaid + Number(amount);
        const total = Number(bill.total || 0);
        const discount = Number(bill.discount || 0);
        const remaining = Math.max(0, total - discount - newPaid);

        set((state) => ({
          bills: (state.bills || []).map((b) =>
            String(b.id) === String(billId)
              ? {
                  ...b,
                  paidAmount: newPaid,
                  remaining,
                  status: remaining <= 0 ? "paid" : "pending",
                  synced: false,
                  paymentHistory: [
                    ...(b.paymentHistory || []),
                    {
                      id: genId(),
                      amount: Number(amount),
                      date: new Date().toISOString(),
                      note,
                    },
                  ],
                }
              : b,
          ),
        }));
      },

      deleteBill: (billId) => {
        set((state) => ({
          bills: (state.bills || []).filter(
            (b) => String(b.id) !== String(billId),
          ),
        }));
      },

      applyDiscount: (billId, discountAmt) => {
        const bill = (get().bills || []).find(
          (b) => String(b.id) === String(billId),
        );
        if (!bill) return;

        const discount = Number(discountAmt) || 0;
        const totalPaid = Number(bill.paidAmount || 0);
        const total = Number(bill.total || 0);
        const remaining = Math.max(0, total - discount - totalPaid);

        set((state) => ({
          bills: (state.bills || []).map((b) =>
            String(b.id) === String(billId)
              ? {
                  ...b,
                  discount,
                  remaining,
                  status: remaining <= 0 ? "paid" : "pending",
                  synced: false,
                }
              : b,
          ),
        }));
      },

      // ════════════════════════════════════════
      // ORDERS
      // ════════════════════════════════════════
      orders: [],

      addOrder: (data) => {
        const newId = genId();
        const newOrder = {
          ...data,
          id: newId,
          createdAt: Date.now(),
          synced: false,
        };
        set((state) => ({
          orders: [...(state.orders || []), newOrder],
        }));
        return newId;
      },

      updateOrder: (id, updates) => {
        set((state) => ({
          orders: (state.orders || []).map((o) =>
            String(o.id) === String(id)
              ? { ...o, ...updates, synced: false }
              : o,
          ),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: (state.orders || []).filter(
            (o) => String(o.id) !== String(id),
          ),
        }));
      },

      // ════════════════════════════════════════
      // PROFILE
      // ════════════════════════════════════════
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

      // ════════════════════════════════════════
      // RESTORE BACKUP (JSON import)
      // ════════════════════════════════════════
      restoreBackup: async (data) => {
        try {
          // Existing data ke saath merge karo, duplicates avoid karo
          const existingBillIds = new Set(
            (get().bills || []).map((b) => String(b.id)),
          );
          const existingGirviIds = new Set(
            (get().girvi || []).map((g) => String(g.id)),
          );
          const existingCustomerIds = new Set(
            (get().customers || []).map((c) => String(c.id)),
          );
          const existingOrderIds = new Set(
            (get().orders || []).map((o) => String(o.id)),
          );

          const newBills = (data.bills || [])
            .filter((b) => !existingBillIds.has(String(b.id)))
            .map((b) => ({ ...b, synced: false }));

          const newGirvi = (data.girvi || [])
            .filter((g) => !existingGirviIds.has(String(g.id)))
            .map((g) => ({ ...g, synced: false }));

          const newCustomers = (data.customers || [])
            .filter((c) => !existingCustomerIds.has(String(c.id)))
            .map((c) => ({ ...c, synced: false }));

          const newOrders = (data.orders || [])
            .filter((o) => !existingOrderIds.has(String(o.id)))
            .map((o) => ({ ...o, synced: false }));

          set((state) => ({
            bills: [...(state.bills || []), ...newBills],
            girvi: [...(state.girvi || []), ...newGirvi],
            customers: [...(state.customers || []), ...newCustomers],
            orders: [...(state.orders || []), ...newOrders],
          }));

          return { success: true };
        } catch (err) {
          console.error("Restore error:", err);
          return { success: false };
        }
      },

      // ════════════════════════════════════════
      // FIX #4: REMOVE DUPLICATES — ab exist karta hai
      // ════════════════════════════════════════
      removeDuplicates: async () => {
        try {
          const state = get();
          let removed = 0;

          // Bills — id se deduplicate
          const uniqueBills = [];
          const seenBillIds = new Set();
          for (const bill of state.bills || []) {
            if (!seenBillIds.has(String(bill.id))) {
              seenBillIds.add(String(bill.id));
              uniqueBills.push(bill);
            } else {
              removed++;
            }
          }

          // Girvi — id se deduplicate
          const uniqueGirvi = [];
          const seenGirviIds = new Set();
          for (const g of state.girvi || []) {
            if (!seenGirviIds.has(String(g.id))) {
              seenGirviIds.add(String(g.id));
              uniqueGirvi.push(g);
            } else {
              removed++;
            }
          }

          // Customers — id se deduplicate
          const uniqueCustomers = [];
          const seenCustIds = new Set();
          for (const c of state.customers || []) {
            if (!seenCustIds.has(String(c.id))) {
              seenCustIds.add(String(c.id));
              uniqueCustomers.push(c);
            } else {
              removed++;
            }
          }

          // Orders — id se deduplicate
          const uniqueOrders = [];
          const seenOrderIds = new Set();
          for (const o of state.orders || []) {
            if (!seenOrderIds.has(String(o.id))) {
              seenOrderIds.add(String(o.id));
              uniqueOrders.push(o);
            } else {
              removed++;
            }
          }

          set({
            bills: uniqueBills,
            girvi: uniqueGirvi,
            customers: uniqueCustomers,
            orders: uniqueOrders,
          });

          return { success: true, removed };
        } catch (err) {
          console.error("removeDuplicates error:", err);
          return { success: false, removed: 0 };
        }
      },

      // ════════════════════════════════════════
      // MARK AS SYNCED (syncManager call karega)
      // ════════════════════════════════════════
      markSynced: (collection, ids) => {
        const idSet = new Set(ids.map(String));
        set((state) => ({
          [collection]: (state[collection] || []).map((item) =>
            idSet.has(String(item.id)) ? { ...item, synced: true } : item,
          ),
        }));
      },

      // ════════════════════════════════════════
      // INIT — ab koi Firebase listener nahi
      // FIX #2: onSnapshot hata diya
      // ════════════════════════════════════════
      init: () => {
        // Kuch nahi karna — data localStorage se auto-load hoga
        return () => {};
      },
    }),

    {
      name: "jewellery-store",
      // Poora state persist karo
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
