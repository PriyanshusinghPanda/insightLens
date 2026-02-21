import React from "react";

export default function Reports() {
    return (
        <div className="page-container">
            <div>
                <h2 className="page-title">Past Reports</h2>
                <div className="page-subtitle">View and manage your saved analytical reports</div>
            </div>

            <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#6b7280" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                <h3 style={{ margin: 0, color: "#111" }}>No Reports Yet</h3>
                <p style={{ marginTop: "8px", maxWidth: "400px", textAlign: "center" }}>
                    You haven't generated or saved any analysis reports yet. Ask the AI Chat for insights and save them here for future reference.
                </p>
            </div>
        </div>
    );
}
