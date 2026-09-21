import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Ingredient from "../../components/Ingredient/Ingredient";
import Cauldron from "../../components/Cauldron/Cauldron";
import ScoreForm from "../../components/ScoreForm/ScoreForm";
import {
  getIngredientes,
  getRecetas
} from "../../services/api";
import "./Game.css";

const CONFIGURACION_NIVELES = {
  1: {
    tiempo: 35,
    vidas: 3,
    ingredientesVolando: 7
  },
  2: {
    tiempo: 30,
    vidas: 3,
    ingredientesVolando: 8
  },
  3: {
    tiempo: 27,
    vidas: 3,
    ingredientesVolando: 9
  },
  4: {
    tiempo: 24,
    vidas: 2,
    ingredientesVolando: 11
  },
  5: {
    tiempo: 20,
    vidas: 2,
    ingredientesVolando: 15
  }
};

const POSICIONES_INGREDIENTES = [
  { top: "14%", left: "10%" },
  { top: "13%", left: "38%" },
  { top: "15%", left: "72%" },
  { top: "38%", left: "22%" },
  { top: "35%", left: "52%" },
  { top: "42%", left: "78%" },
  { top: "58%", left: "35%" },
  { top: "60%", left: "65%" },
  { top: "28%", left: "88%" },
  { top: "62%", left: "12%" },
  { top: "48%", left: "45%" },
  { top: "25%", left: "60%" },
  { top: "70%", left: "25%" },
  { top: "68%", left: "78%" }
];

const PATRONES_MOVIMIENTO = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8
];

