import { useEffect, useState } from "react";
import { getNPS, getSentiment } from "../api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const [nps, setNps] = useState(0);
  const productId = 1;

  useEffect(() => {
    getNPS(productId, token).then(res => setNps(res.data.nps_score)).catch(e => console.error(e));
  }, [token]);

  // Mock Category Performance Data
  const chartData = {
    labels: ['Electronics', 'Home & Kitchen', 'Books', 'Sports'],
    datasets: [
      {
        label: 'NPS Score',
        data: [56, 57, 73, 48],
        backgroundColor: '#3b82f6', // Blue
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Avg Rating',
        data: [4.3, 4.0, 4.8, 3.9],
        backgroundColor: '#10b981', // Green
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter, sans-serif' } } },
      tooltip: { backgroundColor: '#fff', titleColor: '#111', bodyColor: '#444', borderColor: '#eaeaea', borderWidth: 1 }
    },
    scales: {
      y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  };

  const topProducts = [
    { rank: 1, name: "Air Fryer XL", category: "Home & Kitchen", nps: 82, rating: 4.7 },
    { rank: 2, name: "iPhone 13 Pro", category: "Electronics", nps: 68, rating: 4.5 },
    { rank: 3, name: "Samsung Galaxy S21", category: "Electronics", nps: 54, rating: 4.2 },
  ];

  const badProducts = [
    { name: "Coffee Maker X", category: "Home & Kitchen", nps: 12, rating: 2.1 },
    { name: "Gaming Headset", category: "Electronics", nps: 18, rating: 2.5 },
    { name: "Samsung Galaxy S10", category: "Electronics", nps: 22, rating: 2.8 },
  ];

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <div className="page-subtitle">Overview of your product sentiment and analytics</div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card full-width" style={{ position: "relative", height: "400px" }}>
          <h3 className="card-title">Category Performance</h3>
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="dashboard-card">
          <h3 className="card-title green">↗ Top Performing Products</h3>
          <div className="list-container">
            {topProducts.map((p, i) => (
              <div className="list-item" key={i}>
                <div className="list-badge green">{p.rank}</div>
                <div className="list-content">
                  <h4 className="list-title">{p.name}</h4>
                  <p className="list-subtitle">{p.category}</p>
                </div>
                <div className="list-stats">
                  <p className="list-stat-primary green">NPS: {p.nps}</p>
                  <p className="list-stat-secondary">⭐ {p.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title red">↘ Products Needing Attention</h3>
          <div className="list-container">
            {badProducts.map((p, i) => (
              <div className="list-item" key={i}>
                <div className="list-badge red">!</div>
                <div className="list-content">
                  <h4 className="list-title">{p.name}</h4>
                  <p className="list-subtitle">{p.category}</p>
                </div>
                <div className="list-stats">
                  <p className="list-stat-primary red">NPS: {p.nps}</p>
                  <p className="list-stat-secondary">⭐ {p.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}