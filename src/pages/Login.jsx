import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, authErrorMessage } from "../context/AuthContext";
import "../styles/Common.css";
import "../styles/Login.css";

const HOME = { seller: "/dashboard", buyer: "/buyer-dashboard" };

function Login() {
  const navigate = useNavigate();
  const { user, role, loading, signInAs } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in? Skip the choice and go straight to the right dashboard.
  useEffect(() => {
    if (!loading && user && HOME[role]) navigate(HOME[role], { replace: true });
  }, [loading, user, role, navigate]);

  const choose = async (nextRole) => {
    setBusy(true);
    setError("");
    try {
      await signInAs(nextRole);
      navigate(HOME[nextRole]);
    } catch (e) {
      setError(authErrorMessage(e)); // "" when the person just closed the Google window
      setBusy(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Welcome</h1>
      <div className="login-options">
        <button className="login-btn create-store" disabled={busy || loading} onClick={() => choose("seller")}>
          Create Store
        </button>
        <button className="login-btn buy-fruits" disabled={busy || loading} onClick={() => choose("buyer")}>
          Buy Fruits & Vegetables
        </button>
      </div>
      <p className="muted"></p>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}

export default Login;
