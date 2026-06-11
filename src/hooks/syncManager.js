/**
 * syncManager.js — LOCAL → FIREBASE SYNC
 *
 * FIX #3: Ab ek hi path use hota hai:
 *   users/{userId}/girvi/{id}
 *   users/{userId}/bills/{id}
 *   users/{userId}/customers/{id}
 *   users/{userId}/orders/{id}
 *   users/{userId}/meta/profile
 *
 * Pehle useStore Firebase se read karta tha alag path se,
 * aur syncManager alag path pe likhta tha — ab dono same path use karte hain.
 *
 * HOW TO USE (More.js mein already hai):
 *   const result = await syncAllData(userId, { girvi, bills, customers, orders, profile });
 */

import { db, storage } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { getImage } from "./imageDB";
import { useStore } from "../store/useStore";

// ── Helper: Firestore mein safe set karo ──
async function safeSetDoc(path, data) {
  try {
    // Firestore undefined values accept nahi karta — clean karo
    const clean = JSON.parse(
      JSON.stringify(data, (_, v) => (v === undefined ? null : v)),
    );
    await setDoc(doc(db, ...path), clean, { merge: true });
    return { success: true };
  } catch (err) {
    console.error(`setDoc failed [${path.join("/")}]:`, err.message);
    return { success: false };
  }
}

// ── Girvi record + photos sync ──
async function syncGirviRecord(record, userId) {
  try {
    const idStr = String(record.id);
    const customerImg = await getImage(idStr, "customer");
    const itemImg = await getImage(idStr, "item");

    let customerImgURL = record.customerImgURL || null;
    let itemImgURL = record.itemImgURL || null;

    // Photos Firebase Storage pe upload karo
    if (customerImg) {
      try {
        const imgRef = ref(
          storage,
          `users/${userId}/girvi/${idStr}/customer.jpg`,
        );
        await uploadString(imgRef, customerImg, "data_url");
        customerImgURL = await getDownloadURL(imgRef);
      } catch (imgErr) {
        console.warn("Customer photo upload failed:", imgErr.message);
        // Photo fail hone se poora sync fail nahi hoga
      }
    }

    if (itemImg) {
      try {
        const imgRef = ref(storage, `users/${userId}/girvi/${idStr}/item.jpg`);
        await uploadString(imgRef, itemImg, "data_url");
        itemImgURL = await getDownloadURL(imgRef);
      } catch (imgErr) {
        console.warn("Item photo upload failed:", imgErr.message);
      }
    }

    // FIX #3: Path = users/{userId}/girvi/{id}
    const result = await safeSetDoc(["users", userId, "girvi", idStr], {
      ...record,
      customerImgURL,
      itemImgURL,
      syncedAt: new Date().toISOString(),
      // synced flag Firestore mein nahi chahiye
      synced: undefined,
    });

    return result;
  } catch (err) {
    console.error("Girvi sync failed:", record.id, err);
    return { success: false };
  }
}

/**
 * syncAllData — Poora app ka data Firebase pe push karo
 *
 * @param {string} userId - auth.currentUser.uid
 * @param {object} data - { girvi, bills, customers, orders, profile }
 * @returns {{ success: number, failed: number, total: number }}
 */
export async function syncAllData(
  userId,
  { girvi, bills, customers, orders, profile },
) {
  let success = 0;
  let failed = 0;

  const syncedGirviIds = [];
  const syncedBillIds = [];
  const syncedCustomerIds = [];
  const syncedOrderIds = [];

  // 1. Profile
  const profileResult = await safeSetDoc(["users", userId, "meta", "profile"], {
    ...profile,
    syncedAt: new Date().toISOString(),
  });
  if (profileResult.success) success++;
  else failed++;

  // 2. Girvi (photos bhi)
  for (const record of girvi || []) {
    const result = await syncGirviRecord(record, userId);
    if (result.success) {
      success++;
      syncedGirviIds.push(record.id);
    } else {
      failed++;
    }
  }

  // 3. Bills
  for (const bill of bills || []) {
    const result = await safeSetDoc(
      ["users", userId, "bills", String(bill.id)],
      { ...bill, syncedAt: new Date().toISOString(), synced: undefined },
    );
    if (result.success) {
      success++;
      syncedBillIds.push(bill.id);
    } else {
      failed++;
    }
  }

  // 4. Customers
  for (const customer of customers || []) {
    const result = await safeSetDoc(
      ["users", userId, "customers", String(customer.id)],
      { ...customer, syncedAt: new Date().toISOString(), synced: undefined },
    );
    if (result.success) {
      success++;
      syncedCustomerIds.push(customer.id);
    } else {
      failed++;
    }
  }

  // 5. Orders
  for (const order of orders || []) {
    const result = await safeSetDoc(
      ["users", userId, "orders", String(order.id)],
      { ...order, syncedAt: new Date().toISOString(), synced: undefined },
    );
    if (result.success) {
      success++;
      syncedOrderIds.push(order.id);
    } else {
      failed++;
    }
  }

  // Sync ke baad local records mein synced: true mark karo
  const { markSynced } = useStore.getState();
  if (syncedGirviIds.length) markSynced("girvi", syncedGirviIds);
  if (syncedBillIds.length) markSynced("bills", syncedBillIds);
  if (syncedCustomerIds.length) markSynced("customers", syncedCustomerIds);
  if (syncedOrderIds.length) markSynced("orders", syncedOrderIds);

  return { success, failed, total: success + failed };
}
