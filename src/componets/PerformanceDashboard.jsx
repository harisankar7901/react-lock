import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api.js";
import "./PerformanceDashboard.css";

// Static sample data for now. Replace this array with an API response later.
const districtManagers = [
  { name: "ALOK KUMAR PADHIHARI", dataCollected: 111, operatorDataSync: 12, totalOperators: 40, compliance: 30, countOfTotal: 12, totalCollection: 2450, pendingAmount: 245000, balanceToPay: 242550, color: "#4c77d4" },
  { name: "BALMUKUND SAHU", dataCollected: 78, operatorDataSync: 6, totalOperators: 25, compliance: 48, countOfTotal: 6, totalCollection: 1400, pendingAmount: 56000, balanceToPay: 54550, color: "#ef8732" },
  { name: "MANAS MOHANTA", dataCollected: 121, operatorDataSync: 10, totalOperators: 30, compliance: 40, countOfTotal: 10, totalCollection: 2975, pendingAmount: 197700, balanceToPay: 194650, color: "#f0bc16" },
  { name: "NRUSINGHA PUTEL", dataCollected: 252, operatorDataSync: 15, totalOperators: 20, compliance: 60, countOfTotal: 15, totalCollection: 2700, pendingAmount: 90564, balanceToPay: 88114, color: "#74c438" },
  { name: "TRILOCHAN SAHU", dataCollected: 219, operatorDataSync: 21, totalOperators: 20, compliance: 60, countOfTotal: 21, totalCollection: 6625, pendingAmount: 844750, balanceToPay: 842550, color: "#35c0b1" },
];

// Keep the Payment Outstanding section blank until its live data is connected.
const SHOW_PAYMENT_OUTSTANDING_DATA = false;

function getToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function daysInRange(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  return Math.max(1, Math.round((to - from) / 86400000) + 1);
}

function operatorDayCounts(records, dateField) {
  const seen = new Set();
  const counts = new Map();
  for (const record of records) {
    const operatorId = String(record.operatorId || "").trim();
    const day = String(record[dateField] || "").trim();
    if (!operatorId || !day) continue;
    const key = JSON.stringify([day, operatorId]);
    if (seen.has(key)) continue;
    seen.add(key);
    counts.set(operatorId, (counts.get(operatorId) || 0) + 1);
  }
  return counts;
}

const money = (value) => new Intl.NumberFormat("en-IN").format(value);

function performanceColor(value) {
  if (value >= 95) return "#1aac96";
  if (value >= 85) return "#e0a52f";
  return "#d65b52";
}

