import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import StorePage from "./pages/StorePage";
import "./styles/Common.css";

// Only lets the right role through; everyone else goes back to the public dashboard.
function Protected({ role, children }) {
  const { user, role: userRole, loading } = useAuth();
  if (loading) return <p className="page-message">Loading…</p>;
  if (!user || userRole !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BuyerDashboard />} />
          <Route path="/create-store" element={<Login />} />
          <Route path="/dashboard" element={<Protected role="seller"><SellerDashboard /></Protected>} />
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          {/* The unique link sellers share on WhatsApp / social media */}
          <Route path="/store/:storeId" element={<StorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
