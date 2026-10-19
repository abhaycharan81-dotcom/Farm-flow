// All Realtime Database access lives here so components stay free of Firebase details.
import {
  ref, get, update, onValue, push, runTransaction, serverTimestamp,
} from "firebase/database";
import { db } from "../firebase";
import { toArray, ORDER_STATUSES, CANCELLED, DELIVERED, isValidPhone } from "../utils/constants";

export { toArray };

/* ---------- helpers ---------- */
// Returns an unsubscribe function: call it in the useEffect cleanup.
const listen = (path, mapper, cb) =>
  onValue(
    ref(db, path),
    (snap) => cb(mapper(snap.val())),
    (err) => {
      console.error(`RTDB read failed at ${path}:`, err.message);
      cb(mapper(null));
    }
  );

/* ---------- users ---------- */
export const getUserRole = async (uid) => (await get(ref(db, `users/${uid}/role`))).val();
export const saveUserRole = (uid, role) =>
  update(ref(db, `users/${uid}`), { role, updatedAt: serverTimestamp() });

/* ---------- stores (a seller's storeId === their uid, so the share link is stable) ---------- */
export const listenStore = (storeId, cb) =>
  listen(`stores/${storeId}`, (v) => (v ? { id: storeId, ...v } : null), cb);

export const listenStores = (cb) => listen("stores", toArray, cb);

export const saveStore = async (uid, data) => {
  const storeRef = ref(db, `stores/${uid}`);
  const exists = (await get(storeRef)).exists();
  await update(storeRef, {
    ...data,
    ownerId: uid,
    ...(exists ? {} : { createdAt: serverTimestamp() }),
  });
};

// Stores without an `open` field count as open.
export const setStoreOpen = (uid, open) => update(ref(db, `stores/${uid}`), { open: !!open });

/* ---------- products ---------- */
export const listenProducts = (storeId, cb) => listen(`storeProducts/${storeId}`, toArray, cb);

export const syncCatalogueSelection = (storeId, toAdd, toRemoveIds) => {
  const updates = {};
  toAdd.forEach((p) => {
    updates[`storeProducts/${storeId}/${p.id}`] = {
      name: p.name, category: p.category, unit: p.unit, price: 0, stock: 0, available: false,
    };
  });
  toRemoveIds.forEach((id) => { updates[`storeProducts/${storeId}/${id}`] = null; });
  return update(ref(db), updates);
};

// Only the fields the seller actually changed are written. Writing all three used to
// overwrite stock that a buyer's order had just reduced.
export const saveProductEdits = (storeId, edits) => {
  const updates = {};
  Object.entries(edits).forEach(([id, e]) => {
    const base = `storeProducts/${storeId}/${id}`;
    if ("price" in e) updates[`${base}/price`] = Math.max(0, Number(e.price) || 0);
    if ("stock" in e) updates[`${base}/stock`] = Math.max(0, Number(e.stock) || 0);
    if ("available" in e) updates[`${base}/available`] = !!e.available;
  });
  return update(ref(db), updates);
};

/* ---------- stock helpers ---------- */
const stockRef = (storeId, productId) => ref(db, `storeProducts/${storeId}/${productId}/stock`);

// Atomic add/subtract on a product's stock.
const adjustStock = (storeId, productId, delta) =>
  runTransaction(stockRef(storeId, productId), (c) => (Number(c) || 0) + delta);

// Give stock back, but never re-create a product the seller has since removed.
const restock = async (storeId, productId, qty) => {
  const exists = (await get(ref(db, `storeProducts/${storeId}/${productId}/name`))).exists();
  if (exists) await adjustStock(storeId, productId, qty);
};

