import React, { useEffect, useMemo, useState } from "react";
import api from '../api/api.js';
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.jpeg';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const navigate = useNavigate();
  const user = sessionStorage.getItem("user");
  const role = JSON.parse(user).role
  const [showAddCoordinator, setShowAddCoordinator] = useState(false);
  const [coordinatorForm, setCoordinatorForm] = useState({
    name: "",
    email: "",
    password: "",
    districtName: "",
  });
  const [savingCoordinator, setSavingCoordinator] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [messageDevice, setMessageDevice] = useState(null);
  const [deviceMessage, setDeviceMessage] = useState("");
  const [messageIsImage, setMessageIsImage] = useState(false);
  const [imageFileName, setImageFileName] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [keyDevice, setKeyDevice] = useState(null);
  const [keyType, setKeyType] = useState("unlock");
  const [dynamicKey, setDynamicKey] = useState("");
  const [sendingKey, setSendingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const openMessageModal = (device) => {
    setMessageDevice(device);
    setDeviceMessage("");
    setMessageIsImage(false);
    setImageFileName("");
    setImageCaption("");
    setMessageError("");
  };

  const closeMessageModal = (force = false) => {
    if (force || !sendingMessage) {
      setMessageDevice(null);
      setDeviceMessage("");
      setMessageIsImage(false);
      setImageFileName("");
      setImageCaption("");
      setMessageError("");
    }
  };

  const selectMessageImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessageError("Please select an image file.");
      return;
    }

    // The API keeps this message in memory. Keep the payload small enough for
    // polling responses and for the Windows app to load reliably.
    if (file.size > 5 * 1024 * 1024) {
      setMessageError("Image must be 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDeviceMessage(String(reader.result));
      setImageFileName(file.name);
      setMessageError("");
    };
    reader.onerror = () => setMessageError("Could not read the selected image.");
    reader.readAsDataURL(file);
  };

  const sendDeviceMessage = async () => {
    const message = deviceMessage.trim();

    if (!messageDevice || !message) {
      setMessageError("Please enter a message.");
      return;
    }

    try {
      setSendingMessage(true);
      setMessageError("");

      await api.post(`devices/${messageDevice.deviceId}/sendMessage`, {
        message,
        deviceId: messageDevice.deviceId,
        messageType: messageIsImage ? "image" : "text",
        caption: messageIsImage ? imageCaption.trim() : "",
      });

      closeMessageModal(true);
      alert("Message sent successfully.");
    } catch (error) {
      console.error("Send device message error:", error);
      setMessageError(
        error.response?.data?.message || "Unable to send the message."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const openKeyModal = (device, type) => {
    setKeyDevice(device);
    setKeyType(type);
    setDynamicKey("");
    setKeyError("");
  };

  const closeKeyModal = (force = false) => {
    if (force || !sendingKey) {
      setKeyDevice(null);
      setDynamicKey("");
      setKeyError("");
    }
  };

  const sendDynamicKey = async () => {
    const unlockId = dynamicKey.trim();

    if (!keyDevice || !/^\d{4,20}$/.test(unlockId)) {
      setKeyError("Enter a numeric key from 4 to 20 digits.");
      return;
    }

    try {
      setSendingKey(true);
      setKeyError("");
      const endpoint = keyType === "uninstall" ? "sendUnInstallKey" : "sendUnlockKey";

      await api.post(`devices/${keyDevice.deviceId}/${endpoint}`, { unlockId });

      closeKeyModal(true);
      alert(`${keyType === "uninstall" ? "Uninstall" : "Unlock"} key sent successfully.`);
    } catch (error) {
      console.error("Send dynamic key error:", error);
      setKeyError(error.response?.data?.message || "Unable to send the key.");
    } finally {
      setSendingKey(false);
    }
  };

  const openReportList = async () => {
    setShowReports(true);
    setReportsLoading(true);
    setReportsError("");

    try {
      const response = await api.get("devices/reports");
      setReports(response.data.data || []);
    } catch (error) {
      console.error("Fetch reports error:", error);
      setReportsError(error.response?.data?.message || "Unable to load uploaded reports.");
    } finally {
      setReportsLoading(false);
    }
  };

  const formatFileSize = (size) => {
    if (!Number.isFinite(size)) return "-";
    return size < 1024 * 1024
      ? `${Math.ceil(size / 1024)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fetchCoordinators = async () => {
    try {
      const res = await api.get('auth/users/dist-coordinators');
      setCoordinators(res.data.data || []);
    } catch (error) {
      console.error("Fetch coordinators error:", error);
    }
  };

  const handleCoordinatorFormChange = (e) => {
    const { name, value } = e.target;
    setCoordinatorForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddCoordinatorModal = () => {
    setCoordinatorForm({ name: "", email: "", password: "", districtName: "" });
    setShowAddCoordinator(true);
    setShowDropdown(false); // close the admin dropdown when modal opens
  };

  const closeAddCoordinatorModal = () => {
    setShowAddCoordinator(false);
  };

  const handleAddCoordinator = async () => {
    const { name, email, password, districtName } = coordinatorForm;

    if (!name || !email || !password ) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSavingCoordinator(true);

      await api.post('auth/users/dist-coordinator', coordinatorForm);

      alert("District Coordinator added successfully");
      closeAddCoordinatorModal();
    } catch (error) {
      console.error("Add dist coordinator error:", error);
      alert(
        error.response?.data?.message || "Unable to add district coordinator"
      );
    } finally {
      setSavingCoordinator(false);
    }
  };

  // Edit modal state
  const [editingDevice, setEditingDevice] = useState(null); // holds the device being edited
  const [editForm, setEditForm] = useState({
    stationId: "",
    operatorId: "",
    operatorName: "",
    distCoordinatorName: "",
    districtName: "",
    block: "",
    coordinatorEmail: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await api.get('devices');
      setDevices(res.data.data || []);
    } catch (error) {
      console.error("Fetch devices error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    if (api.defaults?.headers?.common?.Authorization) {
      delete api.defaults.headers.common.Authorization;
    }

    navigate("/");
  };
  const handleCoordinatorSelect = (e) => {
    const selectedEmail = e.target.value;

    const selectedCoordinator = coordinators.find(
      (c) => c.email === selectedEmail
    );

    setEditForm((prev) => ({
      ...prev,
      coordinatorEmail: selectedEmail,
      distCoordinatorName: selectedCoordinator?.name || "",
      districtName: selectedCoordinator?.districtName || prev.districtName,
    }));
  };
  useEffect(() => {
    fetchDevices();
    fetchCoordinators();
  }, []);

  const handleToggle = async (device) => {
    try {
      setUpdatingId(device._id);

      const newLockStatus = !device.lock;

      const response = await api.patch(
        `devices/${device.deviceId}/status`,
        { lock: newLockStatus }
      );

      const result = response.data;

      setDevices((prevDevices) =>
        prevDevices.map((item) =>
          item._id === device._id
            ? { ...item, lock: newLockStatus }
            : item
        )
      );

      console.log("Device updated:", result);
    } catch (error) {
      console.error("Update device error:", error);
      alert("Unable to update device lock status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Open edit modal, pre-fill form with existing values
  const openEditModal = (device) => {
    setEditingDevice(device);
    setEditForm({
      stationId: device.stationId || "",
      operatorId: device.operatorId || "",
      operatorName: device.operatorName || "",
      distCoordinatorName: device.distCoordinatorName || "",
      districtName: device.districtName || "",
      block: device.block || "",
      coordinatorEmail: device.coordinatorEmail || "", // NEW
    });
  };

  const closeEditModal = () => {
    setEditingDevice(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    if (!editingDevice) return;

    try {
      setSavingEdit(true);

      const response = await api.patch(
        `devices/${editingDevice.deviceId}`,
        editForm
      );

      const result = response.data;

      setDevices((prevDevices) =>
        prevDevices.map((item) =>
          item._id === editingDevice._id
            ? { ...item, ...editForm }
            : item
        )
      );

      console.log("Device details updated:", result);
      closeEditModal();
    } catch (error) {
      console.error("Update device details error:", error);
      alert("Unable to update device details");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredDevices = useMemo(() => {
    const searchValue = search.toLowerCase();

    return devices.filter((device) => {
      return (
        device.laptopName?.toLowerCase().includes(searchValue) ||
        device.deviceId?.toLowerCase().includes(searchValue) ||
        device.userName?.toLowerCase().includes(searchValue) ||
        device.stationId?.toLowerCase().includes(searchValue) ||
        device.status?.toLowerCase().includes(searchValue) ||
        device.operatorName?.toLowerCase().includes(searchValue) ||
        device.districtName?.toLowerCase().includes(searchValue) ||
        device.block?.toLowerCase().includes(searchValue)
      );
    });
  }, [devices, search]);

  const totalDevices = devices.length;

  const lockedDevices = devices.filter((device) => device.lock === true).length;
  const unlockedDevices = devices.filter((device) => device.lock !== true).length;
  const onlineDevices = devices.filter(
    (device) => device.connectionStatus === "online"
  ).length;

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
  };

  return (
    <div className="dashboard">

      {/* Header */}
      <div
        className="dashboard-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={logo}
            alt="Sarada Systems Pvt. Ltd."
            style={{ height: "80px", width: "200px" }}
          />
        </div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <h1>Device Dashboard</h1>
          <p>Manage and monitor registered laptops</p>
        </div>

        <div className="admin-menu" style={{ position: "relative" }}>
          <div
            className="admin"
            onClick={() => setShowDropdown((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            Menu ▾
          </div>

          {showDropdown && (
            <div
              className="admin-dropdown"
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                minWidth: "140px",
                zIndex: 10,
              }}
            >
              <button
                onClick={openAddCoordinatorModal}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  display: role =='distCoordinator' ? 'none' :'block'
                }}
              >
                ➕ Add Dist Coordinator
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Statistics */}
      <div className="stats">
        <div className="stat-card">
          <span>Total Devices</span>
          <strong>{totalDevices}</strong>
        </div>
        <div className="stat-card locked">
          <span>Locked</span>
          <strong>{lockedDevices}</strong>
        </div>
        <div className="stat-card unlocked">
          <span>Unlocked</span>
          <strong>{unlockedDevices}</strong>
        </div>
        <div className="stat-card online">
          <span>Online</span>
          <strong>{onlineDevices}</strong>
        </div>
      </div>


      {/* Device List */}
      <div className="device-container">
        <div className="device-toolbar">
          <input
            type="text"
            placeholder="Search laptop, device ID, user, operator, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={openReportList}>Report List</button>
          <button onClick={fetchDevices}>Refresh</button>
        </div>

        {loading ? (
          <div className="loading">Loading devices...</div>
        ) : (
          <div className="device-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Computer Name</th>
                <th>Station ID</th>
                <th>Last Seen</th>
                {/* <th>Device ID</th> */}
                {/* <th>User</th> */}
                <th>Lock Action</th>
                <th>Lock Status</th>
                <th>Operator ID</th>
                <th>Operator Name</th>
                <th>Dist. Coordinator</th>
                <th>District Name</th>
                <th>Block</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    No devices found
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device._id}>
                    <td>
                      <div className="device-name">
                        <span
                          className={`connection-status-dot ${device.connectionStatus === "online" ? "online" : "offline"}`}
                          title={device.connectionStatus === "online" ? "Online" : "Offline"}
                          aria-label={device.connectionStatus === "online" ? "Online" : "Offline"}
                        ></span>
                        💻 {device.laptopName || "Unknown"}
                      </div>
                    </td>

                    <td>{device.stationId || "-"}</td>

                    <td>{formatLastSeen(device.lastSeen)}</td>

                    {/* <td>
                      <span className="device-id">{device.deviceId}</span>
                    </td> */}

                    {/* <td>{device.userName || "-"}</td> */}

                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className={`toggle ${device.lock === true ? "active" : ""
                            }`}
                          disabled={updatingId === device._id}
                          onClick={() => handleToggle(device)}
                          title={device.lock ? "Unlock device" : "Lock device"}
                        >
                          <span></span>
                        </button>


                      </div>
                    </td>
                    <td>
                      {device.lock === true ? (
                        <span className="status locked">🔒 Locked</span>
                      ) : (
                        <span className="status unlocked">🔓 Unlocked</span>
                      )}
                    </td>
                    <td>{device.operatorId || "-"}</td>
                    <td>{device.operatorName || "-"}</td>
                    <td>{device.distCoordinatorName || "-"}</td>
                    <td>{device.districtName || "-"}</td>
                    <td>{device.block || "-"}</td>

                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => openMessageModal(device)}
                          title="Send information message to this device"
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#2563eb",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          💬 Send Message
                        </button>
{/* 
                        <button
                          onClick={() => openKeyModal(device, "unlock")}
                          title="Send a temporary unlock key to this device"
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", cursor: "pointer" }}
                        >
                          🔑 Send Unlock Key
                        </button>

                        <button
                          onClick={() => openKeyModal(device, "uninstall")}
                          title="Send a temporary uninstall key to this device"
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#b45309", color: "#fff", cursor: "pointer" }}
                        >
                          🗑️ Send Uninstall Key
                        </button> */}

                        {role !== 'distCoordinator' && (
                        <button
                          className="edit-btn"
                          onClick={() => openEditModal(device)}
                          title="Edit operator/district details"
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            background: "#f5f5f5",
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Edit
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showReports && (
        <div
          className="modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={() => setShowReports(false)}
        >
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "900px", maxWidth: "95%", maxHeight: "85vh", overflow: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ marginTop: 0 }}>Uploaded Reports</h2>
              <button onClick={() => setShowReports(false)}>Close</button>
            </div>

            {reportsLoading ? <p>Loading reports...</p> : reportsError ? (
              <p style={{ color: "#d93025" }}>{reportsError}</p>
            ) : reports.length === 0 ? <p>No uploaded reports found.</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Computer Name</th><th>File Name</th><th>Size</th><th>Uploaded</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id}>
                      <td>{report.laptopName}</td>
                      <td>{report.fileName}</td>
                      <td>{formatFileSize(report.size)}</td>
                      <td>{new Date(report.createdAt).toLocaleString()}</td>
                      <td>{report.downloadUrl ? <a href={report.downloadUrl} target="_blank" rel="noreferrer">Download</a> : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {messageDevice && (
        <div
          className="modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={closeMessageModal}
        >
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "440px", maxWidth: "90%" }}
          >
            <h2 style={{ marginTop: 0 }}>
              Send Message — {messageDevice.operatorName || "Unknown operator"} - {messageDevice.operatorId || "No operator ID"}
            </h2>
            <label style={{ display: "block" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="checkbox"
                  checked={messageIsImage}
                  onChange={(event) => {
                    setMessageIsImage(event.target.checked);
                    setDeviceMessage("");
                    setImageFileName("");
                    setImageCaption("");
                    setMessageError("");
                  }}
                  disabled={sendingMessage}
                />
                Send image
              </span>
              {messageIsImage ? (
                <>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={selectMessageImage}
                    disabled={sendingMessage}
                    style={{ width: "100%", boxSizing: "border-box", marginTop: "6px", padding: "10px" }}
                    autoFocus
                  />
                  <small style={{ display: "block", marginTop: "8px", color: "#4b5563" }}>
                    {imageFileName ? `Selected: ${imageFileName}` : "PNG, JPG, GIF, or WebP — maximum 5 MB"}
                  </small>
                  <textarea
                    value={imageCaption}
                    onChange={(event) => setImageCaption(event.target.value)}
                    placeholder="Optional text to show above the image"
                    rows="3"
                    maxLength="500"
                    disabled={sendingMessage}
                    style={{ width: "100%", boxSizing: "border-box", marginTop: "12px", padding: "10px", resize: "vertical" }}
                  />
                </>
              ) : (
                <textarea
                  value={deviceMessage}
                  onChange={(event) => setDeviceMessage(event.target.value)}
                  placeholder="Type the information message to show on this device"
                  rows="5"
                  maxLength="500"
                  disabled={sendingMessage}
                  style={{ width: "100%", boxSizing: "border-box", marginTop: "6px", padding: "10px", resize: "vertical" }}
                  autoFocus
                />
              )}
            </label>
            {messageError && <p style={{ color: "#d93025", marginBottom: 0 }}>{messageError}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={closeMessageModal} disabled={sendingMessage}>Cancel</button>
              <button
                onClick={sendDeviceMessage}
                disabled={sendingMessage || !deviceMessage.trim()}
                style={{ padding: "8px 16px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#fff", cursor: "pointer" }}
              >
                {sendingMessage ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {keyDevice && (
        <div
          className="modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={closeKeyModal}
        >
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "400px", maxWidth: "90%" }}
          >
            <h2 style={{ marginTop: 0 }}>
              Send {keyType === "uninstall" ? "Uninstall" : "Unlock"} Key — {keyDevice.laptopName || keyDevice.deviceId}
            </h2>
            <label style={{ display: "block" }}>
              Numeric key
              <input
                type="password"
                inputMode="numeric"
                value={dynamicKey}
                onChange={(event) => setDynamicKey(event.target.value.replace(/\D/g, ""))}
                placeholder="4 to 20 digits"
                maxLength="20"
                disabled={sendingKey}
                autoFocus
                style={{ width: "100%", boxSizing: "border-box", marginTop: "6px", padding: "10px" }}
              />
            </label>
            {keyError && <p style={{ color: "#d93025", marginBottom: 0 }}>{keyError}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={closeKeyModal} disabled={sendingKey}>Cancel</button>
              <button
                onClick={sendDynamicKey}
                disabled={sendingKey || !dynamicKey.trim()}
                style={{ padding: "8px 16px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#fff", cursor: "pointer" }}
              >
                {sendingKey ? "Sending..." : "Send Key"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit Modal */}
      {editingDevice && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={closeEditModal}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "24px",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Edit Details — {editingDevice.laptopName || editingDevice.deviceId}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label>
                Station ID
                <input
                  type="text"
                  name="stationId"
                  value={editForm.stationId}
                  onChange={handleEditFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>

              <label>
                Operator ID
                <input
                  type="text"
                  name="operatorId"
                  value={editForm.operatorId}
                  onChange={handleEditFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>

              <label>
                Operator Name
                <input
                  type="text"
                  name="operatorName"
                  value={editForm.operatorName}
                  onChange={handleEditFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>

              <label>
                District Coordinator (select by email)
                <select
                  name="coordinatorEmail"
                  value={editForm.coordinatorEmail}
                  onChange={handleCoordinatorSelect}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                >
                  <option value="">-- Select coordinator --</option>
                  {coordinators.map((c) => (
                    <option key={c._id} value={c.email}>
                      {c.email} {c.name ? `(${c.name})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {/* Auto-filled, shown read-only for confirmation */}
              <label>
                District Coordinator Name
                <input
                  type="text"
                  name="distCoordinatorName"
                  value={editForm.distCoordinatorName}
                  readOnly
                  style={{ width: "100%", padding: "8px", marginTop: "4px", background: "#f5f5f5" }}
                />
              </label>

              <label>
                District Name
                <input
                  type="text"
                  name="districtName"
                  value={editForm.districtName}
                  onChange={handleEditFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>

              <label>
                Block
                <input
                  type="text"
                  name="block"
                  value={editForm.block}
                  onChange={handleEditFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={closeEditModal}
                disabled={savingEdit}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleEditSave}
                disabled={savingEdit}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}


      {showAddCoordinator && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
          }}
          onClick={closeAddCoordinatorModal}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "400px", maxWidth: "90%" }}
          >
            <h2 style={{ marginTop: 0 }}>Add District Coordinator</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  value={coordinatorForm.name}
                  onChange={handleCoordinatorFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={coordinatorForm.email}
                  onChange={handleCoordinatorFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>

              <label>
                Password
                <input
                  type="text"
                  name="password"
                  value={coordinatorForm.password}
                  onChange={handleCoordinatorFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>

              <label
               style={{ display:'none'}}
              >
                District Name1
                <input
                  type="text"
                  name="districtName"
                  value={coordinatorForm.districtName}
                  onChange={handleCoordinatorFormChange}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={closeAddCoordinatorModal}
                disabled={savingCoordinator}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>

              <button
                onClick={handleAddCoordinator}
                disabled={savingCoordinator}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}
              >
                {savingCoordinator ? "Creating..." : "Create Coordinator"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
