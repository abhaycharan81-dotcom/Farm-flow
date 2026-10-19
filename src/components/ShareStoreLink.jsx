import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenStore } from "../services/db";
import { storeLink } from "../utils/constants";

const ShareStoreLink = () => {
  const { user } = useAuth();
  const [store, setStore] = useState(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => listenStore(user.uid, setStore), [user.uid]);

  if (store === undefined) return <p className="muted">Loading…</p>;
  if (!store) return <div><h3>Share Store Link</h3><p className="muted">Create your store first to get a link.</p></div>;

  // This is the customer link. Preview is separate and never changes the seller's role.
  const link = storeLink(store.id);
  const message = `Fresh fruits & vegetables from ${store.name}. Order here: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { window.prompt("Copy your store link:", link); }
  };

  return (
    <div>
      <h3>Share Store Link</h3>
      <p>Customers can open this link and order straight from your store.</p>
      <input className="search-bar" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Store link" />
      <div className="row">
        <button className="submit-btn" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
        <a className="secondary-btn as-link" target="_blank" rel="noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}>Share on WhatsApp</a>
        <Link className="secondary-btn as-link" to={`/store/${store.id}?preview=1`}>Preview store</Link>
      </div>
      <p className="muted">Preview shows your store the way customers see it. You stay signed in as a seller.</p>
    </div>
  );
};

export default ShareStoreLink;