// Checks the product against the database (price, availability) and takes the stock in one
// transaction. The returned line uses the DATABASE price, never the one the browser sent.
const reserveItem = async (storeId, item) => {
  const qty = Number(item.qty);
  if (!(qty > 0)) throw new Error(`Invalid quantity for ${item.name}.`);

  const product = (await get(ref(db, `storeProducts/${storeId}/${item.productId}`))).val();
  if (!product || !product.available || !(Number(product.price) > 0)) {
    throw new Error(`${item.name} is no longer available.`);
  }

  const result = await runTransaction(stockRef(storeId, item.productId), (current) => {
    if (current === null) return current; // local cache miss: the SDK retries with the server value
    const stock = Number(current);
    if (!Number.isFinite(stock) || stock < qty) return; // genuine abort
    return stock - qty;
  });
  if (!result.committed || result.snapshot.val() === null) {
    throw new Error(`Not enough stock for ${item.name}.`);
  }
  return { productId: item.productId, name: product.name, unit: product.unit, price: Number(product.price), qty };
};

const cleanCustomer = (c = {}) => {
  const customer = {
    name: String(c.name || "").trim(),
    phone: String(c.phone || "").trim(),
    address: String(c.address || "").trim(),
  };
  if (!customer.name) throw new Error("Please enter your name.");
  if (!isValidPhone(customer.phone)) throw new Error("Please enter a valid phone number.");
  if (!customer.address) throw new Error("Please enter your delivery address.");
  return customer;
};

const money = (n) => Math.round(n * 100) / 100;

/* ---------- orders ---------- */
export const placeOrder = async ({ store, buyer, items, customer }) => {
  if (!items?.length) throw new Error("Your cart is empty.");
  const cleanedCustomer = cleanCustomer(customer);

  const open = (await get(ref(db, `stores/${store.id}/open`))).val();
  if (open === false) throw new Error(`${store.name} is closed right now. Please try again later.`);

  const reserved = [];
  const rollback = () =>
    Promise.all(
      reserved.map((l) =>
        adjustStock(store.id, l.productId, l.qty).catch((e) => console.error("Stock rollback failed:", e))
      )
    );

  try {
    for (const item of items) reserved.push(await reserveItem(store.id, item));

    const orderId = push(ref(db, `storeOrders/${store.id}`)).key;
    const order = {
      storeId: store.id,
      storeName: store.name,
      buyerId: buyer.uid,
      customer: cleanedCustomer, // { name, phone, address }
      items: reserved,
      total: money(reserved.reduce((s, i) => s + i.price * i.qty, 0)),
      status: ORDER_STATUSES[0],
      paymentMethod: "Cash on delivery",
      createdAt: Date.now(),
    };

    await update(ref(db), {
      [`storeOrders/${store.id}/${orderId}`]: order,
      [`buyerOrders/${buyer.uid}/${orderId}`]: order,
    });
    return orderId;
  } catch (err) {
    // Any failure (including saving the order itself) puts the reserved stock back.
    await rollback();
    throw err;
  }
};

const newestFirst = (v) => toArray(v).sort((a, b) => b.createdAt - a.createdAt);
export const listenStoreOrders = (storeId, cb) => listen(`storeOrders/${storeId}`, newestFirst, cb);
export const listenBuyerOrders = (uid, cb) => listen(`buyerOrders/${uid}`, newestFirst, cb);

export const updateOrderStatus = (order, status) => {
  if (!ORDER_STATUSES.includes(status)) return Promise.reject(new Error("Invalid order status."));
  return update(ref(db), {
    [`storeOrders/${order.storeId}/${order.id}/status`]: status,
    [`buyerOrders/${order.buyerId}/${order.id}/status`]: status,
  });
};

// Seller cancels an order: status flips once (transaction, so a double tap can't restock twice)
// and the reserved stock goes back on the shelf.
export const cancelOrder = async (order) => {
  const result = await runTransaction(
    ref(db, `storeOrders/${order.storeId}/${order.id}/status`),
    (s) => {
      if (s === null) return s;
      if (s === CANCELLED || s === DELIVERED) return; // too late to cancel
      return CANCELLED;
    }
  );
  if (!result.committed || result.snapshot.val() !== CANCELLED) {
    throw new Error("This order can no longer be cancelled.");
  }
  await update(ref(db), { [`buyerOrders/${order.buyerId}/${order.id}/status`]: CANCELLED });
  await Promise.all(order.items.map((i) => restock(order.storeId, i.productId, i.qty)));
};
