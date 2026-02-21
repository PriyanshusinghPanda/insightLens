import { useEffect, useState } from "react";
import { getDashboardStats } from "../api";
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
  const [stats, setStats] = useState({
    category_performance: [],
    top_products: [],
    bad_products: []
  });

  useEffect(() => {
    getDashboardStats(token).then(res => setStats(res.data)).catch(e => console.error(e));
  }, [token]);

  // Real Category Performance Data
  const chartData = {
    labels: stats.category_performance.map(c => c.category),
    datasets: [
      {
        label: 'NPS Score',
        data: stats.category_performance.map(c => c.nps),
        backgroundColor: '#3b82f6', // Blue
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Avg Rating',
        data: stats.category_performance.map(c => c.avg_rating),
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

  const topProducts = stats.top_products.map((p, i) => ({ ...p, rank: i + 1 }));
  const badProducts = stats.bad_products;

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