import { useEffect, useState } from "react";
import { getDashboardStats } from "../api";
import { Bar, Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    category_performance: [],
    top_products: [],
    bad_products: [],
    kpis: { nps: 0, total_reviews: 0, happy_pct: 0, worst_product: "Loading..." },
    satisfaction: { happy: 0, unhappy: 0 },
    rating_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
  });

  useEffect(() => {
    getDashboardStats(token).then(res => {
      if (res.data.kpis) {
        setStats(res.data);
      }
    }).catch(e => console.error(e));
  }, [token]);

  // Category Bar Chart
  const categoryData = {
    labels: stats.category_performance.map(c => c.category),
    datasets: [
      {
        label: 'NPS Score',
        data: stats.category_performance.map(c => c.nps),
        backgroundColor: '#3b82f6',
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
    },
    scales: {
      y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  };

  // Satisfaction Pie Chart
  const pieData = {
    labels: ['Happy Customers', 'Unhappy Customers'],
    datasets: [{
      data: [stats.satisfaction.happy, stats.satisfaction.unhappy],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0,
    }]
  };

  // Rating Distribution Bar Chart
  const distributionData = {
    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
    datasets: [{
      label: 'Review Count',
      data: [
        stats.rating_distribution["1"],
        stats.rating_distribution["2"],
        stats.rating_distribution["3"],
        stats.rating_distribution["4"],
        stats.rating_distribution["5"]
      ],
      backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'],
    }]
  };

  const topProducts = stats.top_products.map((p, i) => ({ ...p, rank: i + 1 }));
  const badProducts = stats.bad_products;

  return (
    <div className="page-container">
      <div>
        <h2 className="page-title">Executive Dashboard</h2>
        <div className="page-subtitle">High-level health view of the product ecosystem</div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "24px" }}>
        <div className="dashboard-card" style={{ textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Overall NPS Score</p>
          <h2 style={{ fontSize: "2.5rem", color: "#3b82f6", margin: 0 }}>{stats.kpis.nps}</h2>
        </div>
        <div className="dashboard-card" style={{ textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Total Reviews</p>
          <h2 style={{ fontSize: "2.5rem", color: "#111827", margin: 0 }}>{stats.kpis.total_reviews}</h2>
        </div>
        <div className="dashboard-card" style={{ textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>% Happy Customers</p>
          <h2 style={{ fontSize: "2.5rem", color: "#10b981", margin: 0 }}>{stats.kpis.happy_pct}%</h2>
        </div>
        <div className="dashboard-card" style={{ textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Worst Performing Product</p>
          <h2 style={{ fontSize: "1.25rem", color: "#ef4444", margin: 0, marginTop: "12px", padding: "0 10px", lineHeight: "1.4" }}>
            {stats.kpis.worst_product}
          </h2>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card" style={{ position: "relative", height: "350px" }}>
          <h3 className="card-title">Satisfaction Split</h3>
          <div style={{ padding: "20px", height: "calc(100% - 40px)", display: "flex", justifyContent: "center" }}>
            <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="dashboard-card" style={{ position: "relative", height: "350px" }}>
          <h3 className="card-title">Rating Distribution</h3>
          <Bar data={distributionData} options={chartOptions} />
        </div>

        <div className="dashboard-card full-width" style={{ position: "relative", height: "350px" }}>
          <h3 className="card-title">Category Performance (NPS)</h3>
          <Bar data={categoryData} options={chartOptions} />
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
          <h3 className="card-title red">↘ Needs Attention</h3>
          <div className="list-container">
            {badProducts.map((p, i) => (
              <div className="list-item" key={i} style={{ alignItems: "center" }}>
                <div className="list-badge red">!</div>
                <div className="list-content">
                  <h4 className="list-title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>{p.name}</h4>
                  <p className="list-subtitle">{p.category}</p>
                </div>
                <button
                  className="minimal-button"
                  style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "#ef4444", width: "auto" }}
                  onClick={() => navigate('/chat')}
                >
                  Analyze with AI →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}