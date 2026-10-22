import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CartProvider, useCart } from "../context/CartContext";
import { listenStore } from "../services/db";
import "../styles/Common.css";
import "../styles/Dashboard.css";
import DiscoverStores from "../components/DiscoverStores";
import BrowseProducts from "../components/BrowseProducts";
import CartCheckout from "../components/CartCheckout";
import TrackOrder from "../components/TrackOrder";

const ProfileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const Avatar = ({ user }) => (
  <span className="avatar">
    {user?.photoURL
      ? <img className="avatar-img" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      : <ProfileIcon />}
  </span>
);

const UserBlock = ({ user }) => (
  <div className="user-block">
    <Avatar user={user} />
    <div className="user-text">
      <div className="user-name">{user?.displayName || "Signed in"}</div>
      {user?.email && <div className="user-email">{user.email}</div>}
    </div>
  </div>
);

function Inner({ initialStoreId }) {
  const [step, setStep] = useState(initialStoreId ? 2 : 1);
  const [store, setStore] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const openBtn = useRef(null);
  const closeBtn = useRef(null);
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Opened from a shared link: load that store straight away.
  useEffect(() => {
    if (!initialStoreId) return undefined;
    return listenStore(initialStoreId, setStore);
  }, [initialStoreId]);

  // Escape closes the menu, the page behind it stops scrolling, and focus moves in and back out.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const opener = openBtn.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [menuOpen]);

  const visit = (s) => { setStore(s); setStep(2); };

  const content = {
    1: <DiscoverStores onVisit={visit} />,
    2: <BrowseProducts store={store} restricted={Boolean(initialStoreId)} onDiscover={initialStoreId ? undefined : () => setStep(1)} onCart={() => setStep(3)} />,
    3: <CartCheckout store={store} onPlaced={() => setStep(4)} onBrowse={() => setStep(initialStoreId || store ? 2 : 1)} />,
    4: <TrackOrder storeId={initialStoreId} />,
  }[step];

  const items = initialStoreId
    ? [
        { step: 2, label: "Browse Products" },
        { step: 3, label: "Cart & Checkout", badge: count },
        { step: 4, label: "Track Order" },
      ]
    : [
        { step: 1, label: "Discover Stores" },
        { step: 2, label: "Browse Products" },
        { step: 3, label: "Cart & Checkout", badge: count },
        { step: 4, label: "Track Order" },
      ];
  const currentItem = items.find((item) => item.step === step);

  const goTo = (nextStep) => {
    setStep(nextStep);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    navigate(initialStoreId ? `/store/${initialStoreId}` : "/");
  };

  // Buttons with the .nav-item class: this is the markup the new Dashboard.css styles.
  const renderItems = () => (
    <ul>
      {items.map((it) => (
        <li key={it.step}>
          <button
            type="button"
            className={`nav-item${step === it.step ? " active" : ""}`}
            aria-current={step === it.step ? "page" : undefined}
            onClick={() => goTo(it.step)}
          >
            <span>{it.label}</span>
            {it.badge > 0 && <span className="nav-badge">{it.badge}</span>}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="dashboard-container theme-buyer">
      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="sidebar">
        <UserBlock user={user} />
        {renderItems()}
        {!initialStoreId && <button type="button" className="nav-item" onClick={() => navigate("/create-store")}>Create a store</button>}
        {user && <button type="button" className="link-btn" onClick={handleSignOut}>Sign out</button>}
      </aside>

      {/* Mobile top bar: current step + profile icon */}
      <header className="mobile-header">
        <h1 className="mobile-title">{currentItem.label}</h1>
        <button
          ref={openBtn}
          type="button"
          className="profile-icon-btn"
          aria-label={count > 0 ? `Open menu, ${count} in cart` : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Avatar user={user} />
          {count > 0 && <span className="alert-dot" aria-hidden="true" />}
        </button>
      </header>

      {/* Mobile slide-in menu */}
      <div className={`drawer-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <nav className={`drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen} aria-label="My account">
        <div className="drawer-head">
          <span>My Account</span>
          <button ref={closeBtn} type="button" className="drawer-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
        </div>
        <UserBlock user={user} />
        {renderItems()}
        {!initialStoreId && <button type="button" className="nav-item" onClick={() => { setMenuOpen(false); navigate("/create-store"); }}>Create a store</button>}
        {user && <button type="button" className="drawer-signout" onClick={handleSignOut}>Sign out</button>}
      </nav>

      <main className="main-content">
        <div className="step-content">{content}</div>
      </main>
    </div>
  );
}

const BuyerDashboard = ({ initialStoreId }) => (
  <CartProvider key={initialStoreId || "platform"} restrictedStoreId={initialStoreId}>
    <Inner initialStoreId={initialStoreId} />
  </CartProvider>
);

export default BuyerDashboard;
