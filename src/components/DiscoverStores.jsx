import React, { useState, useEffect } from "react";
import { listenStores } from "../services/db";
import "../styles/DiscoverStores.css";

const DiscoverStores = ({ onVisit }) => {
  const [stores, setStores] = useState(null); // null = loading
  const [area, setArea] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => listenStores((value, error) => {
    setStores(value);
    setLoadError(error ? "Stores are unavailable right now. Please try again later." : "");
  }), []);

  // Ignore half-created records without a name; list open stores before closed ones.
  const visible = (stores || [])
    .filter((s) => s.name && `${s.city || ""} ${s.name}`.toLowerCase().includes(area.toLowerCase()))
    .sort((a, b) => (a.open === false) - (b.open === false));

  return (
    <div className="discover-container">
      <h2>Discover Nearby Stores</h2>
      <input className="search-bar" placeholder="Filter by your area or city…" value={area}
        onChange={(e) => setArea(e.target.value)} aria-label="Filter stores by area" />

      {stores === null && <p className="muted">Loading stores…</p>}
      {loadError && <p className="error-text" role="alert">{loadError}</p>}
      {!loadError && stores && !visible.length && <p className="muted">No stores found{area ? " in that area" : " yet"}.</p>}

      <div className="store-list">
        {visible.map((store) => (
          <div key={store.id} className="store-card">
            <div className="store-banner">{store.name.charAt(0).toUpperCase()}</div>
            <div className="store-info">
              <h3 className="store-name">
                {store.name} {store.open === false && <span className="badge badge-cancelled">Closed</span>}
              </h3>
              {store.city && <p className="muted">{store.city}</p>}
              <p className="store-description">{store.description}</p>
              <button className="visit-btn" onClick={() => onVisit(store)}>Visit Store</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoverStores;
