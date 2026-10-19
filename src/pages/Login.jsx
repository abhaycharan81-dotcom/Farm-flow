import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, authErrorMessage } from "../context/AuthContext";
import "../styles/Common.css";
import "../styles/Login.css";

function CreateStoreEntry() {
  const navigate = useNavigate();
  const { user, role, loading, signInAs, switchRole } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const createStore = async () => {
    setBusy(true);
    setError("");
    try {
      if (user) {
        if (role !== "seller") await switchRole("seller");
      } else {
        await signInAs("seller");
      }
      navigate("/dashboard");
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Create your store</h1>
      <p className="muted">
        {user ? "Continue to store setup when you're ready." : "Sign in is only needed to create and manage your store."}
      </p>
      <div className="login-options">
        <button className="login-btn create-store" disabled={busy || loading} onClick={createStore}>
          {busy ? "Opening store setup…" : user ? role === "seller" ? "Open store dashboard" : "Continue as seller" : "Sign in to create a store"}
        </button>
        <button className="login-btn buy-fruits" onClick={() => navigate("/")}>Back to shopping</button>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}

export default CreateStoreEntry;
