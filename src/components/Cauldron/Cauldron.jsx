import "./Cauldron.css";

function Cauldron() {
  return (
    <div className="cauldron-area">
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
}

export default Cauldron;