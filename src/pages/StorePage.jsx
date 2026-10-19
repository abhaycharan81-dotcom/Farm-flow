import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  const { user, role, loading } = useAuth();
  const [store, setStore] = useState(null);

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

  return <BuyerDashboard initialStoreId={storeId} />;
}