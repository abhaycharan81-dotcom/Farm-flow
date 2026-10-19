export const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
// Cancelled sits outside the normal Placed -> Delivered flow, so it is kept separate.
export const CANCELLED = "Cancelled";
export const DELIVERED = ORDER_STATUSES[ORDER_STATUSES.length - 1];

export const formatMoney = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

export const formatDate = (ts) =>
  ts
    ? new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "";

// RTDB returns objects keyed by id (or null). Convert to an array with the key as `id`.
export const toArray = (value) =>
  value ? Object.entries(value).map(([id, v]) => ({ id, ...v })) : [];

export const storeLink = (storeId) => `${window.location.origin}/store/${storeId}`;

/* ---------- phone helpers ---------- */
export const phoneDigits = (p) => String(p || "").replace(/\D/g, "");
// Last 10 digits, so "+91 98200 12345" and "098200 12345" count as the same customer.
export const phoneKey = (p) => phoneDigits(p).slice(-10);
export const isValidPhone = (p) => {
  const n = phoneDigits(p).length;
  return n >= 10 && n <= 13;
};
export const telLink = (phone) => `tel:${phoneDigits(phone)}`;
// 10-digit numbers get the India country code so wa.me opens the right chat.
export const waLink = (phone, text = "") => {
  let d = phoneDigits(phone);
  if (d.length === 10) d = `91${d}`;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};