function Game() {
  const { nivel } = useParams();
  const navigate = useNavigate();

  const nivelNumero = Number(nivel);

  const cauldronRef = useRef(null);
  const boardRef = useRef(null);

  const [ingredientes, setIngredientes] = useState([]);
  const [recetas, setRecetas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [indiceReceta, setIndiceReceta] = useState(0);

  const [ingredientesRecogidos, setIngredientesRecogidos] =
    useState([]);

  const [ingredienteRecogiendo, setIngredienteRecogiendo] =
    useState(null);

  const [flyDistance, setFlyDistance] = useState(null);

  const [puntos, setPuntos] = useState(() => {
    return Number(
      sessionStorage.getItem("potionPanicPuntos") || 0
    );
  });

  const [vidas, setVidas] = useState(() => {
    const config =
      CONFIGURACION_NIVELES[nivelNumero];

    return config?.vidas || 3;
  });

  const [tiempo, setTiempo] = useState(() => {
    const config =
      CONFIGURACION_NIVELES[nivelNumero];

    return config?.tiempo || 35;
  });

  const [mensaje, setMensaje] = useState("");

  const [estadoJuego, setEstadoJuego] =
    useState("jugando");

  const [nivelesCompletados, setNivelesCompletados] =
    useState(() => {
      return Number(
        sessionStorage.getItem(
          "potionPanicNivelesCompletados"
        ) || 0
      );
    });

  const configuracion =
    CONFIGURACION_NIVELES[nivelNumero];

  const recetasDelNivel = useMemo(() => {
    return recetas
      .filter(
        (receta) =>
          Number(receta.nivel) === nivelNumero
      )
      .sort(
        (a, b) =>
          Number(a.orden) - Number(b.orden)
      );
  }, [recetas, nivelNumero]);

  const recetaActual =
    recetasDelNivel[indiceReceta];

  const ingredientesDeLaReceta = useMemo(() => {
    if (!recetaActual) return [];

    return recetaActual.ingredientes
      .map((ingredienteId) =>
        ingredientes.find(
          (ingrediente) =>
            Number(ingrediente.id) ===
            Number(ingredienteId)
        )
      )
      .filter(Boolean);
  }, [
    recetaActual,
    ingredientes
  ]);

  const movementScale =
    {
      1: 0.55,
      2: 0.7,
      3: 0.85,
      4: 1,
      5: 1.15
    }[nivelNumero] || 0.55;

  const movementSpeed =
    {
      1: 12,
      2: 9,
      3: 7,
      4: 5,
      5: 3.8
    }[nivelNumero] || 12;

  const ingredientesVolando = useMemo(() => {
    if (
      ingredientes.length === 0 ||
      !configuracion
    ) {
      return [];
    }

    const cantidad =
      configuracion.ingredientesVolando;

    const ingredientesSeguros =
      ingredientes.filter(
        (ingrediente) =>
          !ingrediente.peligroso
      );

    const veneno =
      ingredientes.find(
        (ingrediente) =>
          ingrediente.peligroso
      );

    const resultado = [];

    for (
      let index = 0;
      index < cantidad;
      index++
    ) {
      let ingrediente;

      if (
        index === cantidad - 1 &&
        veneno
      ) {
        ingrediente = veneno;
      } else {
        ingrediente =
          ingredientesSeguros[
            index %
              ingredientesSeguros.length
          ];
      }

      if (!ingrediente) continue;

      resultado.push({
        ...ingrediente,

        instanceId: `${ingrediente.id}-${index}-${nivelNumero}-${indiceReceta}`
      });
    }

    return resultado;
  }, [
    ingredientes,
    configuracion,
    nivelNumero,
    indiceReceta
  ]);

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        setLoading(true);
        setError("");

        const [
          ingredientesData,
          recetasData
        ] = await Promise.all([
          getIngredientes(),
          getRecetas()
        ]);

        if (!activo) return;

        setIngredientes(
          ingredientesData
        );

        setRecetas(
          recetasData
        );
      } catch (err) {
        if (!activo) return;

        setError(
          "No se pudieron cargar los datos del juego."
        );
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (
      loading ||
      !configuracion ||
      recetasDelNivel.length === 0
    ) {
      return;
    }

    setIndiceReceta(0);
    setIngredientesRecogidos([]);
    setIngredienteRecogiendo(null);
    setFlyDistance(null);
    setVidas(configuracion.vidas);
    setTiempo(configuracion.tiempo);
    setEstadoJuego("jugando");
  }, [
    nivelNumero,
    loading,
    configuracion,
    recetasDelNivel.length
  ]);

  useEffect(() => {
    if (
      estadoJuego !== "jugando" ||
      !recetaActual
    ) {
      return;
    }

    if (tiempo <= 0) {
      setMensaje(
        "Se acabó el tiempo."
      );

      setEstadoJuego("derrota");

      return;
    }

    const timer = setTimeout(() => {
      setTiempo(
        (valor) => valor - 1
      );
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [
    tiempo,
    estadoJuego,
    recetaActual
  ]);

  useEffect(() => {
    if (puntos !== undefined) {
      sessionStorage.setItem(
        "potionPanicPuntos",
        puntos
      );
    }
  }, [puntos]);

  useEffect(() => {
    sessionStorage.setItem(
      "potionPanicNivelesCompletados",
      nivelesCompletados
    );
  }, [nivelesCompletados]);

  useEffect(() => {
    if (!mensaje) return;

    const timer = setTimeout(() => {
      setMensaje("");
    }, 1600);

    return () => {
      clearTimeout(timer);
    };
  }, [mensaje]);

  const handleCollectIngredient = (
    ingrediente,
    event
  ) => {
    if (
      estadoJuego !== "jugando" ||
      ingredienteRecogiendo
    ) {
      return;
    }

    const esNecesario =
      recetaActual.ingredientes
        .map(Number)
        .includes(
          Number(ingrediente.id)
        );

    if (ingrediente.peligroso) {
      setVidas((valor) => {
        const nuevasVidas =
          valor - 1;

        if (nuevasVidas <= 0) {
          setEstadoJuego("derrota");
          setMensaje(
            "El veneno arruinó la poción."
          );
        }

        return nuevasVidas;
      });

      setPuntos(
        (valor) =>
          Math.max(0, valor - 50)
      );

      setMensaje(
        "¡Ingrediente peligroso!"
      );

      return;
    }

    if (!esNecesario) {
      setPuntos(
        (valor) =>
          Math.max(0, valor - 10)
      );

      setMensaje(
        "Ingrediente incorrecto"
      );

      return;
    }

    if (
      ingredientesRecogidos
        .map(Number)
        .includes(
          Number(ingrediente.id)
        )
    ) {
      return;
    }

    const ingredientElement =
      event.currentTarget;

    const cauldronElement =
      cauldronRef.current;

    const boardElement =
      boardRef.current;

    if (
      ingredientElement &&
      cauldronElement &&
      boardElement
    ) {
      const ingredientRect =
        ingredientElement.getBoundingClientRect();

      const cauldronRect =
        cauldronElement.getBoundingClientRect();

      const boardRect =
        boardElement.getBoundingClientRect();

      const centerX =
        ingredientRect.left +
        ingredientRect.width / 2 -
        boardRect.left;

      const centerY =
        ingredientRect.top +
        ingredientRect.height / 2 -
        boardRect.top;

      const cauldronX =
        cauldronRect.left +
        cauldronRect.width / 2 -
        boardRect.left;

      const cauldronY =
        cauldronRect.top +
        cauldronRect.height / 2 -
        boardRect.top;

      setFlyDistance({
        centerX,
        centerY,
        cauldronX,
        cauldronY
      });
    }

    setIngredienteRecogiendo(
      ingrediente.instanceId
    );

    setPuntos(
      (valor) =>
        valor + ingrediente.puntos
    );

    setMensaje(
      `+${ingrediente.puntos} puntos`
    );

    setTimeout(() => {
      setIngredientesRecogidos(
        (anteriores) => [
          ...anteriores,
          ingrediente.id
        ]
      );

      setIngredienteRecogiendo(
        null
      );

      setFlyDistance(null);
    }, 900);
  };

  useEffect(() => {
    if (
      !recetaActual ||
      estadoJuego !== "jugando"
    ) {
      return;
    }

    const recetaCompleta =
      recetaActual.ingredientes.every(
        (ingredienteId) =>
          ingredientesRecogidos
            .map(Number)
            .includes(
              Number(ingredienteId)
            )
      );

    if (!recetaCompleta) {
      return;
    }

    setEstadoJuego(
      "receta-completa"
    );

    setPuntos(
      (valor) => valor + 100
    );

    setMensaje(
      "¡Poción preparada! +100"
    );

    const timer = setTimeout(() => {
      const siguienteReceta =
        indiceReceta + 1;

      if (
        siguienteReceta <
        recetasDelNivel.length
      ) {
        setIndiceReceta(
          siguienteReceta
        );

        setIngredientesRecogidos(
          []
        );

        setTiempo(
          configuracion.tiempo
        );

        setEstadoJuego(
          "jugando"
        );

        return;
      }

      const nuevosNivelesCompletados =
        Math.max(
          nivelesCompletados,
          nivelNumero
        );

      setNivelesCompletados(
        nuevosNivelesCompletados
      );

      if (nivelNumero < 5) {
        sessionStorage.setItem(
          "potionPanicNivelesCompletados",
          nuevosNivelesCompletados
        );

        navigate(
          `/juego/${nivelNumero + 1}`
        );

        return;
      }

      setEstadoJuego(
        "victoria"
      );
    }, 1400);

    return () => {
      clearTimeout(timer);
    };
  }, [
    ingredientesRecogidos,
    recetaActual,
    estadoJuego,
    indiceReceta,
    recetasDelNivel.length,
    configuracion,
    nivelesCompletados,
    nivelNumero,
    navigate
  ]);

  const volverAlInicio = () => {
    sessionStorage.removeItem(
      "potionPanicPuntos"
    );

    sessionStorage.removeItem(
      "potionPanicNivelesCompletados"
    );

    sessionStorage.removeItem(
      "potionPanicIniciada"
    );

    navigate("/");
  };

  const reiniciarNivel = () => {
    setIngredientesRecogidos([]);
    setIngredienteRecogiendo(null);
    setFlyDistance(null);
    setVidas(configuracion.vidas);
    setTiempo(configuracion.tiempo);
    setEstadoJuego("jugando");
    setMensaje("");
  };

  if (!configuracion) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <h1>Nivel no encontrado</h1>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <span className="game-message-label">
            POTION PANIC
          </span>

          <h1>Cargando laboratorio...</h1>

          <p>
            Preparando ingredientes y
            recetas.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <span className="game-message-label">
            ERROR
          </span>

          <h1>No se pudo iniciar</h1>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Intentar nuevamente
          </button>
        </div>
      </main>
    );
  }

  if (!recetaActual) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <h1>No hay recetas</h1>

          <p>
            No se encontraron recetas para
            este nivel.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="game-page">
      <section className="recipe-panel">
        <div className="recipe-info">
          <div className="recipe-heading">
            <div className="recipe-image">
              {recetaActual.imagen ? (
                <img
                  src={
                    recetaActual.imagen
                  }
                  alt={
                    recetaActual.nombre
                  }
                />
              ) : (
                <span>
                  RECETA
                </span>
              )}
            </div>

            <div>
              <span className="recipe-label">
                Receta {indiceReceta + 1} de{" "}
                {recetasDelNivel.length}
              </span>

              <h2>
                {recetaActual.nombre}
              </h2>
            </div>
          </div>

          <p>
            Encuentra todos los ingredientes
            necesarios para preparar esta
            poción.
          </p>
        </div>

        <div className="recipe-list-area">
          <span className="recipe-list-title">
            Ingredientes necesarios
          </span>

          <div className="recipe-ingredients">
            {ingredientesDeLaReceta.map(
              (ingrediente) => {
                const recogido =
                  ingredientesRecogidos
                    .map(Number)
                    .includes(
                      Number(
                        ingrediente.id
                      )
                    );

                return (
                  <div
                    key={ingrediente.id}
                    className={`recipe-ingredient ${
                      recogido
                        ? "recipe-ingredient-collected"
                        : ""
                    }`}
                  >
                    <div className="recipe-ingredient-image">
                      <img
                        src={
                          ingrediente.imagen
                        }
                        alt={
                          ingrediente.nombre
                        }
                      />
                    </div>

                    <div className="recipe-ingredient-info">
                      <span className="recipe-ingredient-name">
                        {
                          ingrediente.nombre
                        }
                      </span>

                      <span
                        className={
                          recogido
                            ? "recipe-ingredient-status collected"
                            : "recipe-ingredient-status"
                        }
                      >
                        {recogido
                          ? "Agregado"
                          : "Necesario"}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      <section className="game-stats">
        <div>
          <span>NIVEL</span>
          <strong>
            {nivelNumero}
          </strong>
        </div>

        <div>
          <span>PUNTOS</span>
          <strong>
            {puntos}
          </strong>
        </div>

        <div>
          <span>TIEMPO</span>
          <strong
            className={
              tiempo <= 5
                ? "danger-text"
                : ""
            }
          >
            {tiempo}s
          </strong>
        </div>

        <div>
          <span>VIDAS</span>
          <strong>
            {vidas}
          </strong>
        </div>
      </section>

      <section
        ref={boardRef}
        className="game-board"
      >
        <div className="board-header">
          <div>
            <span>
              LABORATORIO DE ALQUIMIA
            </span>

            <h1>
              Encuentra los ingredientes
            </h1>
          </div>

          <button
            type="button"
            className="exit-button"
            onClick={volverAlInicio}
          >
            Salir
          </button>
        </div>

        <div className="ingredients-area">
          {ingredientesVolando.map(
            (ingrediente, index) => {
              const position =
                POSICIONES_INGREDIENTES[
                  index %
                    POSICIONES_INGREDIENTES.length
                ];

              const movementPattern =
                PATRONES_MOVIMIENTO[
                  index %
                    PATRONES_MOVIMIENTO.length
                ];

              const isCollecting =
                ingredienteRecogiendo ===
                ingrediente.instanceId;

              const ingredienteYaRecogido =
                ingredientesRecogidos
                  .map(Number)
                  .includes(
                    Number(
                      ingrediente.id
                    )
                  );

              if (
                ingredienteYaRecogido
              ) {
                return null;
              }

              return (
                <Ingredient
                  key={
                    ingrediente.instanceId
                  }
                  ingrediente={
                    ingrediente
                  }
                  position={position}
                  onCollect={
                    handleCollectIngredient
                  }
                  isCollecting={
                    isCollecting
                  }
                  flyDistance={
                    isCollecting
                      ? flyDistance
                      : null
                  }
                  movementSpeed={
                    movementSpeed
                  }
                  movementScale={
                    movementScale
                  }
                  movementPattern={
                    movementPattern
                  }
                />
              );
            }
          )}
        </div>

        <Cauldron
          ref={cauldronRef}
        />

        {mensaje && (
          <div className="game-toast">
            {mensaje}
          </div>
        )}

        {estadoJuego ===
          "receta-completa" && (
          <div className="game-overlay">
            <div className="game-result">
              <span className="result-label">
                POCIÓN COMPLETADA
              </span>

              <h2>
                {recetaActual.nombre}
              </h2>

              <p>
                Preparación exitosa.
              </p>
            </div>
          </div>
        )}

        {estadoJuego ===
          "derrota" && (
          <div className="game-overlay">
            <div className="game-result">
              <span className="result-label">
                LABORATORIO PERDIDO
              </span>

              <h2>
                La poción no pudo
                completarse.
              </h2>

              <p>
                Puntuación actual:{" "}
                <strong>
                  {puntos}
                </strong>
              </p>

              <ScoreForm
                puntos={puntos}
                nivel={nivelNumero}
                nivelesCompletados={
                  nivelesCompletados
                }
                resultado="derrota"
                onSaved={() =>
                  navigate(
                    "/puntajes"
                  )
                }
              />

              <button
                type="button"
                className="secondary-result-button"
                onClick={
                  reiniciarNivel
                }
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {estadoJuego ===
          "victoria" && (
          <div className="game-overlay">
            <div className="game-result">
              <span className="result-label">
                MAESTRÍA ALCANZADA
              </span>

              <h2>
                Completaste Potion
                Panic.
              </h2>

              <p>
                Todos los niveles fueron
                completados.
              </p>

              <p>
                Puntuación final:{" "}
                <strong>
                  {puntos}
                </strong>
              </p>

              <ScoreForm
                puntos={puntos}
                nivel={nivelNumero}
                nivelesCompletados={5}
                resultado="victoria"
                onSaved={() =>
                  navigate(
                    "/puntajes"
                  )
                }
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Game;