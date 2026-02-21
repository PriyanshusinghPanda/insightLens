import { useEffect, useState } from "react";
import { getNPS, getSentiment } from "../api";
import { Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const [sentiment, setSentiment] = useState({ happy: 0, unhappy: 0 });
  const [nps, setNps] = useState(0);

  const productId = 1; // demo product
  const navigate = useNavigate();

  useEffect(() => {
    getSentiment(productId, token).then(res => setSentiment(res.data));
    getNPS(productId, token).then(res => setNps(res.data.nps_score));
  }, []);

  const data = {
    labels: ["Happy", "Unhappy"],
    datasets: [
      {
        data: [sentiment.happy, sentiment.unhappy],
      },
    ],
  };

  return (
    <div className="app-container page-container">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <div className="page-subtitle">NPS Score: {nps}</div>
      </div>

      <div className="dashboard-card" style={{ width: "fit-content" }}>
        <h3 style={{ fontSize: "14px", marginTop: 0, marginBottom: "16px", fontWeight: 500 }}>Customer Sentiment</h3>
        <div style={{ width: 240 }}>
          <Pie
            data={data}
            options={{
              plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: { family: 'Inter, sans-serif' } } }
              }
            }}
          />
        </div>
      </div>

      <button className="minimal-button secondary" onClick={() => navigate("/chat")} style={{ width: "fit-content" }}>
        Go to AI Analysis Chat
      </button>
    </div>
  );
}