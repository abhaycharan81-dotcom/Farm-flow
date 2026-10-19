import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { catalogue } from "../data/catalogue";
import { listenProducts, syncCatalogueSelection, listenStore } from "../services/db";
import "../styles/AddProducts.css";

const AddProducts = ({ onNext }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]); // catalogue ids
  const [saved, setSaved] = useState([]); // ids already stored in RTDB
  const [hasStore, setHasStore] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => listenStore(user.uid, (s) => setHasStore(!!s)), [user.uid]);

  // Pre-tick whatever the seller already stocks.
  useEffect(() => {
    let first = true;
    return listenProducts(user.uid, (products) => {
      const ids = products.map((p) => p.id);
      setSaved(ids);
      if (first) setSelected(ids);
      first = false;
    });
  }, [user.uid]);

  const filteredCatalogue = useMemo(
    () => catalogue.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filter === "All" || item.category === filter)),
    [searchTerm, filter]
  );

  const toggleProduct = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const handleSave = async () => {
    const toAdd = catalogue.filter((c) => selected.includes(c.id) && !saved.includes(c.id));
    const toRemove = saved.filter((id) => !selected.includes(id));
    setStatus("");
    setError("");
    if (!toAdd.length && !toRemove.length) return setStatus("No changes to save.");

    // Removing a product also deletes its price and stock, so ask first.
    if (toRemove.length) {
      const names = toRemove.map((id) => catalogue.find((c) => c.id === id)?.name || id).join(", ");
      if (!window.confirm(`Remove ${names}? Their prices and stock will be deleted.`)) return;
    }

    try {
      await syncCatalogueSelection(user.uid, toAdd, toRemove);
      setStatus(`Saved. ${toAdd.length} added, ${toRemove.length} removed.`);
    } catch (err) {
      console.error(err);
      setError("Could not save products. Create your store first, then try again.");
    }
  };

  return (
    <div className="add-products-container">
      <h2>Add Products</h2>
      {!hasStore && <p className="error-text">Create your store in Store Setup before adding products.</p>}

      <input type="text" placeholder="Search catalogue..." value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} className="search-bar" aria-label="Search catalogue" />

      <div className="filter-buttons">
        {["All", "Fruits", "Vegetables"].map((cat) => (
          <button key={cat} className={filter === cat ? "active" : ""} onClick={() => setFilter(cat)}>{cat}</button>
        ))}
      </div>

      <ul className="product-list">
        {filteredCatalogue.map((item) => (
          <li key={item.id} className="product-item">
            <label>
              <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleProduct(item.id)} />
              <span className="emoji" aria-hidden="true"> {item.emoji} </span>
              {item.name} <span className="category-tag">({item.category})</span>
            </label>
          </li>
        ))}
        {!filteredCatalogue.length && <li className="muted">No products match your search.</li>}
      </ul>

      <button className="submit-btn" onClick={handleSave} disabled={!hasStore}>
        Save products ({selected.length} selected)
      </button>
      {status && <p className="status-text" role="status">{status}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      {saved.length > 0 && onNext && (
        <button className="secondary-btn" onClick={onNext}>Next: set prices and stock</button>
      )}
    </div>
  );
};

export default AddProducts;
