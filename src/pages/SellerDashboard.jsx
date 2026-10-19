import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenStore, listenProducts, listenStoreOrders } from "../services/db";
import DashboardLayout from "../components/DashboardLayout";
import CreateStore from "../components/CreateStore";
import AddProducts from "../components/AddProducts";
import PricingInventory from "../components/PricingInventory";
import ShareStoreLink from "../components/ShareStoreLink";
import SellerOrders from "../components/SellerOrders";
import Customers from "../components/Customers";
import StoreProfile from "../components/StoreProfile";

// `key` is what appears in the address bar (?step=orders), so refresh and the phone's
// back button keep the seller on the right screen.
const STEPS = [
  { key: "setup", label: "Store Setup", Component: CreateStore },
  { key: "products", label: "Products", Component: AddProducts },
  { key: "pricing", label: "Pricing & Inventory", Component: PricingInventory },
  { key: "share", label: "Share Store Link", Component: ShareStoreLink },
  { key: "orders", label: "Orders", Component: SellerOrders },
  { key: "customers", label: "Customers", Component: Customers },
  { key: "profile", label: "Store Profile", Component: StoreProfile },
];

const SellerDashboard = () => {
  const { user, role, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [store, setStore] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Live data for the setup ticks and the "new orders" badge.
  useEffect(() => {
    if (!user?.uid || role !== "seller") return undefined;
    const offs = [
      listenStore(user.uid, setStore),
      listenProducts(user.uid, setProducts),
      listenStoreOrders(user.uid, setOrders),
    ];
    return () => offs.forEach((off) => off());
  }, [user?.uid, role]);

  if (loading) return <p className="page-message">Loading…</p>;
  if (!user || !role) return <Navigate to="/" replace />;
  if (role === "buyer") return <Navigate to="/buyer-dashboard" replace />;

  const index = Math.max(0, STEPS.findIndex((s) => s.key === params.get("step")));
  const step = index + 1;
  const { Component } = STEPS[index];

  const goTo = (i) => setParams({ step: STEPS[i].key });
  const onNext = () => goTo(Math.min(index + 1, STEPS.length - 1));

  const newOrders = orders.filter((o) => o.status === "Placed").length;
  const liveProducts = products.filter((p) => p.available && p.price > 0 && p.stock > 0).length;

  const items = [
    { label: STEPS[0].label, done: !!store },
    { label: STEPS[1].label, done: products.length > 0 },
    { label: STEPS[2].label, done: liveProducts > 0 },
    { label: STEPS[3].label },
    { label: STEPS[4].label, badge: newOrders },
    { label: STEPS[5].label },
    { label: STEPS[6].label },
  ];

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <DashboardLayout
      theme="seller"
      items={items}
      step={step}
      onSelect={goTo}
      onSignOut={handleSignOut}
      user={user}
      menuTitle="Store menu"
      alertCount={newOrders}
    >
      <Component onNext={onNext} />
    </DashboardLayout>
  );
};

export default SellerDashboard;
