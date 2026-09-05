import React, { useEffect, useMemo, useState } from "react";
import api from '../api/api.js';
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from '../assets/logo.jpeg';
const MAX_DEVICE_ALLOWED = 200;
const getTodayForDateInput = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};
const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [maxDeviceAllowed, setMaxDeviceAllowed] = useState(MAX_DEVICE_ALLOWED);
  const [search, setSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const navigate = useNavigate();
  const user = sessionStorage.getItem("user");
  const loggedInUser = JSON.parse(user || "{}");
  const role = loggedInUser.role;
  const isDistrictCoordinator = role === "distCoordinator";
  const loggedInCoordinatorEmail = loggedInUser.email || "";
  const loggedInCoordinatorName = loggedInUser.user || loggedInUser.email || "District Coordinator";
  const [showAddCoordinator, setShowAddCoordinator] = useState(false);
  const [showDeviceRegistration, setShowDeviceRegistration] = useState(false);
  const [deviceRegistrationForm, setDeviceRegistrationForm] = useState({ deviceId: "", laptopName: "" });
  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [deviceRegistrationError, setDeviceRegistrationError] = useState("");
  const [coordinatorForm, setCoordinatorForm] = useState({
    name: "",
    email: "",
    password: "",
    districtName: "",
  });
  const [savingCoordinator, setSavingCoordinator] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportTab, setReportTab] = useState("excel");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [selectedMisReport, setSelectedMisReport] = useState(null);
  const [misRecords, setMisRecords] = useState([]);
  const [misRecordsLoading, setMisRecordsLoading] = useState(false);
  const [misRecordsError, setMisRecordsError] = useState("");
  const [misFromDate, setMisFromDate] = useState(getTodayForDateInput);
  const [misToDate, setMisToDate] = useState(getTodayForDateInput);
  const [misOperatorId, setMisOperatorId] = useState("");
  const [misOperatorName, setMisOperatorName] = useState("");
  const [misCoordinatorEmail, setMisCoordinatorEmail] = useState(
    () => isDistrictCoordinator ? loggedInCoordinatorEmail : ""
  );
  const [missingMisOperators, setMissingMisOperators] = useState([]);
  const [missingMisDate, setMissingMisDate] = useState("");
  const [missingMisLoading, setMissingMisLoading] = useState(false);
  const [missingMisError, setMissingMisError] = useState("");
  const [showMissingMisModal, setShowMissingMisModal] = useState(false);
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
    setShowDropdown(false);
    setReportTab("excel");
    setShowReports(true);
    setSelectedMisReport(null);
    const today = getTodayForDateInput();
    setMisFromDate(today);
    setMisToDate(today);
    loadMisReportData(today, today);
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

  const openMisReportData = async (report) => {
    setSelectedMisReport(report);
    setMisRecords([]);
    setMisRecordsError("");
    setMisRecordsLoading(true);

    try {
      const response = await api.get(`devices/reports/${report._id}/enrolment-records`);
      setMisRecords(response.data.data || []);
    } catch (error) {
      console.error("Fetch MIS report data error:", error);
      setMisRecordsError(error.response?.data?.message || "Unable to load MIS report data.");
    } finally {
      setMisRecordsLoading(false);
    }
  };

  const formatFileSize = (size) => {
    if (!Number.isFinite(size)) return "-";
    return size < 1024 * 1024
      ? `${Math.ceil(size / 1024)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const displayValue = (value) => value === null || value === undefined || value === "" ? "-" : value;

  const misTotals = useMemo(() => {
    const totalFields = [
      "total",
      "newEnrolments",
      "mbuAge5To7And15To17",
      "mbuAge7To15AndAbove17",
      "demographicUpdate",
      "biometricUpdate",
      "totalCollectionFromResident"
    ];

    return misRecords.reduce((totals, record) => {
      totalFields.forEach((field) => {
        const value = Number(record[field]);
        if (Number.isFinite(value)) totals[field] += value;
      });
      return totals;
    }, Object.fromEntries(totalFields.map((field) => [field, 0])));
  }, [misRecords]);

  const downloadMisReportPdf = () => {
    if (!misRecords.length) {
      alert("Search for MIS report data before downloading a PDF.");
      return;
    }

    const headers = [
      "Sl#", "Date", "Station ID", "Operator ID", "Operator Name",
      "District", "Block/ULB/ICDS", "Station Type", "Operator Type",
      "Total", "New", "MBU 5-7 & 15-17", "MBU 7-15 & Above 17",
      "Demographic Update", "Biometric Update", "Total Collection"
    ];
    const reportRows = misRecords.map((record, index) => [
      index + 1,
      displayValue(record.reportDate),
      displayValue(record.stationId),
      displayValue(record.operatorId),
      displayValue(record.operatorName),
      displayValue(record.district),
      displayValue(record.blockUlbIcdsName),
      displayValue(record.stationType),
      displayValue(record.operatorType),
      displayValue(record.total),
      displayValue(record.newEnrolments),
      displayValue(record.mbuAge5To7And15To17),
      displayValue(record.mbuAge7To15AndAbove17),
      displayValue(record.demographicUpdate),
      displayValue(record.biometricUpdate),
      displayValue(record.totalCollectionFromResident)
    ]);

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
    pdf.setFontSize(17);
    pdf.setTextColor(18, 59, 115);
    pdf.text("MIS Report", 40, 42);
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Date range: ${misFromDate} to ${misToDate}   |   Records: ${misRecords.length}`, 40, 60);

    autoTable(pdf, {
      startY: 76,
      head: [headers],
      body: reportRows,
      foot: [["", "", "", "", "", "", "", "", "Cumulative Total", misTotals.total, misTotals.newEnrolments, misTotals.mbuAge5To7And15To17, misTotals.mbuAge7To15AndAbove17, misTotals.demographicUpdate, misTotals.biometricUpdate, misTotals.totalCollectionFromResident]],
      theme: "grid",
      styles: { fontSize: 6.4, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [18, 59, 115], textColor: 255, fontStyle: "bold", halign: "center" },
      footStyles: { fillColor: [220, 236, 255], textColor: [18, 59, 115], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 26, halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 48 },
        3: { cellWidth: 56 },
        4: { cellWidth: 76 },
        5: { cellWidth: 57 },
        6: { cellWidth: 82 },
        7: { cellWidth: 48 },
        8: { cellWidth: 52 },
        9: { cellWidth: 38, halign: "right" },
        10: { cellWidth: 34, halign: "right" },
        11: { cellWidth: 58, halign: "right" },
        12: { cellWidth: 65, halign: "right" },
        13: { cellWidth: 62, halign: "right" },
        14: { cellWidth: 54, halign: "right" },
        15: { cellWidth: 58, halign: "right" }
      },
      didParseCell: ({ section, column, cell }) => {
        if ((section === "body" || section === "foot") && column.index >= 9) {
          cell.styles.halign = "right";
        }
      }
    });

    pdf.save(`MIS-Report_${misFromDate}_to_${misToDate}.pdf`);
  };

  const visibleReports = useMemo(() => reports.filter((report) => {
    if (report.reportType) return report.reportType === reportTab;
    return reportTab === "excel"
      ? report.fileName?.toLowerCase().endsWith(".xlsx")
      : report.fileName?.toLowerCase().endsWith(".zip");
  }), [reports, reportTab]);

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

  const openDeviceRegistrationModal = () => {
    setDeviceRegistrationForm({ deviceId: "", laptopName: "" });
    setDeviceRegistrationError("");
    setShowDeviceRegistration(true);
    setShowDropdown(false);
  };

  const closeDeviceRegistrationModal = () => {
    if (!registeringDevice) setShowDeviceRegistration(false);
  };

  const registerDeviceManually = async () => {
    const deviceId = deviceRegistrationForm.deviceId.trim();
    const laptopName = deviceRegistrationForm.laptopName.trim();
    if (!deviceId || !laptopName) {
      setDeviceRegistrationError("Device ID and laptop name are required.");
      return;
    }

    try {
      setRegisteringDevice(true);
      setDeviceRegistrationError("");
      // The existing app registration endpoint expects these legacy field names.
      // Supply the computer name in both fields so it displays correctly for
      // manually created records as well as app-created records.
      await api.post("devices/register", {
        deviceId,
        laptopName,
        userName: laptopName,
        status: "false",
      });
      await fetchDevices();
      setShowDeviceRegistration(false);
      alert("Device registered successfully.");
    } catch (error) {
      setDeviceRegistrationError(error.response?.data?.message || "Unable to register the device.");
    } finally {
      setRegisteringDevice(false);
    }
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
      setMaxDeviceAllowed(res.data.maxDeviceAllowed || MAX_DEVICE_ALLOWED);
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

  const loadMisReportData = async (fromDate = misFromDate, toDate = misToDate, coordinatorEmail = misCoordinatorEmail) => {
    if (!fromDate || !toDate) {
      setMisRecordsError("Choose both From and To dates.");
      return;
    }

    setMisRecords([]);
    setMisRecordsError("");
    setMisRecordsLoading(true);
    try {
      const response = await api.get("devices/reports/enrolment-records", {
        params: {
          fromDate,
          toDate,
          operatorId: misOperatorId.trim(),
          operatorName: misOperatorName.trim(),
          coordinatorEmail,
        },
      });
      setMisRecords(response.data.data || []);
    } catch (error) {
      console.error("Fetch MIS report range error:", error);
      setMisRecordsError(error.response?.data?.message || "Unable to load MIS report data.");
    } finally {
      setMisRecordsLoading(false);
    }
  };

  const loadMissingTodayMisReports = async (date = getTodayForDateInput()) => {
    setMissingMisOperators([]);
    setMissingMisError("");
    setShowMissingMisModal(false);
    setMissingMisLoading(true);
    try {
      const response = await api.get("devices/reports/missing-enrolment-records", {
        params: { date }
      });
      setMissingMisOperators(response.data.data || []);
      setMissingMisDate(response.data.date || getTodayForDateInput());
      setShowMissingMisModal(true);
    } catch (error) {
      console.error("Fetch missing MIS reports error:", error);
      setMissingMisError(error.response?.data?.message || "Unable to load missing MIS reports.");
    } finally {
      setMissingMisLoading(false);
    }
  };

  const handleDeleteDevice = async (device) => {
    const deviceName = device.laptopName || device.deviceId || "this device";
    if (!window.confirm(`Delete ${deviceName}? This removes it from the device list.`)) {
      return;
    }

    try {
      setDeletingDeviceId(device._id);
      await api.delete(`devices/${device._id}`);
      setDevices((currentDevices) =>
        currentDevices.filter((currentDevice) => currentDevice._id !== device._id)
      );
    } catch (error) {
      console.error("Delete device error:", error);
      alert(error.response?.data?.message || "Unable to delete the device.");
    } finally {
      setDeletingDeviceId(null);
    }
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
      const matchesSearch = (
        device.laptopName?.toLowerCase().includes(searchValue) ||
        device.deviceId?.toLowerCase().includes(searchValue) ||
        device.userName?.toLowerCase().includes(searchValue) ||
        device.stationId?.toLowerCase().includes(searchValue) ||
        device.status?.toLowerCase().includes(searchValue) ||
        device.operatorId?.toLowerCase().includes(searchValue) ||
        device.operatorName?.toLowerCase().includes(searchValue) ||
        device.districtName?.toLowerCase().includes(searchValue) ||
        device.block?.toLowerCase().includes(searchValue)
      );

      if (!matchesSearch) return false;

      const isLocked = device.lock === true || String(device.status).toLowerCase() === "true";
      if (deviceFilter === "locked") return isLocked;
      if (deviceFilter === "unlocked") return !isLocked;
      if (deviceFilter === "online") return device.connectionStatus === "online";
      if (deviceFilter === "offline") return device.connectionStatus !== "online";
      if (deviceFilter === "coordinator-assigned") {
        return Boolean(device.coordinatorEmail || device.distCoordinatorMail || device.distCoordinatorName);
      }
      if (deviceFilter.startsWith("coordinator:")) {
        const selectedCoordinator = deviceFilter.substring("coordinator:".length);
        return (
          device.coordinatorEmail === selectedCoordinator ||
          device.distCoordinatorMail === selectedCoordinator ||
          device.distCoordinatorName === selectedCoordinator
        );
      }

      return true;
    });
  }, [devices, search, deviceFilter]);

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

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ fontWeight: 600, whiteSpace: "nowrap", color: "#1e3a5f" }}>
            Devices: {totalDevices} / {maxDeviceAllowed}
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
              {role === "superAdmin" && (
                <button
                  onClick={openDeviceRegistrationModal}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  💻 Device Registration
                </button>
              )}
              <button
                onClick={openReportList}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                📄 Report List
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
          <div className="device-filter-controls">
            <input
              type="text"
              placeholder="Search laptop, device ID, user, operator, district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              aria-label="Filter devices"
            >
              <option value="all">All devices</option>
              <optgroup label="Lock Status">
                <option value="locked">Locked</option>
                <option value="unlocked">Unlocked</option>
              </optgroup>
              <optgroup label="Connection">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </optgroup>
              <optgroup label="District Coordinator">
                <option value="coordinator-assigned">Has District Coordinator</option>
                {coordinators.map((coordinator) => (
                  <option
                    key={coordinator._id || coordinator.email || coordinator.name}
                    value={`coordinator:${coordinator.email || coordinator.name}`}
                  >
                    {coordinator.name || coordinator.email}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {role === "distCoordinator" && (
              <span style={{ fontWeight: 600, whiteSpace: "nowrap", color: "#1e3a5f" }}>
                {loggedInCoordinatorName}
              </span>
            )}
            <button onClick={fetchDevices}>Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading devices...</div>
        ) : (
          <div className="device-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Computer Name</th>
                {/* <th>Device ID</th> */}
                {/* <th>User</th> */}
                <th>Lock Action</th>
                <th>Lock Status</th>
                <th>Station ID</th>
                <th>Operator ID</th>
                <th>Operator Name</th>
                {role !== "distCoordinator" && <th>Dist. Coordinator</th>}
                <th>District Name</th>
                <th>Block</th>
                <th>Action</th>
                <th>Last Seen</th>
                <th>App Version</th>
              </tr>
            </thead>

            <tbody>
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={role === "distCoordinator" ? 11 : 12} className="no-data">
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
                    <td>{device.stationId || "-"}</td>
                    <td>{device.operatorId || "-"}</td>
                    <td>{device.operatorName || "-"}</td>
                    {role !== "distCoordinator" && <td>{device.distCoordinatorName || "-"}</td>}
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
*/}

                        <button
                          onClick={() => openKeyModal(device, "uninstall")}
                          title="Send a temporary uninstall key to this device"
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#b45309", color: "#fff", cursor: "pointer" }}
                        >
                          🗑️ Send Uninstall Key
                        </button>

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
                        {role === 'superAdmin' && (
                          <button
                            onClick={() => handleDeleteDevice(device)}
                            disabled={deletingDeviceId === device._id}
                            title="Delete this device"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#dc2626",
                              color: "#fff",
                              cursor: deletingDeviceId === device._id ? "wait" : "pointer",
                            }}
                          >
                            {deletingDeviceId === device._id ? "Deleting..." : "🗑️ Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{formatLastSeen(device.lastSeen)}</td>
                    <td>{device.applicationVersion || "-"}</td>
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
          style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 100 }}
        >
          <div
            className="modal-content"
            style={{ background: "#fff", padding: "24px", width: "100%", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Reports</h2>
              <button onClick={() => setShowReports(false)}>Close</button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "18px", borderBottom: "1px solid #e5e7eb" }}>
              <button
                onClick={() => setReportTab("excel")}
                style={{ padding: "9px 14px", border: "none", borderBottom: reportTab === "excel" ? "3px solid #2563eb" : "3px solid transparent", background: "transparent", color: reportTab === "excel" ? "#2563eb" : "#374151", fontWeight: 600, cursor: "pointer" }}
              >
                MIS Report
              </button>
              <button
                onClick={() => setReportTab("zip")}
                style={{ padding: "9px 14px", border: "none", borderBottom: reportTab === "zip" ? "3px solid #2563eb" : "3px solid transparent", background: "transparent", color: reportTab === "zip" ? "#2563eb" : "#374151", fontWeight: 600, cursor: "pointer" }}
              >
                Zip
              </button>
            </div>

            {reportTab === "excel" ? (
              <>
                <div style={{ display: "flex", alignItems: "end", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <label>
                    From date
                    <input type="date" value={misFromDate} max={misToDate || undefined} onChange={(event) => setMisFromDate(event.target.value)} style={{ display: "block", marginTop: "5px", padding: "8px" }} />
                  </label>
                  <label>
                    To date
                    <input type="date" value={misToDate} min={misFromDate || undefined} onChange={(event) => setMisToDate(event.target.value)} style={{ display: "block", marginTop: "5px", padding: "8px" }} />
                  </label>
                  <label>
                    Operator ID
                    <input type="text" value={misOperatorId} onChange={(event) => setMisOperatorId(event.target.value)} placeholder="Search operator ID" style={{ display: "block", marginTop: "5px", padding: "8px" }} />
                  </label>
                  <label>
                    Operator Name
                    <input type="text" value={misOperatorName} onChange={(event) => setMisOperatorName(event.target.value)} placeholder="Search operator name" style={{ display: "block", marginTop: "5px", padding: "8px" }} />
                  </label>
                  <label>
                    Dist. Coordinator
                    <select
                      value={misCoordinatorEmail}
                      disabled={isDistrictCoordinator}
                      onChange={(event) => {
                        const coordinatorEmail = event.target.value;
                        setMisCoordinatorEmail(coordinatorEmail);
                        loadMisReportData(misFromDate, misToDate, coordinatorEmail);
                      }}
                      style={{ display: "block", marginTop: "5px", padding: "8px", minWidth: "190px", background: isDistrictCoordinator ? "#f3f4f6" : "#fff", cursor: isDistrictCoordinator ? "not-allowed" : "pointer" }}
                    >
                      {!isDistrictCoordinator && <option value="">All District Coordinators</option>}
                      {coordinators.map((coordinator) => (
                        <option key={coordinator._id || coordinator.email} value={coordinator.email}>
                          {coordinator.name || coordinator.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button onClick={() => loadMisReportData()} disabled={misRecordsLoading} style={{ padding: "9px 16px" }}>
                    {misRecordsLoading ? "Loading..." : "Search"}
                  </button>
                  <button onClick={downloadMisReportPdf} disabled={!misRecords.length || misRecordsLoading} style={{ padding: "9px 16px", background: "#166534", color: "#fff", border: "none", borderRadius: "5px", cursor: !misRecords.length || misRecordsLoading ? "not-allowed" : "pointer", opacity: !misRecords.length || misRecordsLoading ? 0.6 : 1 }}>
                    ⬇ Download PDF
                  </button>
                  <button onClick={() => loadMissingTodayMisReports()} disabled={missingMisLoading} style={{ padding: "9px 16px", marginLeft: "auto", background: "#b45309", color: "#fff", border: "none", borderRadius: "5px", cursor: missingMisLoading ? "wait" : "pointer" }}>
                    {missingMisLoading ? "Loading..." : "Missing Today’s MIS Reports"}
                  </button>
                </div>
                {missingMisError && <p style={{ color: "#d93025" }}>{missingMisError}</p>}
                {misRecordsError ? <p style={{ color: "#d93025" }}>{misRecordsError}</p> : misRecordsLoading ? <p>Loading MIS report data...</p> : misRecords.length === 0 ? <p>No MIS data found for the selected date range.</p> : (
                  <div className="mis-report-table-scroll">
                    <table className="mis-report-table">
                      <thead><tr>
                        <th>Sl#</th><th>Date</th><th>Station ID</th><th>Operator ID</th><th>Operator Name</th><th>District</th><th>Block/ULB/ICDS</th><th>Station Type</th><th>Operator Type</th><th>Total</th><th>New</th><th>MBU 5-7 & 15-17</th><th>MBU 7-15 & Above 17</th><th>Demographic Update</th><th>Biometric Update</th><th>Total Collection</th>
                      </tr></thead>
                      <tbody>{misRecords.map((record, index) => <tr key={record._id}>
                        <td>{index + 1}</td><td>{displayValue(record.reportDate)}</td><td>{displayValue(record.stationId)}</td><td>{displayValue(record.operatorId)}</td><td>{displayValue(record.operatorName)}</td><td>{displayValue(record.district)}</td><td>{displayValue(record.blockUlbIcdsName)}</td><td>{displayValue(record.stationType)}</td><td>{displayValue(record.operatorType)}</td><td>{displayValue(record.total)}</td><td>{displayValue(record.newEnrolments)}</td><td>{displayValue(record.mbuAge5To7And15To17)}</td><td>{displayValue(record.mbuAge7To15AndAbove17)}</td><td>{displayValue(record.demographicUpdate)}</td><td>{displayValue(record.biometricUpdate)}</td><td>{displayValue(record.totalCollectionFromResident)}</td>
                      </tr>)}</tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="9">Cumulative Total</td>
                          <td className="mis-total-cell">{misTotals.total}</td><td className="mis-total-cell">{misTotals.newEnrolments}</td><td className="mis-total-cell">{misTotals.mbuAge5To7And15To17}</td><td className="mis-total-cell">{misTotals.mbuAge7To15AndAbove17}</td><td className="mis-total-cell">{misTotals.demographicUpdate}</td><td className="mis-total-cell">{misTotals.biometricUpdate}</td><td className="mis-total-cell">{misTotals.totalCollectionFromResident}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            ) : reportsLoading ? <p>Loading zip files...</p> : reportsError ? <p style={{ color: "#d93025" }}>{reportsError}</p> : visibleReports.length === 0 ? <p>No uploaded zip files found.</p> : (
              <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
                <table>
                  <thead><tr><th>File Name</th><th>Size</th><th>Uploaded</th><th>Action</th></tr></thead>
                  <tbody>{visibleReports.map((report) => (
                    <tr key={report._id}><td>{report.fileName}</td><td>{formatFileSize(report.size)}</td><td>{new Date(report.createdAt).toLocaleString()}</td><td>{report.downloadUrl ? <a href={report.downloadUrl} target="_blank" rel="noreferrer">Download</a> : "-"}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showMissingMisModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowMissingMisModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
        >
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "620px", maxWidth: "90%", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div>
                <h2 style={{ margin: 0 }}>Operators without MIS Report</h2>
              </div>
              <button onClick={() => setShowMissingMisModal(false)}>Close</button>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: "10px", marginTop: "16px" }}>
              <label>
                Report date
                <input
                  type="date"
                  value={missingMisDate}
                  max={getTodayForDateInput()}
                  onChange={(event) => setMissingMisDate(event.target.value)}
                  style={{ display: "block", marginTop: "5px", padding: "8px" }}
                />
              </label>
              <button
                onClick={() => loadMissingTodayMisReports(missingMisDate)}
                disabled={!missingMisDate || missingMisLoading}
                style={{ padding: "9px 16px" }}
              >
                {missingMisLoading ? "Loading..." : "Show Operators"}
              </button>
            </div>
            {missingMisOperators.length === 0 ? <p>All assigned operators have uploaded today’s MIS report.</p> : (
              <div style={{ overflow: "auto", marginTop: "16px" }}>
                <table style={{ width: "100%" }}>
                  <thead><tr><th>Sl#</th><th>Operator ID</th><th>Operator Name</th></tr></thead>
                  <tbody>{missingMisOperators.map((operator, index) => (
                    <tr key={operator.operatorId}><td>{index + 1}</td><td>{operator.operatorId}</td><td>{displayValue(operator.operatorName)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
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

      {showDeviceRegistration && (
        <div
          className="modal-overlay"
          onClick={closeDeviceRegistrationModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
        >
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "400px", maxWidth: "90%" }}
          >
            <h2 style={{ marginTop: 0 }}>Device Registration</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label>
                Device ID
                <input
                  type="text"
                  value={deviceRegistrationForm.deviceId}
                  onChange={(event) => setDeviceRegistrationForm((current) => ({ ...current, deviceId: event.target.value }))}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>
              <label>
                Laptop Name
                <input
                  type="text"
                  value={deviceRegistrationForm.laptopName}
                  onChange={(event) => setDeviceRegistrationForm((current) => ({ ...current, laptopName: event.target.value }))}
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                />
              </label>
              {deviceRegistrationError && <div style={{ color: "#dc2626", fontSize: "14px" }}>{deviceRegistrationError}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={closeDeviceRegistrationModal} disabled={registeringDevice} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={registerDeviceManually} disabled={registeringDevice} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>
                {registeringDevice ? "Registering..." : "Register Device"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
