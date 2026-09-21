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
  { top: "8%", left: "8%" },
  { top: "10%", left: "30%" },
  { top: "8%", left: "55%" },
  { top: "11%", left: "78%" },
  { top: "23%", left: "17%" },
  { top: "21%", left: "41%" },
  { top: "24%", left: "67%" },
  { top: "28%", left: "87%" },
  { top: "34%", left: "9%" },
  { top: "32%", left: "31%" },
  { top: "35%", left: "54%" },
  { top: "36%", left: "77%" },
  { top: "26%", left: "91%" },
  { top: "38%", left: "20%" }
];

const PATRONES_MOVIMIENTO = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7
];

/*
 * Color del líquido según el ingrediente.
 */
const COLORES_LIQUIDO = {
  1: "#8d6bc4", // Hongo Lunar
  2: "#5c8fca", // Hierba Arcana
  3: "#72d8e6", // Cristal Mágico
  4: "#b05fd1", // Flor Nocturna
  5: "#d5b85c", // Polvo Lunar
  6: "#4f9b68", // Veneno
  7: "#704c9d", // Raíz Sombría
  8: "#c47c55"  // Escama de Dragón
};

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

  const [
    ingredientesRecogidos,
    setIngredientesRecogidos
  ] = useState([]);

  const [
    ingredienteRecogiendo,
    setIngredienteRecogiendo
  ] = useState(null);

  const [flyDistance, setFlyDistance] =
    useState(null);

  const [puntos, setPuntos] = useState(() => {
    return Number(
      sessionStorage.getItem(
        "potionPanicPuntos"
      ) || 0
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

  const [feedback, setFeedback] =
    useState(null);

  const [
    calderoReaccionando,
    setCalderoReaccionando
  ] = useState(false);

  /*
   * Color actual del líquido del caldero.
   */
  const [liquidColor, setLiquidColor] =
    useState("#8d6bc4");

  const [estadoJuego, setEstadoJuego] =
    useState("jugando");

  const [pausado, setPausado] =
    useState(false);

  const [
    nivelesCompletados,
    setNivelesCompletados
  ] = useState(() => {
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
          Number(receta.nivel) ===
          nivelNumero
      )
      .sort(
        (a, b) =>
          Number(a.orden) -
          Number(b.orden)
      );
  }, [recetas, nivelNumero]);

  const recetaActual =
    recetasDelNivel[indiceReceta];

  const ingredientesDeLaReceta =
    useMemo(() => {
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

  /*
   * La dificultad aumenta:
   *
   * 1. Cada nivel aumenta el movimiento.
   * 2. Cada receta dentro del nivel aumenta
   *    un poco más la velocidad.
   */
  const movementScaleNivel =
    {
      1: 0.78,
      2: 0.92,
      3: 1.06,
      4: 1.2,
      5: 1.34
    }[nivelNumero] || 0.78;

  const movementScaleReceta =
    [1, 1.12, 1.24][indiceReceta] ||
    1;

  const movementScale = Math.min(
    movementScaleNivel *
      movementScaleReceta,
    1.6
  );

  const movementSpeedNivel =
    {
      1: 10.5,
      2: 8.6,
      3: 7,
      4: 5.7,
      5: 4.7
    }[nivelNumero] || 10.5;

  const movementSpeedReceta =
    [1, 0.84, 0.7][indiceReceta] ||
    1;

  const movementSpeed =
    movementSpeedNivel *
    movementSpeedReceta;

  /*
   * Ingredientes que aparecen volando
   * por el laboratorio.
   */
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

      /*
       * Siempre dejamos un ingrediente
       * peligroso dentro del tablero.
       */
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

  /*
   * Carga ingredientes y recetas desde json-server.
   */
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

  /*
   * Reinicia el estado cuando cambia el nivel.
   */
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
    setPausado(false);

    setCalderoReaccionando(false);
    setLiquidColor("#8d6bc4");
  }, [
    nivelNumero,
    loading,
    configuracion,
    recetasDelNivel.length
  ]);

  /*
   * Temporizador.
   */
  useEffect(() => {
    if (
      estadoJuego !== "jugando" ||
      pausado ||
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
    pausado,
    recetaActual
  ]);

  /*
   * Guarda los puntos durante la partida.
   */
  useEffect(() => {
    if (puntos !== undefined) {
      sessionStorage.setItem(
        "potionPanicPuntos",
        puntos
      );
    }
  }, [puntos]);

  /*
   * Guarda los niveles completados.
   */
  useEffect(() => {
    sessionStorage.setItem(
      "potionPanicNivelesCompletados",
      nivelesCompletados
    );
  }, [nivelesCompletados]);

  /*
   * Toast de mensajes.
   */
  useEffect(() => {
    if (!mensaje) return;

    const timer = setTimeout(() => {
      setMensaje("");
    }, 1600);

    return () => {
      clearTimeout(timer);
    };
  }, [mensaje]);

  /*
   * Maneja la selección de ingredientes.
   */
  const handleCollectIngredient = (
    ingrediente,
    event
  ) => {
    if (
      pausado ||
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

    /*
     * Feedback visual donde se hizo clic.
     */
    const mostrarFeedback = (
      tipo,
      texto
    ) => {
      const boardRect =
        boardRef.current?.getBoundingClientRect();

      setFeedback({
        id: Date.now(),
        tipo,
        texto,
        x: boardRect
          ? event.clientX -
            boardRect.left
          : event.clientX,
        y: boardRect
          ? event.clientY -
            boardRect.top
          : event.clientY
      });

      window.setTimeout(() => {
        setFeedback(null);
      }, 900);
    };

    /*
     * Ingrediente peligroso.
     */
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

      mostrarFeedback(
        "peligro",
        "-1 vida"
      );

      setMensaje(
        "¡Ingrediente peligroso!"
      );

      return;
    }

    /*
     * Ingrediente que no pertenece a la receta.
     */
    if (!esNecesario) {
      setPuntos(
        (valor) =>
          Math.max(0, valor - 10)
      );

      mostrarFeedback(
        "incorrecto",
        "-10"
      );

      setMensaje(
        "Ingrediente incorrecto"
      );

      return;
    }

    /*
     * Evita recoger dos veces el mismo ingrediente.
     */
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

    /*
     * Calculamos la trayectoria desde
     * el ingrediente hasta el caldero.
     */
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

      /*
       * Apuntamos hacia la parte superior
       * del caldero, donde está el líquido.
       */
      const cauldronY =
        cauldronRect.top +
        cauldronRect.height * 0.28 -
        boardRect.top;

      setFlyDistance({
        centerX,
        centerY,
        cauldronX,
        cauldronY
      });
    }

    /*
     * Inicia la animación de vuelo.
     */
    setIngredienteRecogiendo(
      ingrediente.instanceId
    );

    /*
     * Cambia el color del líquido según
     * el ingrediente que acaba de entrar.
     */
    const nuevoColor =
      COLORES_LIQUIDO[
        Number(ingrediente.id)
      ] || "#8d6bc4";

    setLiquidColor(nuevoColor);

    /*
     * Suma los puntos inmediatamente.
     */
    setPuntos(
      (valor) =>
        valor + ingrediente.puntos
    );

    mostrarFeedback(
      "correcto",
      `+${ingrediente.puntos}`
    );

    setMensaje(
      `+${ingrediente.puntos} puntos`
    );

    /*
     * IMPORTANTE:
     * El caldero NO reacciona todavía.
     *
     * Esperamos a que termine la animación
     * de vuelo de 900ms.
     */
    window.setTimeout(() => {
      /*
       * El ingrediente ya llegó al caldero.
       * Ahora ocurre la reacción.
       */
      setCalderoReaccionando(true);

      /*
       * Apagamos la reacción después
       * de terminar la animación.
       */
      window.setTimeout(() => {
        setCalderoReaccionando(false);
      }, 900);

      /*
       * Registramos el ingrediente como agregado.
       */
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

  /*
   * Comprueba si la receta actual
   * ya tiene todos sus ingredientes.
   */
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

    /*
     * Bonus por completar receta.
     */
    setPuntos(
      (valor) => valor + 100
    );

    setMensaje(
      "¡Poción preparada! +100"
    );

    const timer = setTimeout(() => {
      const siguienteReceta =
        indiceReceta + 1;

      /*
       * Todavía quedan recetas
       * en el nivel actual.
       */
      if (
        siguienteReceta <
        recetasDelNivel.length
      ) {
        setIndiceReceta(
          siguienteReceta
        );

        setIngredientesRecogidos([]);

        setTiempo(
          configuracion.tiempo
        );

        setEstadoJuego(
          "jugando"
        );

        return;
      }

      /*
       * Se completó todo el nivel.
       */
      const nuevosNivelesCompletados =
        Math.max(
          nivelesCompletados,
          nivelNumero
        );

      setNivelesCompletados(
        nuevosNivelesCompletados
      );

      /*
       * Todavía quedan niveles.
       */
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

      /*
       * Nivel 5 terminado.
       */
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
    indiceReceta,
    recetasDelNivel.length,
    configuracion,
    nivelesCompletados,
    nivelNumero,
    navigate
  ]);

  /*
   * Pausar / continuar.
   */
  const togglePausa = () => {
    if (
      estadoJuego !== "jugando"
    ) {
      return;
    }

    setPausado(
      (valor) => !valor
    );
  };

  /*
   * Atajo de teclado:
   * barra espaciadora = pausa.
   */
  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.code !== "Space"
      ) {
        return;
      }

      const target =
        event.target;

      const tagName =
        target?.tagName?.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "button"
      ) {
        return;
      }

      event.preventDefault();

      togglePausa();
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [estadoJuego]);

  /*
   * Salir al inicio.
   */
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

  /*
   * Reiniciar nivel.
   */
  const reiniciarNivel = () => {
    setIngredientesRecogidos([]);

    setIngredienteRecogiendo(
      null
    );

    setFlyDistance(null);

    setVidas(
      configuracion.vidas
    );

    setTiempo(
      configuracion.tiempo
    );

    setEstadoJuego("jugando");

    setPausado(false);

    setCalderoReaccionando(
      false
    );

    setLiquidColor("#8d6bc4");

    setFeedback(null);

    setMensaje("");
  };

  /*
   * Nivel inválido.
   */
  if (!configuracion) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <h1>
            Nivel no encontrado
          </h1>

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

  /*
   * Loading.
   */
  if (loading) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <span className="game-message-label">
            POTION PANIC
          </span>

          <h1>
            Cargando laboratorio...
          </h1>

          <p>
            Preparando ingredientes y
            recetas.
          </p>
        </div>
      </main>
    );
  }

  /*
   * Error.
   */
  if (error) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <span className="game-message-label">
            ERROR
          </span>

          <h1>
            No se pudo iniciar
          </h1>

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

  /*
   * No existen recetas para este nivel.
   */
  if (!recetaActual) {
    return (
      <main className="game-page game-message-page">
        <div className="game-message-card">
          <h1>
            No hay recetas
          </h1>

          <p>
            No se encontraron recetas
            para este nivel.
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

      {/* =====================================
          PANEL DE RECETA
      ====================================== */}
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
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <span>
                  POCIÓN
                </span>
              )}
            </div>

            <div>
              <span className="recipe-label">
                Receta{" "}
                {indiceReceta + 1} de{" "}
                {recetasDelNivel.length}
              </span>

              <h2>
                {recetaActual.nombre}
              </h2>
            </div>

          </div>

          <p>
            Encuentra todos los
            ingredientes necesarios
            para preparar esta poción.
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
                    key={
                      ingrediente.id
                    }
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

      {/* =====================================
          ESTADÍSTICAS
      ====================================== */}
      <section className="game-stats">

        <div>
          <span>
            NIVEL
          </span>

          <strong>
            {nivelNumero}
          </strong>
        </div>

        <div>
          <span>
            PUNTOS
          </span>

          <strong>
            {puntos}
          </strong>
        </div>

        <div>
          <span>
            TIEMPO
          </span>

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
          <span>
            VIDAS
          </span>

          <strong>
            {vidas}
          </strong>
        </div>

      </section>

      {/* =====================================
          TABLERO
      ====================================== */}
      <section
        ref={boardRef}
        className="game-board"
      >

        {/* HEADER DEL TABLERO */}
        <div className="board-header">

          <div>
            <span>
              LABORATORIO DE ALQUIMIA
            </span>

            <h1>
              Encuentra los ingredientes
            </h1>
          </div>

          <div
            className="board-actions"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="pause-button"
              onClick={togglePausa}
            >
              {pausado
                ? "Continuar"
                : "Pausa"}
            </button>

            <button
              type="button"
              className="exit-button"
              onClick={
                volverAlInicio
              }
            >
              Salir
            </button>

          </div>

        </div>

        {/* =====================================
            INGREDIENTES VOLANDO
        ====================================== */}
        <div className="ingredients-area">

          {ingredientesVolando.map(
            (
              ingrediente,
              index
            ) => {

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
                  position={
                    position
                  }
                  onCollect={
                    handleCollectIngredient
                  }
                  isCollecting={
                    isCollecting
                  }
                  isPaused={
                    pausado
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
                  movementDelay={
                    `-${index * 0.55}s`
                  }
                  movementPattern={
                    movementPattern
                  }
                />
              );
            }
          )}

        </div>

        {/* =====================================
            CALDERO
        ====================================== */}
        <Cauldron
          ref={cauldronRef}
          isReacting={
            calderoReaccionando
          }
          liquidColor={
            liquidColor
          }
        />

        {/* =====================================
            TOAST
        ====================================== */}
        {mensaje && (
          <div className="game-toast">
            {mensaje}
          </div>
        )}

        {/* =====================================
            FEEDBACK DEL CLIC
        ====================================== */}
        {feedback && (
          <div
            key={feedback.id}
            className={`interaction-feedback interaction-feedback-${feedback.tipo}`}
            style={{
              left: `${feedback.x}px`,
              top: `${feedback.y}px`
            }}
          >
            {feedback.texto}
          </div>
        )}

        {/* =====================================
            PAUSA
        ====================================== */}
        {pausado && (
          <div className="pause-overlay">

            <div className="pause-card">

              <span className="pause-label">
                POTION PANIC
              </span>

              <h2>
                Juego en pausa
              </h2>

              <p>
                El laboratorio está en
                pausa.
              </p>

              <div className="pause-actions">

                <button
                  type="button"
                  className="resume-button"
                  onClick={
                    togglePausa
                  }
                >
                  Continuar
                </button>

                <button
                  type="button"
                  className="pause-exit-button"
                  onClick={
                    volverAlInicio
                  }
                >
                  Salir al inicio
                </button>

              </div>

            </div>

          </div>
        )}

        {/* =====================================
            RECETA COMPLETADA
        ====================================== */}
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

        {/* =====================================
            DERROTA
        ====================================== */}
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

        {/* =====================================
            VICTORIA FINAL
        ====================================== */}
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
                Todos los niveles
                fueron completados.
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