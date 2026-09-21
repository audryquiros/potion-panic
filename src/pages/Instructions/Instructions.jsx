import { Link } from "react-router-dom";
import "./Instructions.css";

function Instructions() {
  return (
    <main className="instructions-page">
      <section className="instructions-card">
        <p className="page-label">HOW TO PLAY</p>

        <h1>Instructions</h1>

        <p>
          Prepare the required potion by collecting the correct ingredients
          before the timer reaches zero.
        </p>

        <ul>
          <li>Identify the ingredients required by the recipe.</li>
          <li>Click on the correct ingredients.</li>
          <li>Watch them fall into the cauldron.</li>
          <li>Avoid incorrect or dangerous ingredients.</li>
          <li>Complete the potion before time runs out.</li>
        </ul>

        <div className="instructions-actions">
          <Link to="/" className="secondary-button">
            Back to Home
          </Link>

          <Link to="/juego/1" className="primary-button">
            Start Game
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Instructions;