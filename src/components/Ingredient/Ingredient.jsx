import "./Ingredient.css";

function Ingredient({
  ingrediente,
  position,
  onCollect,
  onFlightComplete,
  isCollecting,
  isPaused,
  flyDistance,
  freezeTransform = "none",
  movementSpeed,
  movementScale = 1,
  movementDelay = "0s",
  movementPattern
}) {
  const handleClick = (event) => {
    if (isCollecting || isPaused) {
      return;
    }

    onCollect(ingrediente, event);
  };

  const handleAnimationEnd = (event) => {
    if (
      isCollecting &&
      event.animationName === "ingredientFlyToCauldron"
    ) {
      onFlightComplete?.(ingrediente);
    }
  };

  const style = {
    top: position.top,
    left: position.left,
    "--movement-speed": `${movementSpeed}s`,
    "--movement-scale": movementScale,
    "--movement-delay": movementDelay
  };

  /*
   * Durante la recolección fijamos el ingrediente exactamente
   * en la posición visual en la que fue pulsado. Esto evita el
   * salto que ocurría al cambiar de la animación de vuelo libre
   * a la animación hacia el caldero.
   */
  if (isCollecting && flyDistance) {
    /*
     * Congelamos el transform que tenía la animación de flotación
     * en el instante del clic. Así el ingrediente no vuelve a su
     * posición base ni provoca un salto/repaint que haga parecer
     * que todo el tablero se pausa.
     */
    style["--freeze-transform"] = freezeTransform;
    style["--delta-x"] = `${flyDistance.deltaX}px`;
    style["--delta-y"] = `${flyDistance.deltaY}px`;
    style["--arc-height"] = `${flyDistance.arcHeight}px`;
  }

  return (
    <button
      type="button"
      className={`floating-ingredient ${
        !isCollecting
          ? `ingredient-motion-${movementPattern}`
          : "ingredient-collecting"
      } ${
        isPaused ? "ingredient-paused" : ""
      }`}
      style={style}
      onClick={handleClick}
      title={ingrediente.nombre}
      aria-label={`Seleccionar ${ingrediente.nombre}`}
      disabled={isCollecting || isPaused}
    >
      <span
        className="ingredient-flight"
        onAnimationEnd={handleAnimationEnd}
      >
        <span className="ingredient-flight-glow" aria-hidden="true"></span>

        <span className="ingredient-visual">
          <img
            src={ingrediente.imagen}
            alt={ingrediente.nombre}
            draggable="false"
          />
        </span>
      </span>
    </button>
  );
}

export default Ingredient;
