import { Link } from "react-router-dom";
import "./Home.css";

const PARTICULAS = Array.from({ length: 24 }, (_, index) => index + 1);

function Home() {
  const iniciarPartida = () => {
    sessionStorage.removeItem("potionPanicPuntos");
    sessionStorage.removeItem("potionPanicNivelesCompletados");
    sessionStorage.removeItem("potionPanicIniciada");
  };

  return (
    <main className="home">
      <div className="home-magic-field" aria-hidden="true">
        <div className="home-magic-circle home-magic-circle-one" />
        <div className="home-magic-circle home-magic-circle-two" />
        <div className="home-magic-rune home-magic-rune-one">✦</div>
        <div className="home-magic-rune home-magic-rune-two">◇</div>
        <div className="home-magic-rune home-magic-rune-three">✧</div>

        {PARTICULAS.map((particle) => (
          <span
            key={particle}
            className={`home-particle home-particle-${particle}`}
          />
        ))}
      </div>

      <div className="home-orbit home-orbit-one" aria-hidden="true" />
      <div className="home-orbit home-orbit-two" aria-hidden="true" />
      <div className="home-glow home-glow-one" aria-hidden="true" />
      <div className="home-glow home-glow-two" aria-hidden="true" />
      <div className="home-vignette" aria-hidden="true" />

      <section className="home-content">
        <div className="home-hero">
          <div className="home-kicker">
            <span className="home-kicker-line" />
            LABORATORIO DE ALQUIMIA
            <span className="home-kicker-line" />
          </div>

          <div className="home-title-wrap">
            <div className="home-title-aura" aria-hidden="true" />
            <span className="home-title-shadow" aria-hidden="true">
              Potion Panic
            </span>
            <h1>Potion Panic</h1>
            <div className="home-title-underline" aria-hidden="true">
              <span />
            </div>
          </div>

          <p className="home-description">
            Prepara pociones mágicas, encuentra los ingredientes correctos
            y sobrevive al caos del laboratorio antes de que se acabe el tiempo.
          </p>

          <div className="home-buttons">
            <Link
              to="/juego/1"
              className="primary-button"
              onClick={iniciarPartida}
            >
              <span>Comenzar partida</span>
              <span className="primary-button-arrow" aria-hidden="true">→</span>
            </Link>

            <Link to="/instrucciones" className="secondary-button">
              Cómo jugar
            </Link>

            <Link to="/puntajes" className="secondary-button">
              Puntuaciones
            </Link>
          </div>
        </div>

        <div className="home-stats" aria-label="Información del juego">
          <div className="home-stat">
            <strong>5</strong>
            <span>Niveles</span>
          </div>
          <div className="home-stat">
            <strong>15</strong>
            <span>Recetas</span>
          </div>
          <div className="home-stat">
            <strong>35</strong>
            <span>Máx. ingredientes</span>
          </div>
        </div>

        <div className="home-features">
          <article className="home-feature">
            <span className="home-feature-number">01</span>
            <div>
              <h2>Encuentra</h2>
              <p>Localiza los ingredientes necesarios entre todos los elementos del tablero.</p>
            </div>
          </article>

          <article className="home-feature">
            <span className="home-feature-number">02</span>
            <div>
              <h2>Evita</h2>
              <p>Los venenos cuestan vidas y los ingredientes incorrectos reducen tu puntuación.</p>
            </div>
          </article>

          <article className="home-feature">
            <span className="home-feature-number">03</span>
            <div>
              <h2>Domina</h2>
              <p>Completa las recetas, supera los niveles y consigue un lugar en las puntuaciones.</p>
            </div>
          </article>
        </div>

        <p className="home-footer">
          Una partida de precisión, velocidad y alquimia.
        </p>
      </section>
    </main>
  );
}

export default Home;
