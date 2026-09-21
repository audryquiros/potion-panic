import "./Ingredient.css";

function Ingredient({
  ingrediente,
  position,
  onCollect,
  isCollecting,
  flyDistance
}) {
  const handleClick = (event) => {
    if (isCollecting) {
      return;
    }

    onCollect(ingrediente, event);
  };

  const style = {
    top: position.top,
    left: position.left
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
        isCollecting
          ? "ingredient-collecting"
          : ""
      }`}
      style={style}
      onClick={handleClick}
      title={ingrediente.nombre}
      disabled={isCollecting}
    >
      <div className="ingredient-visual">
        {ingrediente.nombre.charAt(0)}
      </div>
    </button>
  );
}

export default Ingredient;