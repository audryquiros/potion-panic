import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Instructions from "../pages/Instructions/Instructions";
import Game from "../pages/Game/Game";
import Scores from "../pages/Scores/Scores";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/instrucciones" element={<Instructions />} />
      <Route path="/juego/:nivel" element={<Game />} />
      <Route path="/puntajes" element={<Scores />} />
    </Routes>
  );
}

export default AppRoutes;