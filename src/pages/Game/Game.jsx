import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

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
  { top: "15%", left: "8%" },
  { top: "30%", left: "27%" },
  { top: "12%", left: "48%" },
  { top: "25%", left: "72%" },
  { top: "45%", left: "15%" },
  { top: "52%", left: "40%" },
  { top: "42%", left: "66%" },
  { top: "65%", left: "82%" },
  { top: "18%", left: "87%" },
  { top: "70%", left: "25%" },
  { top: "62%", left: "52%" },
  { top: "35%", left: "88%" },
  { top: "75%", left: "70%" },
  { top: "55%", left: "8%" },
  { top: "10%", left: "68%" }
];

function Game() {
  const { nivel } = useParams();
  const navigate = useNavigate();

  const nivelNumero = Number(nivel);

  const gameBoardRef = useRef(null);
  const cauldronRef = useRef(null);

  const [recetas, setRecetas] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);

  const [indiceReceta, setIndiceReceta] =
    useState(0);

  const [
    ingredientesRecogidos,
    setIngredientesRecogidos
  ] = useState([]);

  const [puntos, setPuntos] = useState(0);
  const [vidas, setVidas] = useState(3);

  const [tiempoRestante, setTiempoRestante] =
    useState(0);

  const [estadoJuego, setEstadoJuego] =
    useState("jugando");

  const [
    collectingIngredient,
    setCollectingIngredient
  ] = useState(null);

  const [flyDistance, setFlyDistance] = useState({
    centerX: 0,
    centerY: 0,
    cauldronX: 0,
    cauldronY: 0
  });

  const [mensaje, setMensaje] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [resultadoGuardado, setResultadoGuardado] =
    useState(false);

  /*
   * Cargar datos
   */
  useEffect(() => {
    const cargarDatos = async () => {
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

        setIngredientes(ingredientesData);
        setRecetas(recetasData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  /*
   * Configuración del nivel
   */
  const configuracion =
    CONFIGURACION_NIVELES[nivelNumero];

  /*
   * Recetas correspondientes al nivel
   */
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
  }, [
    recetas,
    nivelNumero
  ]);

  const recetaActual =
    recetasDelNivel[indiceReceta];

  /*
   * Puntos y progreso acumulados
   *
   * sessionStorage permite conservarlos
   * cuando pasamos de /juego/1 a /juego/2.
   */
  useEffect(() => {
    if (!loading) {
      const puntosGuardados =
        sessionStorage.getItem(
          "potionPanicPuntos"
        );

      const nivelesGuardados =
        sessionStorage.getItem(
          "potionPanicNivelesCompletados"
        );

      if (
        nivelNumero === 1 &&
        !sessionStorage.getItem(
          "potionPanicIniciada"
        )
      ) {
        sessionStorage.setItem(
          "potionPanicIniciada",
          "true"
        );

        sessionStorage.setItem(
          "potionPanicPuntos",
          "0"
        );

        sessionStorage.setItem(
          "potionPanicNivelesCompletados",
          "0"
        );

        setPuntos(0);
      } else if (puntosGuardados) {
        setPuntos(
          Number(puntosGuardados)
        );
      }

      if (!nivelesGuardados) {
        sessionStorage.setItem(
          "potionPanicNivelesCompletados",
          "0"
        );
      }
    }
  }, [
    loading,
    nivelNumero
  ]);

  /*
   * Inicializar nivel
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
    setVidas(configuracion.vidas);
    setTiempoRestante(
      configuracion.tiempo
    );
    setIngredientesRecogidos([]);
    setCollectingIngredient(null);
    setEstadoJuego("jugando");
    setMensaje("");
    setResultadoGuardado(false);
  }, [
    nivelNumero,
    loading,
    recetasDelNivel.length
  ]);

  /*
   * Preparar receta actual
   */
  useEffect(() => {
    if (
      !recetaActual ||
      loading ||
      estadoJuego !== "jugando"
    ) {
      return;
    }

    setIngredientesRecogidos([]);
    setCollectingIngredient(null);
    setTiempoRestante(
      configuracion.tiempo
    );
    setMensaje("");
  }, [
    indiceReceta
  ]);

  /*
   * Temporizador
   */
  useEffect(() => {
    if (
      !recetaActual ||
      loading ||
      estadoJuego !== "jugando"
    ) {
      return;
    }

    const intervalo =
      setInterval(() => {
        setTiempoRestante(
          (tiempoActual) => {
            if (tiempoActual <= 1) {
              clearInterval(
                intervalo
              );

              setEstadoJuego(
                "derrota"
              );

              setMensaje(
                "Se acabó el tiempo."
              );

              return 0;
            }

            return tiempoActual - 1;
          }
        );
      }, 1000);

    return () => {
      clearInterval(
        intervalo
      );
    };
  }, [
    recetaActual,
    loading,
    estadoJuego,
    indiceReceta
  ]);

  /*
   * Crear las instancias que estarán
   * volando por el tablero.
   *
   * Se repiten ingredientes porque los
   * niveles 4 y 5 necesitan muchos objetos.
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

    const resultado = [];

    for (
      let index = 0;
      index < cantidad;
      index++
    ) {
      /*
       * Hacemos que el veneno aparezca
       * al menos una vez.
       */
      let ingrediente =
        ingredientes[
          index % ingredientes.length
        ];

      if (
        index === cantidad - 1
      ) {
        const veneno =
          ingredientes.find(
            (item) =>
              item.peligroso
          );

        if (veneno) {
          ingrediente = veneno;
        }
      }

      resultado.push({
        ...ingrediente,
        instanceId:
          `${ingrediente.id}-${index}-${nivelNumero}-${indiceReceta}`
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
   * Ingredientes necesarios para la receta
   */
  const ingredientesDeLaReceta =
    ingredientes.filter(
      (ingrediente) =>
        recetaActual?.ingredientes
          .map(Number)
          .includes(
            Number(ingrediente.id)
          )
    );

  /*
   * Velocidad general
   */
  const getMovementSpeed = () => {
    const velocidades = {
      1: 8,
      2: 6.5,
      3: 5,
      4: 3.8,
      5: 2.8
    };

    return (
      velocidades[nivelNumero] ||
      8
    );
  };

  /*
   * Registrar resultado
   */
  const handleScoreSaved = () => {
    setResultadoGuardado(true);
  };

  /*
   * Clic en ingrediente
   */
  const handleCollectIngredient = (
    ingrediente,
    event
  ) => {
    if (
      collectingIngredient !== null ||
      estadoJuego !== "jugando" ||
      vidas <= 0 ||
      tiempoRestante <= 0
    ) {
      return;
    }

    const board =
      gameBoardRef.current;

    const cauldron =
      cauldronRef.current;

    const ingredientElement =
      event?.currentTarget;

    if (
      !board ||
      !cauldron ||
      !ingredientElement
    ) {
      return;
    }

    const boardRect =
      board.getBoundingClientRect();

    const ingredientRect =
      ingredientElement.getBoundingClientRect();

    const cauldronRect =
      cauldron.getBoundingClientRect();

    const ingredientCenterX =
      ingredientRect.left +
      ingredientRect.width / 2;

    const ingredientCenterY =
      ingredientRect.top +
      ingredientRect.height / 2;

    const boardCenterX =
      boardRect.left +
      boardRect.width / 2;

    const boardCenterY =
      boardRect.top +
      boardRect.height / 2;

    const cauldronCenterX =
      cauldronRect.left +
      cauldronRect.width / 2;

    const cauldronTargetY =
      cauldronRect.top + 35;

    setFlyDistance({
      centerX:
        boardCenterX -
        ingredientCenterX,

      centerY:
        boardCenterY -
        ingredientCenterY,

      cauldronX:
        cauldronCenterX -
        boardCenterX,

      cauldronY:
        cauldronTargetY -
        boardCenterY
    });

    setCollectingIngredient(
      ingrediente.instanceId
    );

    const perteneceAReceta =
      recetaActual.ingredientes
        .map(Number)
        .includes(
          Number(ingrediente.id)
        );

    const yaRecogido =
      ingredientesRecogidos
        .map(Number)
        .includes(
          Number(ingrediente.id)
        );

    setTimeout(() => {
      /*
       * Veneno
       */
      if (
        ingrediente.peligroso
      ) {
        const nuevasVidas =
          Math.max(
            vidas - 1,
            0
          );

        setVidas(
          nuevasVidas
        );

        if (
          nuevasVidas === 0
        ) {
          setEstadoJuego(
            "derrota"
          );

          setMensaje(
            "Te quedaste sin vidas."
          );
        } else {
          setMensaje(
            "Ingrediente peligroso. Perdiste una vida."
          );
        }
      }

      /*
       * Correcto
       */
      else if (
        perteneceAReceta &&
        !yaRecogido
      ) {
        const nuevosIngredientes =
          [
            ...ingredientesRecogidos,
            Number(
              ingrediente.id
            )
          ];

        const nuevosPuntos =
          puntos +
          ingrediente.puntos;

        setPuntos(
          nuevosPuntos
        );

        sessionStorage.setItem(
          "potionPanicPuntos",
          String(
            nuevosPuntos
          )
        );

        setIngredientesRecogidos(
          nuevosIngredientes
        );

        /*
         * Receta completada
         */
        if (
          nuevosIngredientes.length ===
          recetaActual.ingredientes.length
        ) {
          const ultimaReceta =
            indiceReceta ===
            recetasDelNivel.length - 1;

          if (
            ultimaReceta
          ) {
            /*
             * Última receta del nivel
             */
            if (
              nivelNumero === 5
            ) {
              sessionStorage.setItem(
                "potionPanicNivelesCompletados",
                "5"
              );

              setEstadoJuego(
                "victoria"
              );

              setMensaje(
                "Has completado los cinco niveles."
              );
            } else {
              /*
               * Terminar nivel y avanzar
               */
              const nivelesCompletados =
                nivelNumero;

              sessionStorage.setItem(
                "potionPanicNivelesCompletados",
                String(
                  nivelesCompletados
                )
              );

              setEstadoJuego(
                "transicion"
              );

              setMensaje(
                `Nivel ${nivelNumero} completado.`
              );

              setTimeout(() => {
                navigate(
                  `/juego/${nivelNumero + 1}`
                );
              }, 1400);
            }
          } else {
            /*
             * Siguiente receta
             */
            setEstadoJuego(
              "transicion"
            );

            setMensaje(
              "Receta completada."
            );

            setTimeout(() => {
              setIndiceReceta(
                (indiceActual) =>
                  indiceActual + 1
              );

              setEstadoJuego(
                "jugando"
              );
            }, 1200);
          }
        } else {
          setMensaje(
            `${ingrediente.nombre} agregado a la poción.`
          );
        }
      }

      /*
       * Ingrediente repetido
       */
      else if (
        yaRecogido
      ) {
        setMensaje(
          `${ingrediente.nombre} ya fue agregado.`
        );
      }

      /*
       * Distractor
       */
      else {
        const nuevosPuntos =
          Math.max(
            puntos - 10,
            0
          );

        setPuntos(
          nuevosPuntos
        );

        sessionStorage.setItem(
          "potionPanicPuntos",
          String(
            nuevosPuntos
          )
        );

        setMensaje(
          `${ingrediente.nombre} no pertenece a esta receta.`
        );
      }

      setCollectingIngredient(
        null
      );
    }, 1200);
  };

  /*
   * Pantallas de carga
   */
  if (loading) {
    return (
      <main className="game-page">
        <div className="game-message">
          <h2>
            Cargando laboratorio...
          </h2>

          <p>
            Preparando los ingredientes.
          </p>
        </div>
      </main>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <main className="game-page">
        <div className="game-message error">
          <h2>
            No se pudo cargar el juego
          </h2>

          <p>
            {error}
          </p>

          <Link
            to="/"
            className="game-back-button"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Nivel inválido
   */
  if (
    !configuracion ||
    recetasDelNivel.length === 0
  ) {
    return (
      <main className="game-page">
        <div className="game-message">
          <h2>
            Nivel no disponible
          </h2>

          <p>
            No encontramos este nivel.
          </p>

          <Link
            to="/"
            className="game-back-button"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const movementSpeed =
    getMovementSpeed();

  const tiempoCritico =
    tiempoRestante <= 5 &&
    tiempoRestante > 0;

  return (
    <main className="game-page">
      <header className="game-header">
        <div>
          <p className="game-eyebrow">
            Potion Panic
          </p>

          <h1>
            Nivel {nivelNumero}
          </h1>
        </div>

        <Link
          to="/"
          className="game-back-button"
        >
          Volver al inicio
        </Link>
      </header>

      <section className="recipe-panel">
        <div className="recipe-info">
          <span className="recipe-label">
            Receta {indiceReceta + 1} de{" "}
            {recetasDelNivel.length}
          </span>

          <h2>
            {recetaActual.nombre}
          </h2>

          <p>
            Encuentra únicamente los
            ingredientes que necesita
            esta poción.
          </p>

          <div className="recipe-progress">
            <span>
              Progreso
            </span>

            <strong>
              {ingredientesRecogidos.length}
              {" / "}
              {recetaActual.ingredientes.length}
            </strong>
          </div>
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
                    <span className="recipe-ingredient-letter">
                      {recogido
                        ? "✓"
                        : ingrediente.nombre.charAt(
                            0
                          )}
                    </span>

                    <span>
                      {ingrediente.nombre}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      <section className="game-stats">
        <div
          className={`stat-card ${
            tiempoCritico
              ? "stat-card-warning"
              : ""
          }`}
        >
          <span>
            Tiempo
          </span>

          <strong>
            {tiempoRestante}s
          </strong>
        </div>

        <div className="stat-card">
          <span>
            Puntos
          </span>

          <strong>
            {puntos}
          </strong>
        </div>

        <div className="stat-card">
          <span>
            Vidas
          </span>

          <strong>
            {vidas}
          </strong>
        </div>
      </section>

      <section
        className="game-board"
        ref={gameBoardRef}
      >
        <div className="board-header">
          <div>
            <span className="board-label">
              Laboratorio
            </span>

            <h2>
              {estadoJuego ===
              "jugando"
                ? "Encuentra los ingredientes"
                : estadoJuego ===
                    "transicion"
                  ? "Preparando la siguiente receta"
                  : estadoJuego ===
                      "victoria"
                    ? "Laboratorio completado"
                    : "Partida terminada"}
            </h2>
          </div>

          <span className="board-level">
            Receta {indiceReceta + 1} /{" "}
            {recetasDelNivel.length}
          </span>
        </div>

        {mensaje &&
          estadoJuego !==
            "victoria" &&
          estadoJuego !==
            "derrota" && (
            <div className="game-toast">
              {mensaje}
            </div>
          )}

        <div className="ingredients-area">
          {ingredientesVolando.map(
            (
              ingrediente,
              index
            ) => {
              const isCollecting =
                collectingIngredient ===
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
                ingredienteYaRecogido &&
                !isCollecting
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
                    POSICIONES_INGREDIENTES[
                      index %
                        POSICIONES_INGREDIENTES.length
                    ]
                  }
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
                    movementSpeed /
                    ingrediente.velocidad
                  }
                  movementPattern={
                    index % 8
                  }
                />
              );
            }
          )}
        </div>

        <Cauldron
          ref={cauldronRef}
        />

        {(estadoJuego ===
          "victoria" ||
          estadoJuego ===
            "derrota") && (
          <div className="game-overlay">
            <div className="game-result">
              <span className="game-result-label">
                {estadoJuego ===
                "victoria"
                  ? "Laboratorio completado"
                  : "Fin de la partida"}
              </span>

              <h2>
                {estadoJuego ===
                "victoria"
                  ? "Has completado Potion Panic"
                  : "La partida terminó"}
              </h2>

              <p>
                Nivel alcanzado:{" "}
                <strong>
                  {nivelNumero}
                </strong>
              </p>

              <p>
                Puntos obtenidos:{" "}
                <strong>
                  {puntos}
                </strong>
              </p>

              {!resultadoGuardado ? (
                <ScoreForm
                  puntos={puntos}
                  nivel={nivelNumero}
                  nivelesCompletados={
                    estadoJuego ===
                    "victoria"
                      ? 5
                      : Math.max(
                          nivelNumero - 1,
                          0
                        )
                  }
                  resultado={
                    estadoJuego ===
                    "victoria"
                      ? "victoria"
                      : "derrota"
                  }
                  onSaved={
                    handleScoreSaved
                  }
                />
              ) : (
                <div className="score-saved">
                  <p>
                    Tu puntuación fue
                    guardada correctamente.
                  </p>

                  <div className="game-result-actions">
                    <Link
                      to="/puntajes"
                      className="game-retry-button"
                    >
                      Ver puntuaciones
                    </Link>

                    <Link
                      to="/"
                      className="game-home-button"
                    >
                      Volver al inicio
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Game;