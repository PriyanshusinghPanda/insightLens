import React, { useEffect, useState } from "react";
import { getReports } from "../api";

export default function Reports() {
    const token = localStorage.getItem("token");
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        getReports(token)
            .then(res => setReports(res.data))
            .catch(err => console.error("Failed to fetch reports:", err))
            .finally(() => setLoading(false));
    }, [token]);

    const handleView = (report) => {
        setSelectedReport(report);
    };

    const handleClose = () => {
        setSelectedReport(null);
    };

    return (
        <div className="page-container" style={{ position: "relative" }}>
            <div>
                <h2 className="page-title">Saved AI Reports</h2>
                <div className="page-subtitle">Access your historical product analysis interactions securely logged for auditability</div>
            </div>

            <div className="dashboard-card" style={{ padding: "0" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
                ) : reports.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", color: "#6b7280" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                        <h3 style={{ margin: 0, color: "#111" }}>No Reports Yet</h3>
                        <p style={{ marginTop: "8px", maxWidth: "400px", textAlign: "center" }}>
                            You haven't generated or saved any analysis reports yet. Ask the AI Assistant for insights and save them to build your audit log.
                        </p>
                    </div>
                ) : (
                    <div className="list-container" style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", minWidth: "800px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #eaeaea", color: "#6b7280", backgroundColor: "#f9fafb" }}>
                                    <th style={{ padding: "16px 24px", fontWeight: 500, width: "180px" }}>Date</th>
                                    <th style={{ padding: "16px 24px", fontWeight: 500, width: "220px" }}>Product Analysed</th>
                                    <th style={{ padding: "16px 24px", fontWeight: 500 }}>Question Promoted</th>
                                    <th style={{ padding: "16px 24px", fontWeight: 500, width: "140px", textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(r => (
                                    <tr key={r._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "16px 24px", color: "#4b5563" }}>
                                            {new Date(r.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "16px 24px", fontWeight: 500, color: "#111827" }}>
                                            {r.product_name}
                                        </td>
                                        <td style={{ padding: "16px 24px", color: "#4b5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}>
                                            {r.question}
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                                            <button
                                                className="minimal-button"
                                                onClick={() => handleView(r)}
                                                style={{ width: "auto", padding: "6px 12px", fontSize: "12px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                                            >
                                                View Analysis
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {selectedReport && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        width: "100%",
                        maxWidth: "800px",
                        maxHeight: "90vh",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", color: "#111827" }}>Report Analysis: {selectedReport.product_name}</h3>
                                <p style={{ margin: 0, marginTop: "4px", fontSize: "12px", color: "#6b7280" }}>Executed at {new Date(selectedReport.timestamp).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#9ca3af" }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ padding: "24px", overflowY: "auto", backgroundColor: "#f9fafb" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <span style={{ fontWeight: 600, color: "#374151" }}>User Prompt: </span>
                                <div style={{ marginTop: "8px", padding: "12px", backgroundColor: "#eff6ff", color: "#1e3a8a", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                                    {selectedReport.question}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontWeight: 600, color: "#374151" }}>AI Generation Context: </span>
                                <div style={{
                                    marginTop: "8px",
                                    padding: "20px",
                                    backgroundColor: "#fff",
                                    color: "#111827",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                    whiteSpace: "pre-wrap",
                                    lineHeight: "1.6"
                                }}>
                                    {selectedReport.response}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "16px 24px", borderTop: "1px solid #eaeaea", display: "flex", justifyContent: "flex-end" }}>
                            <button className="minimal-button" onClick={handleClose} style={{ width: "auto", padding: "8px 24px", backgroundColor: "#4b5563" }}>
                                Close Audit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
