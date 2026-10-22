import React, { useState, useEffect } from "react";
import { listenProducts } from "../services/db";
import { useCart } from "../context/CartContext";
import { emojiOf } from "../data/catalogue";
import { formatMoney, telLink } from "../utils/constants";

// preview: a seller looking at their own store. Same screen, but ordering is switched off.
const BrowseProducts = ({ store, onDiscover, onCart, preview = false, restricted = false }) => {
  const [products, setProducts] = useState(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const { add, items, count, total } = useCart();

  useEffect(() => {
    if (!store) return undefined;
    setProducts(null);
    return listenProducts(store.id, setProducts);
  }, [store?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!store) {
    return (
      <div>
        <h3>{restricted ? "Store unavailable" : "Browse Products"}</h3>
        <p className="muted">{restricted ? "This shared store link is unavailable. Check the link and try again." : "Pick a store first to see what's fresh today."}</p>
        {!restricted && <button className="submit-btn" onClick={onDiscover}>Discover stores</button>}
      </div>
    );
  }

  const closed = store.open === false;
  const q = query.trim().toLowerCase();

  // Hide anything the seller hasn't priced, switched on, or that's sold out.
  const buyable = (products || []).filter((p) => p.available && p.price > 0 && p.stock > 0);
  const shown = buyable.filter(
    (p) => (filter === "All" || p.category === filter) && p.name.toLowerCase().includes(q)
  );
  const inCart = (id) => items.find((i) => i.productId === id)?.qty || 0;

  return (
    <div>
      <h3>{store.name}</h3>
      <p className="muted">{store.description}</p>
      {store.phone && <p><a className="contact-link" href={telLink(store.phone)}>Call store</a></p>}
      {closed && <p className="notice" role="status">This store is closed right now. You can look around, but ordering is paused.</p>}

      <input type="search" className="search-bar" placeholder="Search products..." value={query}
        onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />

      <div className="filter-buttons">
        {["All", "Fruits", "Vegetables"].map((c) => (
          <button key={c} className={filter === c ? "active" : ""} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {products === null && <><div className="skeleton" /><div className="skeleton" /></>}
      {products && !shown.length && (
        <p className="muted">{q || filter !== "All" ? "Nothing matches your search." : "Nothing available here right now."}</p>
      )}

      <div className="product-grid">
        {shown.map((p) => (
          <div key={p.id} className="product-card">
            <span className="product-emoji" aria-hidden="true">{emojiOf(p.id, p.category)}</span>
            <strong>{p.name}</strong>
            <span>{formatMoney(p.price)} / {p.unit}</span>
            <span className="muted">{p.stock} {p.unit} left</span>
            <button className="submit-btn small" onClick={() => add(store, p)} disabled={preview || closed || inCart(p.id) >= p.stock}>
              {inCart(p.id) ? `Add more (${inCart(p.id)} in cart)` : "Add to cart"}
            </button>
          </div>
        ))}
      </div>

      {count > 0 && !preview && (
        <button className="cart-bar" onClick={onCart}>View cart · {count} item{count > 1 ? "s" : ""} · {formatMoney(total)}</button>
      )}
    </div>
  );
};

export default BrowseProducts;