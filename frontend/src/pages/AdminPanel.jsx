import { useEffect, useState } from "react";
import { getUsers, assignCategory, revokeCategory, getAdminCategories } from "../api";

const ROLE_COLORS = {
  admin: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  analyst: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" }
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: "20px", fontSize: "11px",
      fontWeight: 600, backgroundColor: c.bg, color: c.color,
      border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: "0.04em"
    }}>
      {role}
    </span>
  );
}

function CategoryTag({ category, onRevoke, userId }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "2px 8px", borderRadius: "6px", fontSize: "12px",
      backgroundColor: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff",
      margin: "2px"
    }}>
      {category}
      {onRevoke && (
        confirming ? (
          <>
            <button onClick={() => { onRevoke(userId, category); setConfirming(false); }}
              style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "3px", padding: "0 5px", fontSize: "11px", cursor: "pointer" }}>
              ✓
            </button>
            <button onClick={() => setConfirming(false)}
              style={{ background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "3px", padding: "0 5px", fontSize: "11px", cursor: "pointer" }}>
              ✗
            </button>
          </>
        ) : (
          <button onClick={() => setConfirming(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "0 2px", fontSize: "12px", lineHeight: 1 }}
            title="Revoke this category"
          >×</button>
        )
      )}
    </span>
  );
}

export default function AdminPanel() {
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [loadingUsers, setLoadingUsers] = useState(true);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "info" }), 4000);
  };

  const fetchData = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, catsRes] = await Promise.all([
        getUsers(token),
        getAdminCategories(token).catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      setCategories(catsRes.data);
    } catch {
      showMsg("Failed to load users.", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleAssign = async () => {
    if (!selectedUser || !selectedCategory) {
      showMsg("Please select both an analyst and a category.", "error");
      return;
    }
    try {
      const res = await assignCategory(token, selectedUser, selectedCategory);
      showMsg(res.data.message || "Category assigned.");
      setSelectedUser("");
      setSelectedCategory("");
      fetchData();
    } catch (e) {
      showMsg(e.response?.data?.detail || "Failed to assign category.", "error");
    }
  };

  const handleRevoke = async (userId, category) => {
    try {
      const res = await revokeCategory(token, userId, category);
      showMsg(res.data.message || "Category revoked.");
      fetchData();
    } catch (e) {
      showMsg(e.response?.data?.detail || "Failed to revoke category.", "error");
    }
  };

  const analysts = users.filter(u => u.role === "analyst");
  const selectedAnalyst = analysts.find(a => a._id === selectedUser);
  const unassignedCategories = categories.filter(
    c => !selectedAnalyst?.assigned_categories?.includes(c)
  );

  const msgStyle = {
    padding: "10px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px",
    backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
    color: message.type === "error" ? "#dc2626" : "#16a34a",
    border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
    borderLeft: `4px solid ${message.type === "error" ? "#ef4444" : "#10b981"}`
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">Admin Panel</h2>
        <div className="page-subtitle">Manage users and control analyst category permissions</div>
      </div>

      {message.text && <div style={msgStyle}>{message.text}</div>}

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {[
          { label: "Total Users", value: users.length, icon: "👥", color: "#6366f1" },
          { label: "Analysts", value: analysts.length, icon: "🔍", color: "#10b981" },
          { label: "Total Categories", value: categories.length, icon: "🗂️", color: "#f59e0b" }
        ].map(k => (
          <div key={k.label} className="dashboard-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ fontSize: "24px" }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>

        {/* ── User Table ───────────────────────────────────── */}
        <div className="dashboard-card" style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginTop: 0, marginBottom: "16px", color: "#111", display: "flex", alignItems: "center", gap: "8px" }}>
            👥 All Users
          </h3>
          {loadingUsers ? (
            <div style={{ color: "#9ca3af", fontSize: "14px" }}>Loading...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "8px 0", textAlign: "left", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "8px 0", textAlign: "left", fontWeight: 600, width: "80px" }}>Role</th>
                  <th style={{ padding: "8px 0", textAlign: "left", fontWeight: 600 }}>Assigned Categories</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 0", fontSize: "13px", fontWeight: 500, color: "#111" }}>{u.email}</td>
                    <td style={{ padding: "12px 0" }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: "12px 0" }}>
                      {u.role === "analyst" ? (
                        u.assigned_categories?.length > 0
                          ? u.assigned_categories.map(c => (
                            <CategoryTag key={c} category={c} userId={u._id} onRevoke={handleRevoke} />
                          ))
                          : <span style={{ fontSize: "12px", color: "#d1d5db" }}>No categories</span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>Full access</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Assign Category Panel ─────────────────────────── */}
        <div className="dashboard-card" style={{ padding: "20px 24px", height: "fit-content" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginTop: 0, marginBottom: "20px", color: "#111" }}>
            🔑 Assign Category Access
          </h3>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Select Analyst
            </label>
            <select
              className="minimal-input"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">-- Choose analyst --</option>
              {analysts.map(a => (
                <option key={a._id} value={a._id}>{a.email}</option>
              ))}
            </select>
          </div>

          {selectedAnalyst && selectedAnalyst.assigned_categories?.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Currently Assigned
              </div>
              <div>
                {selectedAnalyst.assigned_categories.map(c => (
                  <CategoryTag key={c} category={c} userId={selectedAnalyst._id} onRevoke={handleRevoke} />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Select Category
            </label>
            <select
              className="minimal-input"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">-- Choose category --</option>
              {(selectedUser ? unassignedCategories : categories).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {selectedUser && unassignedCategories.length === 0 && categories.length > 0 && (
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "6px" }}>
                ✓ All categories already assigned to this analyst
              </div>
            )}
          </div>

          <button
            className="minimal-button"
            onClick={handleAssign}
            disabled={!selectedUser || !selectedCategory}
            style={{ opacity: (!selectedUser || !selectedCategory) ? 0.5 : 1 }}
          >
            Assign Category Access
          </button>
        </div>
      </div>
    </div>
  );
}
