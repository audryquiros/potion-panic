import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Link,
  useParams
} from "react-router-dom";

import Ingredient from "../../components/Ingredient/Ingredient";
import Cauldron from "../../components/Cauldron/Cauldron";

import {
  getIngredientes,
  getRecetas
} from "../../services/api";

import "./Game.css";

function Game() {
  const { nivel } = useParams();

  const gameBoardRef = useRef(null);
  const cauldronRef = useRef(null);

  const [recetas, setRecetas] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);

  const [collectingIngredient, setCollectingIngredient] =
    useState(null);

  const [flyDistance, setFlyDistance] = useState({
    x: 0,
    y: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <main className="game-page">
        <div className="game-message">
          <h2>Cargando laboratorio...</h2>
          <p>Preparando los ingredientes.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="game-page">
        <div className="game-message error">
          <h2>No se pudo cargar el juego</h2>

          <p>{error}</p>

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

  const recetasDelNivel = recetas.filter(
    (receta) =>
      receta.nivel === Number(nivel)
  );

  const recetaActual = recetasDelNivel[0];

  const ingredientesDeLaReceta =
    recetaActual
      ? ingredientes.filter(
          (ingrediente) =>
            recetaActual.ingredientes.includes(
              ingrediente.id
            )
        )
      : [];

  const ingredientPositions = [
    {
      top: "15%",
      left: "15%"
    },
    {
      top: "30%",
      left: "55%"
    },
    {
      top: "12%",
      left: "80%"
    },
    {
      top: "48%",
      left: "28%"
    },
    {
      top: "40%",
      left: "70%"
    },
    {
      top: "25%",
      left: "40%"
    }
  ];

  const handleCollectIngredient = (
    ingrediente,
    event
  ) => {
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

    /*
      Centro del ingrediente
    */

    const ingredientCenterX =
      ingredientRect.left +
      ingredientRect.width / 2;

    const ingredientCenterY =
      ingredientRect.top +
      ingredientRect.height / 2;

    /*
      Centro visual del tablero
    */

    const boardCenterX =
      boardRect.left +
      boardRect.width / 2;

    const boardCenterY =
      boardRect.top +
      boardRect.height / 2;

    /*
      Punto de entrada del caldero.

      Usamos la parte superior del caldero
      para que parezca que el ingrediente
      cae dentro.
    */

    const cauldronCenterX =
      cauldronRect.left +
      cauldronRect.width / 2;

    const cauldronTargetY =
      cauldronRect.top +
      35;

    /*
      Distancia desde ingrediente
      hasta el centro del tablero.
    */

    const centerDistanceX =
      boardCenterX -
      ingredientCenterX;

    const centerDistanceY =
      boardCenterY -
      ingredientCenterY;

    /*
      Distancia desde el centro
      del tablero hasta el caldero.
    */

    const cauldronDistanceX =
      cauldronCenterX -
      boardCenterX;

    const cauldronDistanceY =
      cauldronTargetY -
      boardCenterY;

    /*
      Guardamos ambos movimientos.

      La animación usará:

      --center-x
      --center-y

      y después:

      --cauldron-x
      --cauldron-y
    */

    setFlyDistance({
      centerX: centerDistanceX,
      centerY: centerDistanceY,
      cauldronX: cauldronDistanceX,
      cauldronY: cauldronDistanceY
    });

    setCollectingIngredient(
      ingrediente.id
    );

    setTimeout(() => {
      setCollectingIngredient(null);
    }, 1100);
  };

  if (!recetaActual) {
    return (
      <main className="game-page">
        <div className="game-message">
          <h2>Nivel no disponible</h2>

          <p>
            No encontramos una receta
            para el nivel {nivel}.
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

  return (
    <main className="game-page">
      <header className="game-header">
        <div>
          <p className="game-eyebrow">
            Potion Panic
          </p>

          <h1>
            Nivel {nivel}
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
        <div>
          <span className="recipe-label">
            Receta actual
          </span>

          <h2>
            {recetaActual.nombre}
          </h2>

          <p>
            Encuentra los ingredientes
            necesarios antes de que se
            termine el tiempo.
          </p>
        </div>

        <div className="recipe-ingredients">
          {ingredientesDeLaReceta.map(
            (ingrediente) => (
              <div
                key={ingrediente.id}
                className="recipe-ingredient"
              >
                <span className="recipe-ingredient-letter">
                  {ingrediente.nombre.charAt(0)}
                </span>

                <span>
                  {ingrediente.nombre}
                </span>
              </div>
            )
          )}
        </div>
      </section>

      <section className="game-stats">
        <div className="stat-card">
          <span>Tiempo</span>

          <strong>
            {recetaActual.tiempo}s
          </strong>
        </div>

        <div className="stat-card">
          <span>Puntos</span>

          <strong>0</strong>
        </div>

        <div className="stat-card">
          <span>Vidas</span>

          <strong>3</strong>
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
              Encuentra los ingredientes
            </h2>
          </div>

          <span className="board-level">
            Nivel {nivel}
          </span>
        </div>

        <div className="ingredients-area">
          {ingredientes.map(
            (ingrediente, index) => {
              const isCollecting =
                collectingIngredient ===
                ingrediente.id;

              return (
                <Ingredient
                  key={ingrediente.id}
                  ingrediente={ingrediente}
                  position={
                    ingredientPositions[index]
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
                />
              );
            }
          )}
        </div>

        <div ref={cauldronRef}>
          <Cauldron />
        </div>
      </section>
    </main>
  );
}

export default Game;