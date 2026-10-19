import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { listenStore, placeOrder } from "../services/db";
import { formatMoney } from "../utils/constants";

const CartCheckout = ({ onPlaced, onBrowse }) => {
  const { user } = useAuth();
  const { items, total, setQty, clear, storeId } = useCart();
  const [customer, setCustomer] = useState({ name: user?.displayName || "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The order must go to the store the cart items came from. The store currently being browsed
  // can differ (or be empty after a refresh, since the cart is now saved), so load the cart's store.
  const [store, setStore] = useState(null);

  useEffect(() => {
    if (!storeId) return undefined;
    return listenStore(storeId, setStore);
  }, [storeId]);

  const set = (k) => (e) => setCustomer((c) => ({ ...c, [k]: e.target.value }));

  if (!items.length) {
    return (
      <div>
        <h3>Cart & Checkout</h3>
        <p className="muted">Your cart is empty.</p>
        <button className="submit-btn" onClick={onBrowse}>Browse products</button>
      </div>
    );
  }

  const closed = store?.open === false;

  const submit = async (e) => {
    e.preventDefault();
    if (!store) return;
    setBusy(true);
    setError("");
    try {
      await placeOrder({
        store,
        buyer: user,
        items,
        customer: { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() },
      });
      clear();
      onPlaced();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not place your order. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div>
      <h3>Cart & Checkout</h3>
      <p className="muted">Ordering from {store?.name || "…"}</p>
      {closed && <p className="notice" role="status">This store is closed right now, so you can't place an order yet.</p>}
      <ul className="cart-list">
        {items.map((i) => (
          <li key={i.productId}>
            <span>{i.name} · {formatMoney(i.price)}/{i.unit}</span>
            <span className="qty">
              <button onClick={() => setQty(i.productId, i.qty - 1)} aria-label={`Remove one ${i.name}`}>−</button>
              {i.qty}
              <button onClick={() => setQty(i.productId, i.qty + 1)} disabled={i.qty >= i.max} aria-label={`Add one ${i.name}`}>+</button>
            </span>
            <strong>{formatMoney(i.price * i.qty)}</strong>
          </li>
        ))}
      </ul>
      <p className="cart-total">Total: {formatMoney(total)} <span className="muted">(pay on delivery)</span></p>

      <form className="create-store-form" onSubmit={submit}>
        <label htmlFor="cname">Your name</label>
        <input id="cname" value={customer.name} onChange={set("name")} autoComplete="name" required />
        <label htmlFor="cphone">Phone number</label>
        <input id="cphone" type="tel" value={customer.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" required />
        <label htmlFor="caddr">Delivery address</label>
        <textarea id="caddr" rows="3" value={customer.address} onChange={set("address")} autoComplete="street-address" required />
        <button className="submit-btn" disabled={busy || !store || closed}>{busy ? "Placing order…" : "Place order"}</button>
        {error && <p className="error-text" role="alert">{error}</p>}
      </form>
    </div>
  );
};

export default CartCheckout;
