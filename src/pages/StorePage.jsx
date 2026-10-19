import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth, authErrorMessage } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { listenStore } from "../services/db";
import BuyerDashboard from "./BuyerDashboard";
import BrowseProducts from "../components/BrowseProducts";
import "../styles/Common.css";
import "../styles/Dashboard.css";

// Landing spot for a shared store link. Google sign-in needs a tap (browsers block pop-ups
// that open on their own), so visitors who aren't signed in get one clear button.
//
// /store/:storeId            -> the link sellers share; customers sign in and order
// /store/:storeId?preview=1  -> the seller's own preview; no role change, ordering switched off
export default function StorePage() {
  const { storeId } = useParams();
  const [params] = useSearchParams();
  const { user, role, loading, signInAs, switchRole } = useAuth();
  const [store, setStore] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Shows the store's name on the sign-in screen when the database allows reading it.
  useEffect(() => listenStore(storeId, setStore), [storeId]);

  if (loading) return <p className="page-message">Opening store…</p>;

  // Only the store's own seller gets the preview. Anyone else with ?preview=1 falls through to the normal flow.
  const isPreview = params.get("preview") === "1" && user && role === "seller" && user.uid === storeId;
  if (isPreview) {
    return (
      <div className="theme-buyer preview-page">
        <div className="preview-banner" role="status">
          <span><strong>Preview</strong> — this is how customers see your store. Ordering is switched off.</span>
          <Link className="secondary-btn as-link" to="/dashboard?step=share">Back to dashboard</Link>
        </div>
        <div className="preview-card">
          {store ? (
            <CartProvider>
              <BrowseProducts store={store} preview />
            </CartProvider>
          ) : (
            <p className="muted">Loading your store… If it doesn't appear, finish Store Setup first.</p>
          )}
        </div>
      </div>
    );
  }

  if (user && role === "buyer") return <BuyerDashboard initialStoreId={storeId} />;

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      if (user) await switchRole("buyer"); // already signed in (e.g. as a seller): no pop-up needed
      else await signInAs("buyer");
    } catch (e) {
      console.error(e);
      setError(user ? "Could not open this store. Please try again." : authErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="page-message">
      <h2>{store?.name ? `Order from ${store.name}` : "Order fresh fruits & vegetables"}</h2>
      {store?.description && <p className="muted">{store.description}</p>}

      {user && role === "seller" ? (
        <p>You're signed in as a seller. Continue as a buyer to order from this store, or sign out first.</p>
      ) : (
        <p>{user ? "Continue to place your order." : "Sign in with Google to place your order."}</p>
      )}

      <button className="submit-btn" onClick={start} disabled={busy}>
        {user ? "Continue as buyer" : "Continue with Google"}
      </button>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}