import { useMemo, useState } from "react";
import api from "../api/api.js";

export default function SelectedOperatorActions({ selectedOperators = [], onClearSelection, canManage = false }) {
  const [pendingAction, setPendingAction] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const deviceIds = useMemo(() => [...new Set(selectedOperators.flatMap((operator) => operator.deviceIds || []))], [selectedOperators]);
  if (!canManage) return null;

  const openAction = (action) => {
    if (!deviceIds.length) return;
    setPendingAction(action);
    setReason("");
    setError("");
  };

  const updateSelectedDevices = async () => {
    if (!reason.trim()) {
      setError(`Please enter a reason for ${pendingAction}ing the selected devices.`);
      return;
    }
    try {
      setBusy(true);
      setError("");
      const response = await api.patch("devices/lock-status/bulk", {
        deviceIds,
        lock: pendingAction === "lock",
        reason: reason.trim()
      });
      alert(`${response.data.data?.updatedCount || deviceIds.length} device(s) ${pendingAction}ed successfully.`);
      setPendingAction("");
      onClearSelection?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update the selected devices.");
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) {
      setError("Please enter a message.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      const results = await Promise.allSettled(deviceIds.map((deviceId) => api.post(`devices/${deviceId}/sendMessage`, {
        deviceId,
        message: text,
        messageType: "text",
        caption: ""
      })));
      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed) {
        setError(`Message was sent to ${deviceIds.length - failed} device(s), but failed for ${failed}.`);
        return;
      }
      alert(`Message sent to ${deviceIds.length} device(s).`);
      setPendingAction("");
      onClearSelection?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send the message.");
    } finally {
      setBusy(false);
    }
  };

  const selectedCount = selectedOperators.length;
  return <>
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontWeight: 600, color: "#334155" }}>{selectedCount} selected</span>
      <button type="button" disabled={!deviceIds.length} onClick={() => openAction("lock")} style={{ padding: "8px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 5 }}>🔒 Lock Selected</button>
      <button type="button" disabled={!deviceIds.length} onClick={() => openAction("unlock")} style={{ padding: "8px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 5 }}>🔓 Unlock Selected</button>
      <button type="button" disabled={!deviceIds.length} onClick={() => { setPendingAction("message"); setMessage(""); setError(""); }} style={{ padding: "8px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 5 }}>💬 Message Selected</button>
    </div>

    {pendingAction && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 10, width: 440, maxWidth: "92%" }}>
        <h3 style={{ marginTop: 0 }}>{pendingAction === "message" ? "Message Selected Devices" : `${pendingAction === "lock" ? "Lock" : "Unlock"} Selected Devices`}</h3>
        <p style={{ color: "#475569" }}>{selectedCount} operator(s), {deviceIds.length} device(s)</p>
        {pendingAction === "message" ? <textarea autoFocus value={message} onChange={(event) => { setMessage(event.target.value); setError(""); }} rows="4" maxLength="500" placeholder="Type a message for the selected devices" style={{ width: "100%", boxSizing: "border-box", padding: 10 }} /> : <textarea autoFocus value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} rows="4" maxLength="500" placeholder={`Reason for ${pendingAction}ing selected devices`} style={{ width: "100%", boxSizing: "border-box", padding: 10 }} />}
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button type="button" disabled={busy} onClick={() => setPendingAction("")}>Cancel</button>
          <button type="button" disabled={busy || (pendingAction === "message" ? !message.trim() : !reason.trim())} onClick={pendingAction === "message" ? sendMessage : updateSelectedDevices} style={{ padding: "8px 16px", border: "none", borderRadius: 5, color: "#fff", background: pendingAction === "lock" ? "#dc2626" : pendingAction === "unlock" ? "#16a34a" : "#2563eb" }}>{busy ? "Please wait..." : pendingAction === "message" ? "Send" : pendingAction === "lock" ? "Lock" : "Unlock"}</button>
        </div>
      </div>
    </div>}
  </>;
}
