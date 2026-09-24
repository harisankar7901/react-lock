import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api.js";

// Static sample data for now. Replace this array with an API response later.
const districtManagers = [
  { name: "ALOK KUMAR PADHIHARI", dataCollected: 111, operatorDataSync: 12, totalOperators: 40, compliance: 30, countOfTotal: 12, totalCollection: 2450, pendingAmount: 245000, balanceToPay: 242550, color: "#4c77d4" },
  { name: "BALMUKUND SAHU", dataCollected: 78, operatorDataSync: 6, totalOperators: 25, compliance: 48, countOfTotal: 6, totalCollection: 1400, pendingAmount: 56000, balanceToPay: 54550, color: "#ef8732" },
  { name: "MANAS MOHANTA", dataCollected: 121, operatorDataSync: 10, totalOperators: 30, compliance: 40, countOfTotal: 10, totalCollection: 2975, pendingAmount: 197700, balanceToPay: 194650, color: "#f0bc16" },
  { name: "NRUSINGHA PUTEL", dataCollected: 252, operatorDataSync: 15, totalOperators: 20, compliance: 60, countOfTotal: 15, totalCollection: 2700, pendingAmount: 90564, balanceToPay: 88114, color: "#74c438" },
  { name: "TRILOCHAN SAHU", dataCollected: 219, operatorDataSync: 21, totalOperators: 20, compliance: 60, countOfTotal: 21, totalCollection: 6625, pendingAmount: 844750, balanceToPay: 842550, color: "#35c0b1" },
];

function getToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

const money = (value) => new Intl.NumberFormat("en-IN").format(value);

function performanceColor(value) {
  if (value >= 90) return "#1aac96";
  if (value >= 75) return "#e0a52f";
  return "#d65b52";
}

