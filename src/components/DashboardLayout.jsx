import { useEffect, useRef, useState } from "react";
import BackButton from "./BackButton";
import "../styles/Common.css";
import "../styles/Dashboard.css";

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

/*
 * Shared shell for the seller and buyer dashboards.
 *  - desktop: sidebar with every option
 *  - mobile: slim top bar (current step + profile icon); the icon opens a menu from the right
 *
 * items: [{ label, badge?: number, done?: boolean }]   step: 1-based index of the active item
 */
export default function DashboardLayout({
  theme, items, step, onSelect, onBack, onSignOut, user, menuTitle = "Menu", alertCount = 0, children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const openBtn = useRef(null);
  const closeBtn = useRef(null);

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

  const pick = (i) => {
    onSelect(i);
    setMenuOpen(false);
  };

  const renderItems = () => (
    <ul>
      {items.map((it, i) => (
        <li key={i}>
          <button
            type="button"
            className={`nav-item${step === i + 1 ? " active" : ""}`}
            aria-current={step === i + 1 ? "page" : undefined}
            onClick={() => pick(i)}
          >
            <span>
              {it.done && <span className="nav-check" aria-hidden="true">✓ </span>}
              {it.label}
            </span>
            {it.badge > 0 && <span className="nav-badge">{it.badge}</span>}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`dashboard-container theme-${theme}`}>
      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="sidebar">
        <UserBlock user={user} />
        {renderItems()}
        <button type="button" className="link-btn" onClick={onSignOut}>Sign out</button>
      </aside>

      {/* Mobile top bar */}
      <header className="mobile-header">
        {onBack && <BackButton className="mobile-back" onClick={onBack} />}
        <h1 className="mobile-title">{items[step - 1]?.label}</h1>
        <button
          ref={openBtn}
          type="button"
          className="profile-icon-btn"
          aria-label={alertCount > 0 ? `Open menu, ${alertCount} new` : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Avatar user={user} />
          {alertCount > 0 && <span className="alert-dot" aria-hidden="true" />}
        </button>
      </header>

      {/* Mobile slide-in menu */}
      <div className={`drawer-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <nav className={`drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen} aria-label={menuTitle}>
        <div className="drawer-head">
          <span>{menuTitle}</span>
          <button ref={closeBtn} type="button" className="drawer-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
        </div>
        <UserBlock user={user} />
        {renderItems()}
        <button type="button" className="drawer-signout" onClick={onSignOut}>Sign out</button>
      </nav>

      <main className="main-content">
        {onBack && (
          <div className="desktop-back-toolbar">
            <BackButton onClick={onBack} />
          </div>
        )}
        <div className="step-content">{children}</div>
      </main>
    </div>
  );
}
