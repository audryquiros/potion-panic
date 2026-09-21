import { Link } from "react-router-dom";
import "./Scores.css";

function Scores() {
  return (
    <main className="scores-page">
      <section className="scores-card">
        <p className="page-label">LEADERBOARD</p>

        <h1>Scores</h1>

        <p>No scores yet.</p>

        <Link to="/" className="secondary-button">
          Back to Home
        </Link>
      </section>
    </main>
  );
}

export default Scores;