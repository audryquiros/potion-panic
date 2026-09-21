import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <main className="home">
      <section className="home-content">
        <p className="home-subtitle">ALCHEMY LABORATORY</p>

        <h1>Potion Panic</h1>

        <p className="home-description">
          Prepare magical potions before time runs out.
        </p>

        <div className="home-buttons">
          <Link to="/juego/1" className="primary-button">
            Play
          </Link>

          <Link to="/instrucciones" className="secondary-button">
            Instructions
          </Link>

          <Link to="/puntajes" className="secondary-button">
            Scores
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;