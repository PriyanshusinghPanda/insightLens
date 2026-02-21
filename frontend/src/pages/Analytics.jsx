import { useEffect, useState } from "react";
import { getAnalyticsData, getProducts, getInsights } from "../api";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function Analytics() {
    const token = localStorage.getItem("token");
    const [data, setData] = useState({
        current_nps: 0,
        trend: [0, 0, 0, 0, 0, 0],
        distribution: {}
    });

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Filters
    const [selectedCat, setSelectedCat] = useState("");
    const [selectedProd, setSelectedProd] = useState("");

    // AI Insights
    const [insights, setInsights] = useState("");
    const [loadingInsights, setLoadingInsights] = useState(false);

    useEffect(() => {
        getProducts(token).then(res => {
            setProducts(res.data);
            const uniqueCats = [...new Set(res.data.map(p => p.category))];
            setCategories(uniqueCats);
        }).catch(console.error);
    }, [token]);

    useEffect(() => {
        getAnalyticsData(token, selectedCat, selectedProd).then(res => {
            setData(res.data);
            setInsights(""); // Clear insights when data changes
        }).catch(console.error);
    }, [token, selectedCat, selectedProd]);

    const handleGenerateInsights = async () => {
        setLoadingInsights(true);
        try {
            const res = await getInsights(token, selectedCat || null, selectedProd || null);
            setInsights(res.data.insights);
        } catch (e) {
            console.error(e);
            setInsights("Failed to generate AI insights.");
        } finally {
            setLoadingInsights(false);
        }
    };

    const chartData = {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
        datasets: [
            {
                label: 'NPS Score',
                data: data.trend,
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f6',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6 } }
        },
        scales: {
            y: { beginAtZero: true, max: 100, grid: { borderDash: [4, 4], color: '#f3f4f6' } },
            x: { grid: { borderDash: [4, 4], color: '#f3f4f6' } }
        }
    };

    const filteredProducts = selectedCat
        ? products.filter(p => p.category === selectedCat)
        : products;

    return (
        <div className="page-container">
            <div>
                <h2 className="page-title">Analytics Deep Dive</h2>
                <div className="page-subtitle">Granular performance filters and custom AI interpretations</div>
            </div>

            {/* Filter Controls */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "24px" }}>
                <div className="dashboard-card" style={{ padding: "16px 24px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>Filter by Category</label>
                    <select
                        className="minimal-input"
                        value={selectedCat}
                        onChange={(e) => { setSelectedCat(e.target.value); setSelectedProd(""); }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="dashboard-card" style={{ padding: "16px 24px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>Filter by Product</label>
                    <select
                        className="minimal-input"
                        value={selectedProd}
                        onChange={(e) => setSelectedProd(e.target.value)}
                    >
                        <option value="">All Products</option>
                        {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="dashboard-card" style={{ padding: "0" }}>
                {/* Trend Graph Section */}
                <div style={{ padding: "32px 40px", height: "400px", position: "relative" }}>
                    <h3 className="card-title" style={{ fontSize: "14px" }}>NPS Trend Over Time</h3>
                    <div style={{ height: "300px" }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card" style={{ height: "300px" }}>
                    <h3 className="card-title" style={{ fontSize: "14px" }}>Customer Satisfaction</h3>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80%", color: "#111" }}>
                        <h1 style={{ fontSize: "48px", margin: 0, color: data.current_nps > 0 ? "#10b981" : "#dc2626" }}>
                            {data.current_nps > 0 ? "Positive" : "Negative"}
                        </h1>
                        <p style={{ color: "#6b7280", marginTop: "12px" }}>Overall Net Promoter Score: {data.current_nps}</p>
                    </div>
                </div>

                <div className="dashboard-card" style={{ height: "300px" }}>
                    <h3 className="card-title" style={{ fontSize: "14px" }}>Rating Distribution</h3>
                    <div style={{ padding: "0 20px", marginTop: "20px" }}>
                        {["5", "4", "3", "2", "1"].map(star => {
                            const maxDist = Math.max(...Object.values(data.distribution), 1);
                            const val = data.distribution[star] || 0;
                            const percentage = (val / maxDist) * 100;

                            return (
                                <div key={star} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                    <span style={{ width: "40px", fontSize: "12px" }}>{star} Stars</span>
                                    <div style={{ flex: 1, backgroundColor: "#f3f4f6", height: "8px", borderRadius: "4px" }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            backgroundColor: "#fbbf24",
                                            height: "100%",
                                            borderRadius: "4px"
                                        }} />
                                    </div>
                                    <span style={{ width: "30px", fontSize: "12px", textAlign: "right" }}>{val}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="dashboard-card full-width" style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 className="card-title" style={{ margin: 0 }}>✨ AI Guided Insights</h3>
                    <button
                        className="minimal-button"
                        style={{ width: "auto", padding: "8px 16px", backgroundColor: "#8b5cf6" }}
                        onClick={handleGenerateInsights}
                        disabled={loadingInsights}
                    >
                        {loadingInsights ? "Generating..." : "Generate AI Insights"}
                    </button>
                </div>

                <div style={{
                    minHeight: "100px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    padding: "20px",
                    border: "1px solid #e5e7eb",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    color: "#374151"
                }}>
                    {insights || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Click 'Generate AI Insights' to automatically summarize the reviews across your current filter combination.</span>}
                </div>
            </div>
        </div>
    );
}
