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
    const chartData = {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
        datasets: [
            {
                label: 'NPS Score',
                data: [45, 52, 58, 55, 60, 68],
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
                    <b>Current NPS: 68</b> - Indicating strong customer loyalty. An NPS above 50 is excellent. Continue monitoring trends to maintain this performance.
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card" style={{ height: "300px" }}>
                    <h3 className="card-title" style={{ fontSize: "14px" }}>Customer Satisfaction</h3>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80%", color: "#888" }}>
                        Not enough data available.
                    </div>
                </div>

                <div className="dashboard-card" style={{ height: "300px" }}>
                    <h3 className="card-title" style={{ fontSize: "14px" }}>Rating Distribution</h3>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80%", color: "#888" }}>
                        Not enough data available.
                    </div>
                </div>
            </div>
        </div>
    );
}
