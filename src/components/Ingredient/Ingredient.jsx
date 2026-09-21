import "./Ingredient.css";

function Ingredient({
  ingrediente,
  position,
  onCollect,
  isCollecting,
  isPaused,
  flyDistance,
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

  const style = {
    top: position.top,
    left: position.left,

    "--movement-speed": `${movementSpeed}s`,
    "--movement-scale": movementScale,
    "--movement-delay": movementDelay
  };

  if (isCollecting && flyDistance) {
    style["--center-x"] =
      `${flyDistance.centerX}px`;

    style["--center-y"] =
      `${flyDistance.centerY}px`;

    style["--cauldron-x"] =
      `${flyDistance.cauldronX}px`;

    style["--cauldron-y"] =
      `${flyDistance.cauldronY}px`;
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
      <span className="ingredient-flight">
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