export default function PerformanceDashboard({ onClose, onLogout }) {
  const [fromDate, setFromDate] = useState(getToday);
  const [toDate, setToDate] = useState(getToday);
  const [selectedManager, setSelectedManager] = useState("all");
  const [liveKpis, setLiveKpis] = useState(null);
  const [kpiError, setKpiError] = useState("");
  const [performanceRowsData, setPerformanceRowsData] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    setLiveKpis(null);
    setKpiError("");

    Promise.all([
      api.get("devices", { signal: controller.signal }),
      api.get("devices/reports/zip-enrolment-summary", {
        params: { fromDate, toDate },
        signal: controller.signal,
      }),
      api.get("devices/reports/enrolment-records", {
        params: { fromDate, toDate },
        signal: controller.signal,
      }),
    ]).then(([devicesResponse, summaryResponse, offMisResponse]) => {
      if (controller.signal.aborted) return;
      const devices = devicesResponse.data?.data || [];
      const summaryRecords = summaryResponse.data?.data || [];
      const offMisRecords = offMisResponse.data?.data || [];
      const selectedDayCount = daysInRange(fromDate, toDate);
      const operatorIds = new Set(devices
        .map((device) => String(device.operatorId || "").trim())
        .filter(Boolean));
      const totalOperators = operatorIds.size;
      const offMisCountsByOperator = operatorDayCounts(offMisRecords, 'reportDate');
      const eodMisCountsByOperator = operatorDayCounts(summaryRecords, 'date');
      const offMisOperators = [...offMisCountsByOperator.values()].reduce((sum, count) => sum + count, 0);
      const eodMisOperators = [...eodMisCountsByOperator.values()].reduce((sum, count) => sum + count, 0);

      const summaryByOperator = new Map();
      for (const record of summaryRecords) {
        const operatorId = String(record.operatorId || "").trim();
        if (!operatorId) continue;
        const current = summaryByOperator.get(operatorId) || { totalData: 0, demography: 0 };
        current.totalData += Number(record.totalData) || 0;
        current.demography += Number(record.demography) || 0;
        summaryByOperator.set(operatorId, current);
      }

      // One operator belongs to one District Coordinator. This avoids counting
      // a duplicated device record twice in the coordinator totals.
      const coordinatorOperators = new Map();
      for (const device of devices) {
        const operatorId = String(device.operatorId || "").trim();
        const coordinator = String(device.distCoordinatorName || device.coordinatorEmail || device.distCoordinatorMail || "Unassigned").trim() || "Unassigned";
        if (!operatorId) continue;
        if (!coordinatorOperators.has(coordinator)) coordinatorOperators.set(coordinator, new Set());
        coordinatorOperators.get(coordinator).add(operatorId);
      }

      const nextPerformanceRows = [...coordinatorOperators.entries()]
        .map(([name, assignedOperatorIds]) => {
          const operatorList = [...assignedOperatorIds];
          const operatorDataSync = operatorList.reduce((sum, operatorId) => sum + (summaryByOperator.get(operatorId)?.demography || 0), 0);
          const assignedTotalOperators = operatorList.length;
          const offMisCount = operatorList.reduce((sum, operatorId) => sum + (offMisCountsByOperator.get(operatorId) || 0), 0);
          const eodMisCount = operatorList.reduce((sum, operatorId) => sum + (eodMisCountsByOperator.get(operatorId) || 0), 0);
          return {
            name,
            // Data Collected is the number of this coordinator's operators
            // present in the EOD MIS Report summary for the selected date.
            dataCollected: eodMisCount,
            operatorDataSync,
            offGovtMisCount: offMisCount,
            eodMisCount,
            totalOperators: assignedTotalOperators,
            compliance: assignedTotalOperators ? (eodMisCount / (assignedTotalOperators * selectedDayCount)) * 100 : 0,
            averageCompletion: assignedTotalOperators
              ? ((offMisCount + eodMisCount) / (2 * assignedTotalOperators * selectedDayCount)) * 100
              : 0,
          };
        })
        .sort((left, right) => left.name.localeCompare(right.name));

      setPerformanceRowsData(nextPerformanceRows);
      setLiveKpis({
        totalOperators,
        offMisOperators,
        eodMisOperators,
        averageCompletion: totalOperators
          ? ((offMisOperators + eodMisOperators) / (2 * totalOperators * selectedDayCount)) * 100
          : 0,
      });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setKpiError(error.response?.data?.message || "Unable to load live EOD MIS totals.");
    });

    return () => controller.abort();
  }, [fromDate, toDate]);

  const rows = useMemo(() => selectedManager === "all"
    ? performanceRowsData
    : performanceRowsData.filter((manager) => manager.name === selectedManager), [performanceRowsData, selectedManager]);

  // Payment outstanding remains the static demonstration section for now.
  const paymentRows = districtManagers;

  const totals = useMemo(() => paymentRows.reduce((sum, row) => ({
    dataCollected: sum.dataCollected + row.dataCollected,
    operatorDataSync: sum.operatorDataSync + row.operatorDataSync,
    totalOperators: sum.totalOperators + row.totalOperators,
    countOfTotal: sum.countOfTotal + row.countOfTotal,
    totalCollection: sum.totalCollection + row.totalCollection,
    pendingAmount: sum.pendingAmount + row.pendingAmount,
    balanceToPay: sum.balanceToPay + row.balanceToPay,
  }), { dataCollected: 0, operatorDataSync: 0, totalOperators: 0, countOfTotal: 0, totalCollection: 0, pendingAmount: 0, balanceToPay: 0 }), [paymentRows]);

  const reportTotals = useMemo(() => rows.reduce((sum, row) => ({
    dataCollected: sum.dataCollected + row.dataCollected,
    operatorDataSync: sum.operatorDataSync + row.operatorDataSync,
    offGovtMisCount: sum.offGovtMisCount + row.offGovtMisCount,
    eodMisCount: sum.eodMisCount + row.eodMisCount,
    totalOperators: sum.totalOperators + row.totalOperators,
  }), { dataCollected: 0, operatorDataSync: 0, offGovtMisCount: 0, eodMisCount: 0, totalOperators: 0 }), [rows]);
  const compliance = reportTotals.totalOperators ? (reportTotals.dataCollected / (reportTotals.totalOperators * daysInRange(fromDate, toDate))) * 100 : 0;
  const averageCompliance = rows.length ? rows.reduce((sum, row) => sum + row.compliance, 0) / rows.length : 0;
  const atRiskDistricts = performanceRowsData.filter((row) => row.averageCompletion < 85).length;
  const performanceRows = [...rows].sort((left, right) => right.compliance - left.compliance);

  return (
    <div className="excel-performance-overlay">
      <section className="excel-performance-dashboard" aria-label="District Manager Performance Report">
        <header className="excel-performance-header">
          <div><h1>District Manager Performance Report</h1></div>
          <div className="excel-report-controls">
            <label>From date <input type="date" value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} /></label>
            <label>To date <input type="date" value={toDate} min={fromDate} onChange={(event) => setToDate(event.target.value)} /></label>
            <label>District Coordinator
              <select value={selectedManager} onChange={(event) => setSelectedManager(event.target.value)}>
                <option value="all">All</option>
                {performanceRowsData.map((manager) => <option key={manager.name} value={manager.name}>{manager.name}</option>)}
              </select>
            </label>
            {onClose && <button type="button" onClick={onClose}>Close</button>}
            {onLogout && <button type="button" onClick={onLogout}>Logout</button>}
          </div>
        </header>

        <main className="excel-performance-content">
          <div className="excel-kpi-strip">
            <article className="excel-kpi teal"><span>Total Operators</span><strong>{liveKpis ? liveKpis.totalOperators : "…"}</strong><small>&nbsp;</small><b>OP</b></article>
            <article className="excel-kpi gold"><span>Operators Fulfilled</span><div className="excel-kpi-dual"><label>OFF Govt. data sync count <strong>{liveKpis ? liveKpis.offMisOperators : "…"}</strong></label><label>EOD data sync count <strong>{liveKpis ? liveKpis.eodMisOperators : "…"}</strong></label></div><small>Operator uploads OFF Govt &amp; EOD data</small><b>OK</b></article>
            <article className="excel-kpi blue"><span>Average Completion</span><strong>{liveKpis ? `${liveKpis.averageCompletion.toFixed(1)}%` : "…"}</strong><small>Govt OFF Sync + EOD Sync ÷ Total Operators × 100</small><b>%</b></article>
            <article className="excel-kpi red"><span>At Risk Districts</span><strong>{atRiskDistricts}</strong><small>Below 85% average completion</small><b>!</b></article>
          </div>
          {kpiError && <p className="excel-kpi-error">{kpiError}</p>}
          <section className="excel-report-card">
            <div className="excel-report-title"><span>District Manager Performance Report</span><small>Data from {fromDate} to {toDate}</small></div>
            <div className="excel-report-grid">
              <div className="excel-table-wrap"><table className="excel-report-table"><thead><tr><th rowSpan="2">Dist Manager Name</th><th rowSpan="2">Total Operator</th><th rowSpan="2">Data Collected</th><th colSpan="2">Operator Data Sync</th><th rowSpan="2">% of Compliance</th></tr><tr><th>OFF Govt. Portal MIS</th><th>EOD MIS Report</th></tr></thead>
                <tbody>{rows.map((row) => <tr key={row.name}><td>{String(row.name || "-").toUpperCase()}</td><td>{row.totalOperators}</td><td>{row.dataCollected}</td><td>{row.offGovtMisCount}</td><td>{row.eodMisCount}</td><td>{row.compliance.toFixed(2)}</td></tr>)}</tbody>
                <tfoot><tr><td>Grand Total</td><td>{reportTotals.totalOperators}</td><td>{reportTotals.dataCollected}</td><td>{reportTotals.offGovtMisCount}</td><td>{reportTotals.eodMisCount}</td><td>{compliance.toFixed(2)}</td></tr></tfoot>
              </table></div>
              <div className="excel-performance-side">
                <div className="excel-performance-side-title"><span>Performance by District Coordinator</span></div>
                <div className="excel-performance-legend"><span><i className="good" />On Target (95%+)</span><span><i className="warn" />Needs Push (85–94.9%)</span><span><i className="bad" />At Risk (&lt;85%)</span></div>
                <div className="excel-performance-list">{performanceRows.map((row, index) => <div className="excel-performance-row" key={row.name}>
                  <b>{index + 1}</b><span title={row.name}>{row.name}<small>District Coordinator</small></span><div><i style={{ width: `${Math.min(row.compliance, 100)}%`, background: performanceColor(row.compliance) }} /></div><strong>{row.compliance.toFixed(1)}%</strong>
                </div>)}</div>
              </div>
            </div>
          </section>

          <section className="excel-report-card">
            <div className="excel-report-title"><span>District Manager Payment Outstanding Report</span><small>Collection and balance summary</small></div>
            <div className="excel-report-grid">
              <div className="excel-table-wrap"><table className="excel-report-table payment"><thead><tr><th>Dist_Coordi</th><th>Count of Total</th><th>Sum of Total Collection</th><th>Pending Amount</th><th>Balance Need to Pay</th></tr></thead>
                {SHOW_PAYMENT_OUTSTANDING_DATA && <><tbody>{paymentRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.countOfTotal}</td><td>{money(row.totalCollection)}</td><td className="excel-danger">{money(row.pendingAmount)}</td><td className="excel-danger">{money(row.balanceToPay)}</td></tr>)}</tbody>
                <tfoot><tr><td>Grand Total</td><td>{totals.countOfTotal}</td><td>{money(totals.totalCollection)}</td><td className="excel-danger">{money(totals.pendingAmount)}</td><td className="excel-danger">{money(totals.balanceToPay)}</td></tr></tfoot></>}
              </table></div>
              <div className="excel-bar-panel">{SHOW_PAYMENT_OUTSTANDING_DATA && <><div className="excel-chart-label"><span>Collection comparison</span><small>Count and total collection</small></div><div className="excel-bar-chart">{paymentRows.map((row) => <div className="excel-bar-row" key={row.name}><span title={row.name}>{row.name.split(" ").slice(0, 2).join(" ")}</span><div><i className="count" style={{ width: `${(row.countOfTotal / Math.max(...paymentRows.map((item) => item.countOfTotal))) * 100}%` }} /><b className="collection" style={{ width: `${(row.totalCollection / Math.max(...paymentRows.map((item) => item.totalCollection))) * 100}%` }} /></div><strong>{row.countOfTotal} / {money(row.totalCollection)}</strong></div>)}</div><div className="excel-bar-key"><span><i /> Count of Total</span><span><b /> Sum of Total Collection</span></div></>}</div>
            </div>
          </section>
          <p className="excel-report-note">Static sample report. Database integration will replace these figures later.</p>
        </main>
      </section>
    </div>
  );
}
