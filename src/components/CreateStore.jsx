import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listenStore, saveStore } from "../services/db";
import "../styles/CreateStore.css";

const CreateStore = ({ onNext }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", description: "", city: "", phone: "" });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the existing store so sellers can edit instead of starting over.
  useEffect(() => {
    let first = true;
    return listenStore(user.uid, (store) => {
      if (store && first) {
        setForm({ name: store.name || "", description: store.description || "", city: store.city || "", phone: store.phone || "" });
      }
      first = false;
    });
  }, [user.uid]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await saveStore(user.uid, {
        name: form.name.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
      });
      setStatus("Store saved.");
    } catch (err) {
      console.error(err);
      setStatus("Could not save the store. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="create-store-container">
      <h2>Create Your Store</h2>
      <form onSubmit={handleSubmit} className="create-store-form">
        <label htmlFor="storeName">Store Name</label>
        <input id="storeName" value={form.name} onChange={set("name")} placeholder="Enter your store name" maxLength={80} required />

        <label htmlFor="storeDescription">Store Description</label>
        <textarea id="storeDescription" value={form.description} onChange={set("description")} placeholder="Describe your store" rows="4" maxLength={400} required />

        <label htmlFor="storeCity">Area / City</label>
        <input id="storeCity" value={form.city} onChange={set("city")} placeholder="Where do you deliver? e.g. Andheri, Mumbai" required />

        <label htmlFor="storePhone">WhatsApp / Phone</label>
        <input id="storePhone" value={form.phone} onChange={set("phone")} placeholder="Customers contact you here" inputMode="tel" />

        <button type="submit" className="submit-btn" disabled={saving}>{saving ? "Saving…" : "Save Store"}</button>
        {status && <p className="status-text" role="status">{status}</p>}
        {status === "Store saved." && onNext && (
          <button type="button" className="secondary-btn" onClick={onNext}>Next: choose products</button>
        )}
      </form>
    </div>
  );
};

export default CreateStore;
