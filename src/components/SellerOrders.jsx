import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { listenStoreOrders, updateOrderStatus, cancelOrder } from "../services/db";
import { ORDER_STATUSES, CANCELLED, DELIVERED, formatMoney, formatDate, telLink, waLink } from "../utils/constants";

const FILTERS = {
  Active: (o) => o.status !== DELIVERED && o.status !== CANCELLED,
  Delivered: (o) => o.status === DELIVERED,
  Cancelled: (o) => o.status === CANCELLED,
  All: () => true,
};

const nextStatus = (status) => {
  const i = ORDER_STATUSES.indexOf(status);
  return i >= 0 ? ORDER_STATUSES[i + 1] : undefined; // Cancelled (-1) has no next step
};

const SellerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("Active");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => listenStoreOrders(user.uid, setOrders), [user.uid]);

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(FILTERS).map(([k, fn]) => [k, (orders || []).filter(fn).length])),
    [orders]
  );

  const run = async (order, action, failMessage) => {
    setBusyId(order.id);
    setError("");
    try {
      await action();
    } catch (e) {
      console.error(e);
      // Our own errors are already readable; Firebase errors carry a `code` and get the generic text.
      setError(e?.code ? failMessage : e.message || failMessage);
    }
    setBusyId(null);
  };

  const advance = (order) => {
    const next = nextStatus(order.status);
    if (!next) return;
    run(order, () => updateOrderStatus(order, next), "Could not update the order. Please try again.");
  };

  const cancel = (order) => {
    if (!window.confirm(`Cancel ${order.customer?.name || "this"} order? The stock will be returned.`)) return;
    run(order, () => cancelOrder(order), "Could not cancel the order. Please try again.");
  };

  const shown = (orders || []).filter(FILTERS[filter]);

  return (
    <div>
      <h3>Orders</h3>
      {error && <p className="error-text" role="alert">{error}</p>}

      <div className="chips" role="tablist" aria-label="Filter orders">
        {Object.keys(FILTERS).map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f}
            className={`chip${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {orders === null && <><div className="skeleton" /><div className="skeleton" /></>}
      {orders && !orders.length && <p className="muted">No orders yet. Share your store link to get your first one.</p>}
      {orders && orders.length > 0 && !shown.length && <p className="muted">No {filter.toLowerCase()} orders.</p>}

      {shown.map((o) => {
        const next = nextStatus(o.status);
        const canCancel = o.status !== DELIVERED && o.status !== CANCELLED;
        const busy = busyId === o.id;
        const message = `Hi ${o.customer?.name || ""}, your order from ${o.storeName} is now: ${o.status}.`;
        return (
          <div key={o.id} className={`order-card${o.status === CANCELLED ? " cancelled" : ""}`}>
            <div className="order-head">
              <strong>{o.customer?.name}</strong>
              <span className={`badge badge-${o.status.replace(/\s/g, "").toLowerCase()}`}>{o.status}</span>
            </div>
            <p className="muted">#{o.id.slice(-5).toUpperCase()} · {formatDate(o.createdAt)} · {o.customer?.phone}</p>
            <p>{o.customer?.address}</p>
            <ul className="order-items">
              {o.items.map((i) => <li key={i.productId}>{i.qty} × {i.name} ({formatMoney(i.price)}/{i.unit})</li>)}
            </ul>
            <div className="order-head">
              <strong>{formatMoney(o.total)}</strong>
              <span>
                <a className="contact-link" href={telLink(o.customer?.phone)}>Call</a>
                <a className="contact-link" href={waLink(o.customer?.phone, message)} target="_blank" rel="noreferrer">WhatsApp</a>
              </span>
            </div>
            {(next || canCancel) && (
              <div className="order-actions">
                {next && (
                  <button className="submit-btn small" disabled={busy} onClick={() => advance(o)}>Mark as {next}</button>
                )}
                {canCancel && (
                  <button className="danger-btn" disabled={busy} onClick={() => cancel(o)}>Cancel order</button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SellerOrders;
