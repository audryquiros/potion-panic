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
    ingredientesVolando: 15
  },
  2: {
    tiempo: 30,
    vidas: 3,
    ingredientesVolando: 20
  },
  3: {
    tiempo: 27,
    vidas: 3,
    ingredientesVolando: 25
  },
  4: {
    tiempo: 24,
    vidas: 2,
    ingredientesVolando: 30
  },
  5: {
    tiempo: 20,
    vidas: 2,
    ingredientesVolando: 35
  }
};

const POSICIONES_INGREDIENTES = [
  { top: "3%", left: "4%" },
  { top: "3%", left: "19%" },
  { top: "3%", left: "34%" },
  { top: "3%", left: "49%" },
  { top: "3%", left: "64%" },
  { top: "3%", left: "79%" },
  { top: "3%", left: "91%" },
  { top: "21%", left: "6%" },
  { top: "21%", left: "21%" },
  { top: "21%", left: "36%" },
  { top: "21%", left: "51%" },
  { top: "21%", left: "66%" },
  { top: "21%", left: "81%" },
  { top: "21%", left: "92%" },
  { top: "39%", left: "4%" },
  { top: "39%", left: "19%" },
  { top: "39%", left: "34%" },
  { top: "39%", left: "49%" },
  { top: "39%", left: "64%" },
  { top: "39%", left: "79%" },
  { top: "39%", left: "91%" },
  { top: "57%", left: "6%" },
  { top: "57%", left: "21%" },
  { top: "57%", left: "36%" },
  { top: "57%", left: "51%" },
  { top: "57%", left: "66%" },
  { top: "57%", left: "81%" },
  { top: "57%", left: "92%" },
  { top: "72%", left: "4%" },
  { top: "72%", left: "19%" },
  { top: "72%", left: "34%" },
  { top: "72%", left: "49%" },
  { top: "72%", left: "64%" },
  { top: "72%", left: "79%" },
  { top: "72%", left: "91%" }
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
    ingredientesInstanciasRecogidas,
    setIngredientesInstanciasRecogidas
  ] = useState([]);

  const [
    ingredienteRecogiendo,
    setIngredienteRecogiendo
  ] = useState(null);

  const [flyDistance, setFlyDistance] =
    useState(null);

  /*
   * Transform exacto del ingrediente en el momento del clic.
   * Se usa para congelar únicamente ese ingrediente mientras
   * empieza el vuelo hacia el caldero.
   */
  const [freezeTransform, setFreezeTransform] =
    useState("none");

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
  const [mensajeTipo, setMensajeTipo] = useState("normal");


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
      1: 0.92,
      2: 0.98,
      3: 1.04,
      4: 1.10,
      5: 1.16
    }[nivelNumero] || 0.92;

  const movementScaleReceta =
    [1, 1.12, 1.24][indiceReceta] ||
    1;

  const movementScale = Math.min(
    movementScaleNivel *
      movementScaleReceta,
    1.25
  );

  const movementSpeedNivel =
    {
      1: 6.5,
      2: 5.3,
      3: 4.4,
      4: 3.6,
      5: 3
    }[nivelNumero] || 6.5;

  const movementSpeedReceta =
    [1, 0.82, 0.68][indiceReceta] ||
    1;

  const movementSpeed =
    movementSpeedNivel *
    movementSpeedReceta;

  /*
   * Ingredientes que aparecen volando
   * por el laboratorio.
   *
   * Composición del tablero:
   * - Un poco más de la mitad son ingredientes reales.
   * - Siempre hay 3 venenos.
   * - El resto son ingredientes de relleno.
   *
   * Esto evita que el tablero se llene de repeticiones
   * y hace que el jugador tenga que distinguir mejor
   * lo que necesita de lo que no.
   */
  const ingredientesVolando = useMemo(() => {
    if (
      ingredientes.length === 0 ||
      !configuracion ||
      !recetaActual
    ) {
      return [];
    }

    const cantidad =
      configuracion.ingredientesVolando;

    /*
     * Todos los ingredientes que pueden formar parte
     * de una receta. Son los 8 ingredientes originales.
     */
    const ingredientesReales = ingredientes.filter(
      (ingrediente) =>
        ingrediente.distractor !== true &&
        ingrediente.peligroso !== true
    );

    /*
     * Ingredientes que pueden completar la receta actual.
     */
    const ingredientesReceta = recetaActual.ingredientes
      .map((ingredienteId) =>
        ingredientes.find(
          (ingrediente) =>
            Number(ingrediente.id) ===
            Number(ingredienteId)
        )
      )
      .filter(Boolean);

    /*
     * Los nuevos ingredientes de relleno no aparecen
     * en ninguna receta.
     */
    const distractores = ingredientes.filter(
      (ingrediente) =>
        ingrediente.distractor === true
    );

    /*
     * Hay 3 venenos por tablero.
     * Tenemos tres variantes, pero mantienen el mismo
     * estilo visual del veneno original.
     */
    const venenos = ingredientes.filter(
      (ingrediente) =>
        ingrediente.peligroso === true
    );

    const cantidadIngredientesReales = Math.min(
      Math.ceil(cantidad * 0.6),
      cantidad - 3
    );

    const cantidadVenenos = Math.min(
      3,
      venenos.length,
      cantidad - cantidadIngredientesReales
    );

    const cantidadDistractores = Math.max(
      0,
      cantidad -
        cantidadIngredientesReales -
        cantidadVenenos
    );

    const resultado = [];

    /*
     * Primero garantizamos que todos los ingredientes
     * de la receta actual aparezcan al menos una vez.
     */
    ingredientesReceta.forEach(
      (ingrediente) => {
        if (
          resultado.length <
          cantidadIngredientesReales
        ) {
          resultado.push(ingrediente);
        }
      }
    );

    /*
     * Completamos la cuota de ingredientes reales.
     * Aquí sí pueden existir repeticiones, pero únicamente
     * para llenar el tablero; los distractores son los que
     * aportan variedad visual adicional.
     */
    let indiceReal =
      (nivelNumero * 5 + indiceReceta * 3) %
      Math.max(1, ingredientesReales.length);

    while (
      resultado.length <
      cantidadIngredientesReales
    ) {
      const ingrediente =
        ingredientesReales[
          indiceReal % ingredientesReales.length
        ];

      if (ingrediente) {
        resultado.push(ingrediente);
      }

      indiceReal += 1;
    }

    /*
     * Después colocamos exactamente 3 venenos.
     * Rotamos las variantes para que no aparezca siempre
     * el mismo tipo en las mismas partidas.
     */
    for (
      let index = 0;
      index < cantidadVenenos;
      index++
    ) {
      const veneno =
        venenos[
          (
            nivelNumero +
            indiceReceta +
            index
          ) % venenos.length
        ];

      if (veneno) {
        resultado.push(veneno);
      }
    }

    /*
     * Finalmente agregamos los ingredientes de relleno.
     * No se repiten hasta agotar la colección disponible.
     */
    if (distractores.length > 0) {
      const inicio =
        (nivelNumero * 3 + indiceReceta * 4) %
        distractores.length;

      for (
        let index = 0;
        index < cantidadDistractores;
        index++
      ) {
        const distractor =
          distractores[
            (inicio + index) %
            distractores.length
          ];

        if (distractor) {
          resultado.push(distractor);
        }
      }
    }

    /*
     * Mezcla determinista para distribuir los tres grupos
     * por todo el tablero sin cambiar la composición.
     */
    const ordenados = [...resultado];

    let seed =
      nivelNumero * 97 +
      indiceReceta * 31 +
      cantidad * 13;

    for (
      let index = ordenados.length - 1;
      index > 0;
      index--
    ) {
      seed =
        (seed * 9301 + 49297) %
        233280;

      const posicion =
        Math.floor(
          (seed / 233280) *
          (index + 1)
        );

      [
        ordenados[index],
        ordenados[posicion]
      ] = [
        ordenados[posicion],
        ordenados[index]
      ];
    }

    return ordenados.map(
      (ingrediente, index) => ({
        ...ingrediente,
        instanceId:
          `${ingrediente.id}-${index}-${nivelNumero}-${indiceReceta}`
      })
    );
  }, [
    ingredientes,
    configuracion,
    nivelNumero,
    indiceReceta,
    recetaActual
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
    setIngredientesInstanciasRecogidas([]);
    setIngredienteRecogiendo(null);
    setFlyDistance(null);
    setFreezeTransform("none");

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
      setMensajeTipo("peligro");
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
      setMensajeTipo("normal");
    }, 2200);

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
     * Ingrediente peligroso.
     */
    if (ingrediente.peligroso) {
      setVidas((valor) => {
        const nuevasVidas =
          valor - 1;

        if (nuevasVidas <= 0) {
          setEstadoJuego("derrota");

          setMensajeTipo("peligro");
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

      setMensajeTipo("peligro");
      setMensaje(
        "¡Ingrediente peligroso! · -1 vida"
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

      setMensajeTipo("incorrecto");
      setMensaje(
        "Ingrediente incorrecto · -10 puntos"
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

      /*
       * Leemos una sola vez el transform que el navegador
       * está aplicando por la animación de flotación.
       * En lugar de cambiar a position: fixed, mantenemos
       * el ingrediente en su misma capa y congelamos este
       * transform. Esto evita el pequeño salto y evita que
       * el cambio de layout interfiera con los demás ingredientes.
       */
      const currentTransform =
        window.getComputedStyle(
          ingredientElement
        ).transform;

      setFreezeTransform(
        currentTransform === "none"
          ? "none"
          : currentTransform
      );

      const startX =
        ingredientRect.left;

      const startY =
        ingredientRect.top;

      /*
       * El objetivo es la zona superior del líquido, no
       * el centro de todo el contenedor del caldero.
       * Así la caída termina visualmente dentro de la poción.
       */
      const targetX =
        cauldronRect.left +
        cauldronRect.width / 2 -
        ingredientRect.width / 2;

      const targetY =
        cauldronRect.top +
        cauldronRect.height * 0.25 -
        ingredientRect.height / 2;

      const deltaX =
        targetX - startX;

      const deltaY =
        targetY - startY;

      /*
       * Altura del arco. La trayectoria sube un poco antes
       * de caer al caldero, pero sin importar desde qué lado
       * se pulse el ingrediente.
       */
      const arcHeight = Math.min(
        145,
        Math.max(
          62,
          Math.abs(deltaX) * 0.12 + 52
        )
      );

      setFlyDistance({
        startX,
        startY,
        targetX,
        targetY,
        deltaX,
        deltaY,
        arcHeight
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

    setMensajeTipo("correcto");
    setMensaje(
      `Ingrediente añadido · +${ingrediente.puntos} puntos`
    );

  };

  /*
   * Se ejecuta exactamente cuando termina la animación CSS.
   * Así la reacción del caldero queda sincronizada con la caída
   * y no depende de un timeout aproximado.
   */
  const handleIngredientFlightComplete = (ingrediente) => {
    if (
      ingredienteRecogiendo !==
      ingrediente.instanceId
    ) {
      return;
    }

    setCalderoReaccionando(true);

    window.setTimeout(() => {
      setCalderoReaccionando(false);
    }, 820);

    setIngredientesRecogidos(
      (anteriores) => [
        ...anteriores,
        ingrediente.id
      ]
    );

    setIngredientesInstanciasRecogidas(
      (anteriores) => [
        ...anteriores,
        ingrediente.instanceId
      ]
    );

    setIngredienteRecogiendo(null);
    setFlyDistance(null);
    setFreezeTransform("none");
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

    setMensajeTipo("exito");
    setMensaje(
      "¡Poción preparada! · +100 puntos"
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
        setIngredientesInstanciasRecogidas([]);

        /*
         * El tiempo pertenece al nivel completo.
         * No se reinicia al cambiar de receta.
         */
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
    setIndiceReceta(0);
    setIngredientesRecogidos([]);
    setIngredientesInstanciasRecogidas([]);

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
    setMensajeTipo("normal");
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

              const instanciaYaRecogida =
                ingredientesInstanciasRecogidas.includes(
                  ingrediente.instanceId
                );

              if (instanciaYaRecogida) {
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
                  onFlightComplete={
                    handleIngredientFlightComplete
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
                  freezeTransform={
                    isCollecting
                      ? freezeTransform
                      : "none"
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
          <div className={`game-toast game-toast-${mensajeTipo}`}>
            <span className="game-toast-mark" aria-hidden="true">
              {mensajeTipo === "peligro" ? "!" : mensajeTipo === "incorrecto" ? "−" : "✓"}
            </span>
            <span>{mensaje}</span>
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
          <div className="recipe-complete-overlay">

            <div className="recipe-magic-rings" aria-hidden="true">
              <span className="magic-ring magic-ring-one"></span>
              <span className="magic-ring magic-ring-two"></span>
              <span className="magic-spark spark-one"></span>
              <span className="magic-spark spark-two"></span>
              <span className="magic-spark spark-three"></span>
              <span className="magic-spark spark-four"></span>
              <span className="magic-spark spark-five"></span>
              <span className="magic-spark spark-six"></span>
            </div>

            <div className="recipe-complete-card">
              <div className="recipe-complete-icon">
                <img
                  src={recetaActual.imagen}
                  alt=""
                />
              </div>

              <span className="recipe-complete-label">
                POCIÓN COMPLETADA
              </span>

              <h2>{recetaActual.nombre}</h2>

              <p className="recipe-complete-message">
                La mezcla ha reaccionado correctamente.
              </p>

              <div className="recipe-bonus">
                <span>BONUS DE ALQUIMIA</span>
                <strong>+100</strong>
              </div>

              <div className="recipe-progress-line">
                <span></span>
              </div>

              <p className="recipe-next-message">
                Preparando la siguiente mezcla...
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