import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";
import logo from "../assets/logo.jpeg";
import "./Login.css";

const ResetPassword = () => {
  const [form, setForm] = useState({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      const response = await api.post("auth/reset-password", {
        email: form.email.trim(),
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage(response.data.message || "Password updated successfully.");
      setForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img className="login-logo" src={logo} alt="Sarada Systems Pvt. Ltd." />
        <h2 className="login-title">Reset Password</h2>
        <form className="login-form" onSubmit={submit}>
          <div className="form-group"><label>Email</label><input name="email" type="email" value={form.email} onChange={updateField} required /></div>
          <div className="form-group"><label>Current Password</label><input name="currentPassword" type="password" value={form.currentPassword} onChange={updateField} required /></div>
          <div className="form-group"><label>New Password</label><input name="newPassword" type="password" value={form.newPassword} onChange={updateField} required /></div>
          <div className="form-group"><label>Confirm New Password</label><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required /></div>
          <button className="login-button" type="submit" disabled={saving}>{saving ? "Updating..." : "Update Password"}</button>
        </form>
        {message && <p style={{ color: "#15803d", textAlign: "center" }}>{message}</p>}
        {error && <p style={{ color: "#dc2626", textAlign: "center" }}>{error}</p>}
        <div className="register-section"><Link className="register-button" to="/">Back to Login</Link></div>
      </div>
    </div>
  );
};

export default ResetPassword;
