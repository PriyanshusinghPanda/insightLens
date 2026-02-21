import { useEffect, useState } from "react";
import { getAnalyticsData } from "../api";
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

    useEffect(() => {
        getAnalyticsData(token).then(res => setData(res.data)).catch(console.error);
    }, [token]);

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
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: { family: 'Inter, sans-serif' } } },
            tooltip: { backgroundColor: '#fff', titleColor: '#111', bodyColor: '#444', borderColor: '#eaeaea', borderWidth: 1 }
        },
        scales: {
            y: { beginAtZero: true, max: 100, grid: { borderDash: [4, 4], color: '#f3f4f6' } },
            x: { grid: { borderDash: [4, 4], color: '#f3f4f6' } }
        }
    };

    return (
        <div className="page-container">
            <div>
                <h2 className="page-title">Analytics</h2>
                <div className="page-subtitle">Deep dive into NPS trends, sentiment, and rating distributions</div>
            </div>

            <div className="dashboard-card" style={{ padding: "0" }}>
                {/* Trend Graph Section */}
                <div style={{ padding: "32px 40px", height: "400px", position: "relative" }}>
                    <h3 className="card-title" style={{ fontSize: "14px" }}>NPS Trend Over Time</h3>
                    <div style={{ height: "300px" }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Highlight Banner Section */}
                <div className="analytics-banner">
                    <b>Current NPS: {data.current_nps}</b> - Indicating customer loyalty based on the distribution of your latest product reviews.
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
                    <div style={{ padding: "0 20px" }}>
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
        </div>
    );
}
