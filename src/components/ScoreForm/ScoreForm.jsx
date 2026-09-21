import { useState } from "react";
import { guardarPuntaje } from "../../services/api";
import "./ScoreForm.css";

function ScoreForm({
  puntos,
  nivel,
  nivelesCompletados,
  resultado,
  onSaved
}) {
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      setError("Escribe un nombre para continuar.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await guardarPuntaje({
        nombre: nombreLimpio,
        puntos,
        nivel,
        nivelesCompletados,
        resultado,
        fecha: new Date().toISOString()
      });

      onSaved();
    } catch (err) {
      setError(
        "No se pudo guardar la puntuación. Inténtalo de nuevo."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="score-form">
      <div className="score-form-header">
        <span className="score-form-label">
          Registrar resultado
        </span>

        <h3>
          Escribe tu nombre
        </h3>

        <p>
          Guarda tu resultado en la tabla de puntuaciones.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="player-name">
          Nombre
        </label>

        <input
          id="player-name"
          type="text"
          value={nombre}
          onChange={(event) =>
            setNombre(event.target.value)
          }
          placeholder="Escribe tu nombre"
          maxLength={20}
          autoComplete="off"
          disabled={guardando}
        />

        {error && (
          <p className="score-form-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
        >
          {guardando
            ? "Guardando..."
            : "Guardar puntuación"}
        </button>
      </form>
    </div>
  );
}

export default ScoreForm;