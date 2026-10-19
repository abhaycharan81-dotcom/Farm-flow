import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listenBuyerOrders } from "../services/db";
import { ORDER_STATUSES, CANCELLED, formatMoney, formatDate } from "../utils/constants";

// Live: the status moves on screen as soon as the seller updates it (RTDB listener).
const TrackOrder = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenBuyerOrders(user.uid, setOrders);
  }, [user?.uid]);

  if (!user) {
    return (
      <div>
        <h3>Track Order</h3>
        <p className="muted">Order updates will appear here after you sign in and place an order.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Track Order</h3>
      {orders === null && <><div className="skeleton" /><div className="skeleton" /></>}
      {orders && !orders.length && <p className="muted">You haven't placed an order yet.</p>}
      {orders?.map((o) => {
        const cancelled = o.status === CANCELLED;
        const current = ORDER_STATUSES.indexOf(o.status);
        return (
          <div key={o.id} className={`order-card${cancelled ? " cancelled" : ""}`}>
            <div className="order-head"><strong>{o.storeName}</strong><strong>{formatMoney(o.total)}</strong></div>
            <p className="muted">#{o.id.slice(-5).toUpperCase()} · {formatDate(o.createdAt)}</p>
            {cancelled ? (
              <p><span className="badge badge-cancelled">Cancelled</span> The store cancelled this order. Contact them if you have questions.</p>
            ) : (
              <ol className="stepper">
                {ORDER_STATUSES.map((s, i) => (
                  <li key={s} className={i <= current ? "done" : ""} aria-current={i === current ? "step" : undefined}>{s}</li>
                ))}
              </ol>
            )}
            <ul className="order-items">
              {o.items.map((i) => <li key={i.productId}>{i.qty} × {i.name}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default TrackOrder;
