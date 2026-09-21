import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <main className="home">
      <section className="home-content">
        <p className="home-subtitle">LABORATORIO DE ALQUIMIA</p>

        <h1>Potion Panic</h1>

        <p className="home-description">
          Prepara pociones mágicas antes de que se acabe el tiempo.
        </p>

        <div className="home-buttons">
          <Link to="/juego/1" className="primary-button">
            Jugar
          </Link>

          <Link to="/instrucciones" className="secondary-button">
            Instrucciones
          </Link>

          <Link to="/puntajes" className="secondary-button">
            Puntuaciones
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;