export default function PerformanceDashboard({ onClose }) {
  const [asOfDate, setAsOfDate] = useState(getToday);
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
        params: { fromDate: asOfDate, toDate: asOfDate },
        signal: controller.signal,
      }),
    ]).then(([devicesResponse, summaryResponse]) => {
      if (controller.signal.aborted) return;
      const devices = devicesResponse.data?.data || [];
      const summaryRecords = summaryResponse.data?.data || [];
      const operatorIds = new Set(devices
        .map((device) => String(device.operatorId || "").trim())
        .filter(Boolean));
      const totalOperators = operatorIds.size;
      const operatorsFulfilled = summaryRecords
        .reduce((sum, record) => sum + (Number(record.demography) || 0), 0);

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
          const dataCollected = operatorList.reduce((sum, operatorId) => sum + (summaryByOperator.get(operatorId)?.totalData || 0), 0);
          const operatorDataSync = operatorList.reduce((sum, operatorId) => sum + (summaryByOperator.get(operatorId)?.demography || 0), 0);
          const assignedTotalOperators = operatorList.length;
          return {
            name,
            dataCollected,
            operatorDataSync,
            totalOperators: assignedTotalOperators,
            compliance: assignedTotalOperators ? (operatorDataSync / assignedTotalOperators) * 100 : 0,
          };
        })
        .sort((left, right) => left.name.localeCompare(right.name));

      setPerformanceRowsData(nextPerformanceRows);
      setLiveKpis({
        totalOperators,
        operatorsFulfilled,
        averageCompletion: totalOperators ? (operatorsFulfilled / totalOperators) * 100 : 0,
      });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setKpiError(error.response?.data?.message || "Unable to load live EOD MIS totals.");
    });

    return () => controller.abort();
  }, [asOfDate]);

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
    totalOperators: sum.totalOperators + row.totalOperators,
  }), { dataCollected: 0, operatorDataSync: 0, totalOperators: 0 }), [rows]);
  const compliance = reportTotals.totalOperators ? (reportTotals.operatorDataSync / reportTotals.totalOperators) * 100 : 0;
  const averageCompliance = rows.length ? rows.reduce((sum, row) => sum + row.compliance, 0) / rows.length : 0;
  const atRiskDistricts = rows.filter((row) => row.compliance < 40).length;
  const performanceRows = [...rows].sort((left, right) => right.compliance - left.compliance);

  return (
    <div className="excel-performance-overlay">
      <section className="excel-performance-dashboard" aria-label="District Manager Performance Report">
        <header className="excel-performance-header">
          <div><h1>District Manager Performance Report</h1><p>District Coordinator operational performance summary</p></div>
          <div className="excel-report-controls">
            <label>Date <input type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} /></label>
            <label>District Coordinator
              <select value={selectedManager} onChange={(event) => setSelectedManager(event.target.value)}>
                <option value="all">All</option>
                {performanceRowsData.map((manager) => <option key={manager.name} value={manager.name}>{manager.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </header>

        <main className="excel-performance-content">
          <div className="excel-kpi-strip">
            <article className="excel-kpi teal"><span>Total Operators</span><strong>{liveKpis ? liveKpis.totalOperators : "…"}</strong><small>Distinct Operator IDs in device list</small><b>OP</b></article>
            <article className="excel-kpi gold"><span>Operators Fulfilled</span><strong>{liveKpis ? liveKpis.operatorsFulfilled : "…"}</strong><small>Demography count from EOD MIS Report</small><b>OK</b></article>
            <article className="excel-kpi blue"><span>Average Completion</span><strong>{liveKpis ? `${liveKpis.averageCompletion.toFixed(1)}%` : "…"}</strong><small>Demography ÷ Total Operators × 100</small><b>%</b></article>
            <article className="excel-kpi red"><span>At Risk Districts</span><strong>{atRiskDistricts}</strong><small>Below 40% compliance</small><b>!</b></article>
          </div>
          {kpiError && <p className="excel-kpi-error">{kpiError}</p>}
          <section className="excel-report-card">
            <div className="excel-report-title"><span>District Manager Performance Report</span><small>Data as of {asOfDate}</small></div>
            <div className="excel-report-grid">
              <div className="excel-table-wrap"><table className="excel-report-table"><thead><tr><th>Dist_Coordi</th><th>Data Collected</th><th>Operator Data Sync</th><th>Total Operator</th><th>% of Compliance</th></tr></thead>
                <tbody>{rows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.dataCollected}</td><td>{row.operatorDataSync}</td><td>{row.totalOperators}</td><td>{row.compliance.toFixed(2)}</td></tr>)}</tbody>
                <tfoot><tr><td>Grand Total</td><td>{reportTotals.dataCollected}</td><td>{reportTotals.operatorDataSync}</td><td>{reportTotals.totalOperators}</td><td>{compliance.toFixed(2)}</td></tr></tfoot>
              </table></div>
              <div className="excel-performance-side">
                <div className="excel-performance-side-title"><span>Performance by District Coordinator</span><small>Data Sync ÷ Total Operators × 100</small></div>
                <div className="excel-performance-legend"><span><i className="good" />On Target (90%+)</span><span><i className="warn" />Needs Push (75–89%)</span><span><i className="bad" />At Risk (&lt;75%)</span></div>
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
                <tbody>{paymentRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.countOfTotal}</td><td>{money(row.totalCollection)}</td><td className="excel-danger">{money(row.pendingAmount)}</td><td className="excel-danger">{money(row.balanceToPay)}</td></tr>)}</tbody>
                <tfoot><tr><td>Grand Total</td><td>{totals.countOfTotal}</td><td>{money(totals.totalCollection)}</td><td className="excel-danger">{money(totals.pendingAmount)}</td><td className="excel-danger">{money(totals.balanceToPay)}</td></tr></tfoot>
              </table></div>
              <div className="excel-bar-panel"><div className="excel-chart-label"><span>Collection comparison</span><small>Count and total collection</small></div><div className="excel-bar-chart">{paymentRows.map((row) => <div className="excel-bar-row" key={row.name}><span title={row.name}>{row.name.split(" ").slice(0, 2).join(" ")}</span><div><i className="count" style={{ width: `${(row.countOfTotal / Math.max(...paymentRows.map((item) => item.countOfTotal))) * 100}%` }} /><b className="collection" style={{ width: `${(row.totalCollection / Math.max(...paymentRows.map((item) => item.totalCollection))) * 100}%` }} /></div><strong>{row.countOfTotal} / {money(row.totalCollection)}</strong></div>)}</div><div className="excel-bar-key"><span><i /> Count of Total</span><span><b /> Sum of Total Collection</span></div></div>
            </div>
          </section>
          <p className="excel-report-note">Static sample report. Database integration will replace these figures later.</p>
        </main>
      </section>
    </div>
  );
}
