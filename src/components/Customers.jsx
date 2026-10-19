import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { listenStoreOrders } from "../services/db";
import { CANCELLED, formatMoney, formatDate, phoneKey, telLink, waLink } from "../utils/constants";

// Customers are derived from orders, so there's no separate customer data to keep in sync.
// They're grouped by phone number: a buyer's sign-in ID can differ between devices, their number doesn't.
const Customers = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  useEffect(() => listenStoreOrders(user.uid, setOrders), [user.uid]);

  const customers = useMemo(() => {
    const map = {};
    (orders || []).forEach((o) => {
      if (o.status === CANCELLED) return; // cancelled orders don't make someone a customer
      const key = phoneKey(o.customer?.phone) || o.buyerId;
      const c = (map[key] ||= { id: key, name: "", phone: "", orders: 0, spent: 0, last: 0 });
      c.orders += 1;
      c.spent += o.total;
      if (o.createdAt >= c.last) {
        c.last = o.createdAt;
        c.name = o.customer?.name || c.name; // show the most recent name and number
        c.phone = o.customer?.phone || c.phone;
      }
    });
    return Object.values(map).sort((a, b) => b.spent - a.spent);
  }, [orders]);

  if (orders === null) return <div><h3>Customers</h3><div className="skeleton" /></div>;
  if (!customers.length) return <div><h3>Customers</h3><p className="muted">Customers appear here after their first order.</p></div>;

  return (
    <div>
      <h3>Customers ({customers.length})</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Orders</th><th>Total spent</th><th>Last order</th><th>Contact</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.orders}</td>
                <td>{formatMoney(c.spent)}</td>
                <td>{formatDate(c.last)}</td>
                <td>
                  <a className="contact-link" href={telLink(c.phone)}>Call</a>
                  <a className="contact-link" href={waLink(c.phone)} target="_blank" rel="noreferrer">WhatsApp</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
