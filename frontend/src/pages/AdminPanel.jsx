import { useEffect, useState } from "react";
import { getUsers, assignCategory } from "../api";

export default function AdminPanel() {
    const token = localStorage.getItem("token");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [message, setMessage] = useState("");

    const categories = [
        "Amazon Devices",
        "Kindle Store",
        "Electronics",
        "Home & Kitchen",
        "Beauty & Personal Care",
        "Sports & Outdoors",
        "Toys & Games",
        "Books",
        "Clothing, Shoes & Jewelry",
        "Health & Household"
    ];

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        try {
            const res = await getUsers(token);
            setUsers(res.data);
        } catch (e) {
            console.error(e);
            setMessage("Failed to load users.");
        }
    };

    const handleAssign = async () => {
        if (!selectedUser || !selectedCategory) {
            setMessage("Please select both a user and a category.");
            return;
        }
        try {
            const res = await assignCategory(token, selectedUser, selectedCategory);
            setMessage(res.data.message || "Category assigned successfully.");
        } catch (e) {
            console.error(e);
            setMessage(e.response?.data?.detail || "Failed to assign category.");
        }
    };

    const analysts = users.filter(u => u.role === "analyst");

    return (
        <div className="page-container">
            <div>
                <h2 className="page-title">Admin Panel</h2>
                <div className="page-subtitle">Manage users and assign category permissions</div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card" style={{ gridColumn: "span 2" }}>
                    <h3 className="card-title">Section 1: Manage Users</h3>
                    <div className="list-container">
                        {users.length === 0 ? (
                            <p>No users found or loading...</p>
                        ) : (
                            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", marginTop: "1rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #eaeaea", color: "#6b7280" }}>
                                        <th style={{ padding: "8px 0" }}>Email</th>
                                        <th style={{ padding: "8px 0" }}>Role</th>
                                        <th style={{ padding: "8px 0" }}>ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={{ borderBottom: "1px solid #f9fafb" }}>
                                            <td style={{ padding: "12px 0", fontWeight: 500 }}>{u.email}</td>
                                            <td style={{ padding: "12px 0" }}>
                                                <span className={`list-badge ${u.role === "admin" ? "blue" : "green"}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 0", color: "#9ca3af", fontSize: "12px" }}>{u._id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="dashboard-card" style={{ gridColumn: "span 1" }}>
                    <h3 className="card-title">Section 2: Assign Categories</h3>
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {message && (
                            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#f3f4f6", color: "#1f2937", fontSize: "14px", borderLeft: "4px solid #3b82f6" }}>
                                {message}
                            </div>
                        )}

                        <div>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#374151", fontWeight: 500 }}>Select Analyst</label>
                            <select className="minimal-input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                                <option value="">-- Choose Analyst --</option>
                                {analysts.map(a => (
                                    <option key={a._id} value={a._id}>{a.email}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#374151", fontWeight: 500 }}>Select Category</label>
                            <select className="minimal-input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                <option value="">-- Choose Category --</option>
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <button className="minimal-button" onClick={handleAssign} style={{ marginTop: "8px" }}>
                            Assign Category Role
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
