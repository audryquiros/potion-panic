import { forwardRef } from "react";

import "./Cauldron.css";

const Cauldron = forwardRef(function Cauldron(props, ref) {
  return (
    <div
      ref={ref}
      className="cauldron-area"
    >
      <div className="cauldron">
        <div className="cauldron-glow"></div>

        <div className="cauldron-body">
          <div className="cauldron-liquid"></div>
        </div>
      </div>

      <span className="cauldron-label">
        Caldero
      </span>
    </div>
  );
});

export default Cauldron;