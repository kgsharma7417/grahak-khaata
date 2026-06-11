import { db, storage } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { getImage } from "./imageDB";

// Girvi ki ek entry sync karo (text + photos)
async function syncGirviRecord(record, userId) {
  try {
    const customerImg = await getImage(String(record.id), "customer");
    const itemImg = await getImage(String(record.id), "item");

    let customerImgURL = record.customerImgURL || null;
    let itemImgURL = record.itemImgURL || null;

    if (customerImg) {
      const imgRef = ref(
        storage,
        `users/${userId}/girvi/${record.id}/customer.jpg`,
      );
      await uploadString(imgRef, customerImg, "data_url");
      customerImgURL = await getDownloadURL(imgRef);
    }

    if (itemImg) {
      const imgRef = ref(
        storage,
        `users/${userId}/girvi/${record.id}/item.jpg`,
      );
      await uploadString(imgRef, itemImg, "data_url");
      itemImgURL = await getDownloadURL(imgRef);
    }

    await setDoc(doc(db, "users", userId, "girvi", String(record.id)), {
      ...record,
      customerImgURL,
      itemImgURL,
      syncedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    console.error("Girvi sync failed:", record.id, err);
    return { success: false };
  }
}

// Poora app ka data ek saath sync karo
export async function syncAllData(
  userId,
  { girvi, bills, customers, orders, profile },
) {
  let success = 0;
  let failed = 0;

  // 1. Profile
  try {
    await setDoc(doc(db, "users", userId, "meta", "profile"), {
      ...profile,
      syncedAt: new Date().toISOString(),
    });
    success++;
  } catch (err) {
    console.error("Profile sync failed:", err);
    failed++;
  }

  // 2. Girvi records (photos bhi)
  for (const record of girvi) {
    const result = await syncGirviRecord(record, userId);
    if (result.success) success++;
    else failed++;
  }

  // 3. Bills
  for (const bill of bills) {
    try {
      await setDoc(doc(db, "users", userId, "bills", String(bill.id)), {
        ...bill,
        syncedAt: new Date().toISOString(),
      });
      success++;
    } catch (err) {
      console.error("Bill sync failed:", bill.id, err);
      failed++;
    }
  }

  // 4. Customers
  for (const customer of customers) {
    try {
      await setDoc(doc(db, "users", userId, "customers", String(customer.id)), {
        ...customer,
        syncedAt: new Date().toISOString(),
      });
      success++;
    } catch (err) {
      console.error("Customer sync failed:", customer.id, err);
      failed++;
    }
  }
  // 5. Orders
  for (const order of orders || []) {
    try {
      await setDoc(doc(db, "users", userId, "orders", String(order.id)), {
        ...order,
        syncedAt: new Date().toISOString(),
      });
      success++;
    } catch (err) {
      console.error("Order sync failed:", order.id, err);
      failed++;
    }
  }

  return { success, failed, total: success + failed };
}
