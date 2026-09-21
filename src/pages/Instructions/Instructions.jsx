import { Link } from "react-router-dom";
import "./Instructions.css";

function Instructions() {
  return (
    <main className="instructions-page">
      <section className="instructions-card">
        <p className="page-label">CÓMO JUGAR</p>

        <h1>Instrucciones</h1>

        <p>
          Prepara la poción indicada reuniendo los ingredientes correctos
          antes de que el tiempo llegue a cero.
        </p>

        <ul>
          <li>Identifica los ingredientes que necesita la receta.</li>
          <li>Haz clic en los ingredientes correctos.</li>
          <li>Observa cómo caen dentro del caldero.</li>
          <li>Evita los ingredientes incorrectos o peligrosos.</li>
          <li>Completa la poción antes de que se acabe el tiempo.</li>
        </ul>

        <div className="instructions-actions">
          <Link to="/" className="secondary-button">
            Volver al inicio
          </Link>

          <Link to="/juego/1" className="primary-button">
            Comenzar juego
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Instructions;