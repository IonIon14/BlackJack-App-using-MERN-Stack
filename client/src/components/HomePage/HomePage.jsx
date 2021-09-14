import React from "react";
import "./HomePage.scss";
import { useState } from "react";
import { Link } from "react-router-dom";
import randomCodeGenerator from "../../utils/randomCode";

const HomePage = () => {
  const [roomCode, setRoomCode] = useState("");

  return (
    <div className="home-page">
      <div className="homepage-menu">
        <img
          src={require("../../assets/output-onlinepngtools.png").default}
          width="220px"
          alt="home-background"
        />
        <div className="homepage-form">
          <input
            type="text"
            placeholder="Game Code"
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <Link to={`/play?roomCode=${roomCode}`}>
            <button className="game-button green">JOIN GAME</button>
          </Link>
          <h1>OR</h1>
          <div className="homepage-create">
            <Link to={`/play?roomCode=${randomCodeGenerator(5)}`}>
              <button className="game-button orange">CREATE GAME</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;