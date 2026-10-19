import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { listenStore, listenProducts, listenStoreOrders, setStoreOpen } from "../services/db";
import { CANCELLED, DELIVERED, formatMoney, phoneKey } from "../utils/constants";

const StoreProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return undefined;
    const offs = [
      listenStore(user.uid, setStore),
      listenProducts(user.uid, setProducts),
      listenStoreOrders(user.uid, setOrders),
    ];
    return () => offs.forEach((off) => off());
  }, [user?.uid]);

  const stats = useMemo(() => {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const valid = orders.filter((o) => o.status !== CANCELLED);
    const today = valid.filter((o) => o.createdAt >= startOfDay);
    return {
      live: products.filter((p) => p.available && p.price > 0 && p.stock > 0).length,
      customers: new Set(valid.map((o) => phoneKey(o.customer?.phone) || o.buyerId)).size,
      ordersToday: today.length,
      salesToday: today.reduce((s, o) => s + o.total, 0),
      delivered: orders.filter((o) => o.status === DELIVERED).length,
    };
  }, [products, orders]);

  const toggleOpen = async (e) => {
    setError("");
    try {
      await setStoreOpen(user.uid, e.target.checked);
    } catch (err) {
      console.error(err);
      setError("Could not update the store status. Please try again.");
    }
  };

  const signOut = async () => {
    await logout();
    navigate("/");
  };

  if (store === undefined) return <div className="skeleton" />;
  if (!store) return <p className="muted">No store found. Please complete Store Setup first.</p>;

  const isOpen = store.open !== false;

  return (
    <div className="store-profile">
      <h2>{store.name}</h2>
      {store.description && <p className="muted">{store.description}</p>}

      <label className="toggle-row">
        <input type="checkbox" checked={isOpen} onChange={toggleOpen} />
        <span><strong>{isOpen ? "Store is open" : "Store is closed"}</strong> — {isOpen ? "customers can order" : "customers can't place new orders"}</span>
      </label>
      {error && <p className="error-text" role="alert">{error}</p>}

      <div className="stat-grid">
        <div className="stat"><strong>{stats.ordersToday}</strong>Orders today</div>
        <div className="stat"><strong>{formatMoney(stats.salesToday)}</strong>Sales today</div>
        <div className="stat"><strong>{stats.live}/{products.length}</strong>Products live</div>
        <div className="stat"><strong>{stats.customers}</strong>Customers</div>
      </div>

      <p><strong>Owner:</strong> {user?.displayName || "—"}{user?.email ? ` (${user.email})` : ""}</p>
      <p><strong>Area:</strong> {store.city || "Not provided"}</p>
      <p><strong>Phone:</strong> {store.phone || "Not provided"}</p>
      <p><strong>Orders delivered:</strong> {stats.delivered}</p>

      <button className="danger-btn" onClick={signOut}>Sign out</button>
    </div>
  );
};

export default StoreProfile;
