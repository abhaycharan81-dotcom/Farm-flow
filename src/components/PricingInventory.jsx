import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listenProducts, saveProductEdits } from "../services/db";
import { formatMoney } from "../utils/constants";

const LOW_STOCK = 5;
const badNumber = (v) => v === "" || !Number.isFinite(Number(v)) || Number(v) < 0;

const PricingInventory = ({ onNext }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState(null);
  const [edits, setEdits] = useState({}); // unsaved changes only, and only the fields that were touched
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => listenProducts(user.uid, setProducts), [user.uid]);

  const value = (p, field) => edits[p.id]?.[field] ?? p[field];
  const invalid = (p, field) => field in (edits[p.id] || {}) && badNumber(edits[p.id][field]);

  const change = (p, field, v) => {
    setStatus("");
    setError("");
    setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], [field]: v } }));
  };

  const editCount = Object.keys(edits).length;

  const save = async () => {
    const hasBad = Object.values(edits).some(
      (e) => ("price" in e && badNumber(e.price)) || ("stock" in e && badNumber(e.stock))
    );
    if (hasBad) return setError("Price and stock must be numbers, 0 or more.");

    setSaving(true);
    try {
      await saveProductEdits(user.uid, edits);
      setEdits({});
      setStatus("Prices and stock saved.");
    } catch (err) {
      console.error(err);
      setError("Could not save changes. Please try again.");
    }
    setSaving(false);
  };

  // Tells the seller why an item is (or isn't) visible to customers.
  const rowState = (p) => {
    if (!value(p, "available")) return { text: "Hidden", cls: "" };
    if (!(Number(value(p, "price")) > 0)) return { text: "Needs a price", cls: "badge-low" };
    const stock = Number(value(p, "stock"));
    if (!(stock > 0)) return { text: "Out of stock", cls: "badge-cancelled" };
    if (stock <= LOW_STOCK) return { text: "Low stock", cls: "badge-low" };
    return { text: "Live", cls: "badge-delivered" };
  };

  if (products === null) return <div><h3>Pricing & Inventory</h3><div className="skeleton" /></div>;
  if (!products.length) return <div><h3>Pricing & Inventory</h3><p className="muted">Add products first, then set their prices and stock here.</p></div>;

  return (
    <div>
      <h3>Pricing & Inventory</h3>
      <p className="muted">Items only appear in your store when they're marked available, priced above ₹0 and in stock.</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Product</th><th>Price (₹ per unit)</th><th>Stock</th><th>Available</th><th>Status</th></tr></thead>
          <tbody>
            {products.map((p) => {
              const state = rowState(p);
              return (
                <tr key={p.id} className={edits[p.id] ? "row-dirty" : ""}>
                  <td>{p.name} <span className="category-tag">per {p.unit}</span></td>
                  <td>
                    <input type="number" min="0" step="0.5" inputMode="decimal" value={value(p, "price")}
                      onChange={(e) => change(p, "price", e.target.value)}
                      aria-invalid={invalid(p, "price")} aria-label={`${p.name} price`} />
                  </td>
                  <td>
                    <input type="number" min="0" step={p.unit === "kg" ? "0.5" : "1"} inputMode="decimal" value={value(p, "stock")}
                      onChange={(e) => change(p, "stock", e.target.value)}
                      aria-invalid={invalid(p, "stock")} aria-label={`${p.name} stock`} />
                  </td>
                  <td><input type="checkbox" checked={!!value(p, "available")} onChange={(e) => change(p, "available", e.target.checked)} aria-label={`${p.name} available`} /></td>
                  <td><span className={`badge ${state.cls}`}>{state.text}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row">
        <button className="submit-btn" onClick={save} disabled={!editCount || saving}>
          {saving ? "Saving…" : editCount ? `Save changes (${editCount})` : "Save changes"}
        </button>
        {editCount > 0 && (
          <button className="secondary-btn as-link" onClick={() => { setEdits({}); setError(""); }}>Discard</button>
        )}
      </div>
      {status && <p className="status-text" role="status">{status}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      <p className="muted">Example: {formatMoney(40)} per kg</p>
      {onNext && <button className="secondary-btn" onClick={onNext}>Next: share your store</button>}
    </div>
  );
};

export default PricingInventory;
