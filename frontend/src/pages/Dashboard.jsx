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
    <div style={{ padding: 30 }}>
      <h2>Dashboard</h2>
      <h3>NPS Score: {nps}</h3>

      <div style={{ width: 300 }}>
        <Pie data={data} />
      </div>

      <br />
      <button onClick={() => navigate("/chat")}>
        Go to AI Analysis Chat
      </button>
    </div>
  );
}