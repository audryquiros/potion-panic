import { forwardRef } from "react";
import "./Cauldron.css";

const Cauldron = forwardRef(function Cauldron(
  {
    isReacting = false,
    liquidColor = "#8064aa"
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={`cauldron-area ${
        isReacting
          ? "cauldron-reacting"
          : ""
      }`}
    >
      <div className="cauldron">
        {/* Brillo exterior */}
        <div className="cauldron-glow"></div>

        {/* Splash */}
        <div
          className="cauldron-splash"
          aria-hidden="true"
        >
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Cuerpo */}
        <div className="cauldron-body">
          {/* Aro superior */}
          <div className="cauldron-rim"></div>

          {/* Líquido */}
          <div
            className="cauldron-liquid"
            style={{
              "--liquid-color": liquidColor
            }}
          >
            <div className="liquid-surface"></div>

            <div
              className="liquid-highlight"
              aria-hidden="true"
            ></div>

            <div
              className="cauldron-bubbles"
              aria-hidden="true"
            >
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          {/* Interior oscuro */}
          <div className="cauldron-inner-shadow"></div>
        </div>

        {/* Patas */}
        <div className="cauldron-leg cauldron-leg-left"></div>
        <div className="cauldron-leg cauldron-leg-right"></div>
      </div>

      <span className="cauldron-label">
        Caldero
      </span>
    </div>
  );
});

export default Cauldron;