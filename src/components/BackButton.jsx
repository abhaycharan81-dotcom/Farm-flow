export default function BackButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`back-button ${className}`}
      aria-label="Go back"
      onClick={onClick}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
        <path d="M20 12H9" />
      </svg>
    </button>
  );
}
