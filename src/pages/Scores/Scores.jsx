import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  getPuntajes
} from "../../services/api";

import "./Scores.css";

function Scores() {
  const [puntajes, setPuntajes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const cargarPuntajes = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getPuntajes();

        const ordenados =
          [...data].sort(
            (a, b) =>
              Number(b.puntos) -
              Number(a.puntos)
          );

        setPuntajes(
          ordenados
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarPuntajes();
  }, []);

  return (
    <main className="scores-page">
      <header className="scores-header">
        <div>
          <p className="scores-eyebrow">
            Potion Panic
          </p>

          <h1>
            Puntuaciones
          </h1>
        </div>

        <Link
          to="/"
          className="scores-back-button"
        >
          Volver al inicio
        </Link>
      </header>

      <section className="scores-content">
        <div className="scores-title">
          <span>
            Tabla de alquimistas
          </span>

          <h2>
            Mejores resultados
          </h2>
        </div>

        {loading && (
          <div className="scores-message">
            Cargando puntuaciones...
          </div>
        )}

        {error && (
          <div className="scores-message scores-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          puntajes.length === 0 && (
            <div className="scores-message">
              Todavía no hay puntuaciones.
            </div>
          )}

        {!loading &&
          !error &&
          puntajes.length > 0 && (
            <div className="scores-table">
              <div className="scores-row scores-row-header">
                <span>
                  #
                </span>

                <span>
                  Nombre
                </span>

                <span>
                  Nivel
                </span>

                <span>
                  Puntos
                </span>
              </div>

              {puntajes.map(
                (puntaje, index) => (
                  <div
                    key={
                      puntaje.id
                    }
                    className="scores-row"
                  >
                    <span className="score-position">
                      {index + 1}
                    </span>

                    <span className="score-name">
                      {puntaje.nombre}
                    </span>

                    <span>
                      {puntaje.nivel}
                    </span>

                    <strong>
                      {puntaje.puntos}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}

      </section>
    </main>
  );
}

export default Scores;