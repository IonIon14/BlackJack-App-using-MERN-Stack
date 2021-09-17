import React from "react";
import "./HomePage.scss";
import { useState } from "react";
import { Link } from "react-router-dom";
import randomCodeGenerator from "../../utils/randomCode";
import useSound from "use-sound";
import hitCardSound from "../../assets/sounds/hit_sound.mp3";
const HomePage = () => {
  const [roomCode, setRoomCode] = useState("");
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [playHitSound] = useSound(hitCardSound);

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
            className="formInput"
            placeholder="Game Code"
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <span class="focus-border"></span>
          <Link to={`/play?roomCode=${roomCode}`}>
            <button
              className="game-button green"
              onClick={() => {
                setIsSoundMuted(!isSoundMuted);
                if (!isSoundMuted) playHitSound();
              }}
            >
              JOIN GAME
            </button>
          </Link>
          <h1>OR</h1>
          <div className="homepage-create">
            <Link to={`/play?roomCode=${randomCodeGenerator(5)}`}>
              <button
                className="game-button orange"
                onClick={() => {
                  setIsSoundMuted(!isSoundMuted);
                  if (!isSoundMuted) playHitSound();
                }}
              >
                CREATE GAME
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
