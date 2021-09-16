import React from "react";
import "./GamePage.scss";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import cardPack from "../../utils/cardPack";
import shuffleCards from "../../utils/shuffleCards";
import io from "socket.io-client";
import queryString from "query-string";
import useSound from "use-sound";
import Hand from "../Hand/Hand";
import bgMusic from "../../assets/sounds/background_music.mp3";
import gameOverMusic from "../../assets/sounds/game_over_music.mp3";
import hitCardSound from "../../assets/sounds/hit_sound.mp3";
import winningSound from "../../assets/sounds/Winning-sound-effect.mp3";

let socket;

const ENDPOINT = "http://localhost:8800" || "http://localhost:5000";

const GamePage = (props) => {
  //CONNECT SOCKET-IO TO CLIENT SIDE

  const data = queryString.parse(props.location.search);

  const [deck, setDeck] = useState(cardPack);

  const [room, setRoom] = useState(data.roomCode);
  const [roomFull, setRoomFull] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const connectionOptions = {
      forceNew: true,
      reconnectionAttempts: "Infinity",
      timeout: 10000,
      transports: ["websocket"],
    };
    socket = io("/", {
      withCredentials: true,
      ...connectionOptions,
    });

    socket.emit("join", { room: room }, (error) => {
      if (error) setRoomFull(true);
    });

    //cleanup on component unmount
    return function cleanup() {
      socket.emit("disconnect");
      //shut down connnection instance
      socket.off();
    };
  }, [room]);

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");

  const [player1Deck, setPlayer1Deck] = useState([]);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player1Count, setPlayer1Count] = useState(0);
  const [player1StandClick, setPlayer1StandClick] = useState(false);

  const [player2Deck, setPlayer2Deck] = useState([]);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player2Count, setPlayer2Count] = useState(0);
  const [player2StandClick, setPlayer2StandClick] = useState(false);

  const [turn, setTurn] = useState("");

  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(true);

  const [playBBgMusic, { pause }] = useSound(bgMusic, { loop: true });
  const [playGameOverSound] = useSound(gameOverMusic);
  const [playHitSound] = useSound(hitCardSound);
  const [playWinningSound] = useSound(winningSound);

  const [buttonState, setButtonState] = useState({
    hitDisabled: false,
    standDisabled: false,
    resetDisabled: true,
  });

  const dealCard = (dealType, value, suit) => {
    switch (dealType) {
      case "Player 1":
        player1Deck.push({
          value,
          suit,
        });
        setPlayer1Deck([...player1Deck]);
        break;
      case "Player 2":
        player2Deck.push({
          value,
          suit,
        });
        setPlayer2Deck([...player2Deck]);
        break;
      default:
        break;
    }
  };

  const drawCard = (dealType) => {
    if (deck.length > 0) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck[randomIndex];
      console.log("Card is", card);
      deck.splice(randomIndex, 1);
      setDeck([...deck]);
      console.log("Remaining Cards:", deck.length);
      switch (card.suit) {
        case "S":
          dealCard(dealType, card.value, card.suit);
          break;
        case "D":
          dealCard(dealType, card.value, card.suit);
          break;
        case "C":
          dealCard(dealType, card.value, card.suit);
          break;
        case "H":
          dealCard(dealType, card.value, card.suit);
          break;
        default:
          break;
      }
    } else {
      alert("All cards have been drawn");
    }
  };

  const bust = useCallback(() => {
    buttonState.hitDisabled = true;
    buttonState.standDisabled = true;
    buttonState.resetDisabled = false;
    setButtonState({ ...buttonState });
    setMessage("Busted");
  }, []);

  const checkWin = () => {
    if (
      (player1Score > player2Score && player1Score < 21) ||
      player1Score === 21 ||
      player2Score > 21
    ) {
      setMessage("Player 1 won");
      setWinner("Player 1");
      playWinningSound();
      setGameOver(true);
      socket.emit("updateGameState", {
        gameOver: true,
        winner: "Player 1",
        turn: "Player 1",
        player1Deck: [...player1Deck],
        player2Deck: [...player2Deck],
      });
    } else {
      setMessage("Player 2 won");
      setWinner("Player 2");
      playWinningSound();
      setGameOver(true);
      socket.emit("updateGameState", {
        gameOver: true,
        winner: "Player 2",
        turn: "Player 2",
        player1Deck: [...player1Deck],
        player2Deck: [...player2Deck],
      });
    }
  };

  useEffect(() => {
    const shuffledCards = shuffleCards(cardPack);

    const player1Deck = shuffledCards.splice(0, 2);

    const player2Deck = shuffledCards.splice(0, 2);

    socket.emit("initGameState", {
      gameOver: false,
      turn: "Player 1",
      player1Deck: [...player1Deck],
      player2Deck: [...player2Deck],
      player1Score,
      player2Score,
    });
  }, []);

  useEffect(() => {
    calculate(player1Deck, setPlayer1Score);
    setPlayer1Count(player1Count + 1);
  }, [player1Deck]);

  useEffect(() => {
    calculate(player2Deck, setPlayer2Score);
    setPlayer2Count(player2Count + 1);
  }, [player2Deck]);

  useEffect(() => {
    if (turn === "Player 1") {
      if (player1Score === 21) {
        buttonState.hitDisabled = true;
        setButtonState({ ...buttonState });
        setWinner(turn);

        setTimeout(() => {
          socket.emit("updateGameState", {
            gameOver: true,
            turn: "Player 1",
            player1Deck: [...player1Deck],
            player2Deck: [...player2Deck],
          });
        }, 1000);
      } else if (player1Score > 21) {
        bust();
      }
    }
  }, [buttonState, player1Score, turn]);

  useEffect(() => {
    if (turn === "Player 2") {
      if (player2Score === 21) {
        buttonState.hitDisabled = true;
        setButtonState({ ...buttonState });
        setWinner(turn);
        setTimeout(() => {
          socket.emit("updateGameState", {
            gameOver: true,
            turn: "Player 2",
            player1Deck: [...player1Deck],
            player2Deck: [...player2Deck],
          });
        }, 1000);
      } else if (player1Score >= 21 || player2Score >= 21) {
        setTimeout(() => {
          checkWin();
          socket.emit("updateGameState", {
            gameOver: true,
            player1Deck: [...player1Deck],
            player2Deck: [...player2Deck],
            player1Score,
            player2Score,
          });
        }, 1000);
      }
    }
  }, [buttonState, player2Score, turn]);

  useEffect(() => {
    socket.on(
      "initGameState",
      ({
        gameOver,
        turn,
        player1Deck,
        player1Count,
        player1Score,
        player1StandClick,
        player2Deck,
        player2Count,
        player2Score,
        player2StandClick,
      }) => {
        setGameOver(gameOver);
        setTurn(turn);
        setPlayer1Deck(player1Deck);
        setPlayer1Count(player1Count);
        setPlayer1Score(player1Score);
        setPlayer1StandClick(player1StandClick);
        setPlayer2Deck(player2Deck);
        setPlayer2Count(player2Count);
        setPlayer2Score(player2Score);
        setPlayer2StandClick(player2StandClick);
      }
    );

    socket.on(
      "updateGameState",
      ({
        gameOver,
        winner,
        turn,
        player1Deck,
        player1Count,
        player1Score,
        player1StandClick,
        player2Deck,
        player2Count,
        player2Score,
        player2StandClick,
      }) => {
        gameOver && setGameOver(gameOver);
        gameOver === true && playGameOverSound();
        winner && setWinner(winner);
        turn && setTurn(turn);
        player1Deck && setPlayer1Deck(player1Deck);
        player1Count && setPlayer1Count(player1Count);
        player1Score && setPlayer1Score(player1Score);
        player1StandClick && setPlayer1StandClick(player1StandClick);
        player2Deck && setPlayer2Deck(player2Deck);
        player2Count && setPlayer2Count(player2Count);
        player2Score && setPlayer2Score(player2Score);
        player2StandClick && setPlayer2StandClick(player2StandClick);
      }
    );

    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });

    socket.on("currentUserData", ({ name }) => {
      setCurrentUser(name);
    });
  }, []);

  const resetGame = () => {
    console.clear();
    setDeck(cardPack);

    setPlayer1Score(0);
    setPlayer1Count(0);

    setPlayer2Score(0);
    setPlayer2Count(0);

    setMessage(message);
    setButtonState({
      hitDisabled: false,
      standDisabled: false,
      resetDisabled: true,
    });
    socket.emit("initGameState", {
      gameOver: false,
      turn: "Player 1",
      player1Deck: [...player1Deck],
      player2Deck: [...player2Deck],
      player1Score,
      player2Score,
    });
  };

  const calculate = (cards, setScore) => {
    let total = 0;
    cards.forEach((card) => {
      if (card.value !== "A") {
        switch (card.value) {
          case "K":
            total += 10;
            break;
          case "Q":
            total += 10;
            break;
          case "J":
            total += 10;
            break;
          default:
            total += Number(card.value);
            break;
        }
      }
    });
    const aces = cards.filter((card) => {
      return card.value === "A";
    });
    aces.forEach((card) => {
      if (total + 11 > 21) {
        total += 1;
      } else if (total + 11 === 21) {
        if (aces.length > 1) {
          total += 1;
        } else {
          total += 11;
        }
      } else {
        total += 11;
      }
    });
    setScore(total);
  };

  const hit = (dealer) => {
    drawCard(dealer);
    playHitSound();

    if (dealer === "Player 1") {
      socket.emit("updateGameState", {
        gameOver: false,
        turn: "Player 2",
        player1Deck: [...player1Deck],
        player2Deck: [...player2Deck],
        player1Score,
        player2Score,
      });
    } else if (dealer === "Player 2") {
      socket.emit("updateGameState", {
        gameOver: false,
        turn: "Player 1",
        player1Deck: [...player1Deck],
        player2Deck: [...player2Deck],
        player1Score,
        player2Score,
      });
    }
  };

  const stand = () => {
    buttonState.hitDisabled = true;
    buttonState.standDisabled = true;
    buttonState.resetDisabled = false;
    if (turn === "Player 1") {
      socket.emit("updateGameState", {
        gameOver: false,
        turn: "Player 2",
        player1Deck: [...player1Deck],
        player2Deck: [...player2Deck],
        player1StandClick: true,
      });
    }
    if (turn === "Player 2") {
      socket.emit("updateGameState", {
        gameOver: false,
        turn: "Player 1",
        player1Deck: [...player1Deck],
        player2Deck: [...player2Deck],
        player2StandClick: true,
      });
    }
    if (player1StandClick && player1StandClick) {
      setTimeout(() => {
        checkWin();
      }, 1000);
    }
  };

  console.log("Player 1 deck is:", player1Deck);
  console.log("Player 2 deck is:", player2Deck);

  console.log("Player 1 score is:", player1Score);
  console.log("Player 2 score is:", player2Score);

  console.log("Deck is:", deck);
  console.log(currentUser);

  console.log("Player 1 stand;", player1StandClick);
  console.log("Player 2 stand:", player2StandClick);

  // io.connect(ENDPOINT).emit("updateGameState");

  return (
    <div className="Game backgroundPlay">
      {!roomFull ? (
        <>
          <div className="topInfo">
            <h1>Game Code: {room}</h1>
            <span>
              <button
                className="game-button green"
                onClick={() => setIsSoundMuted(!isSoundMuted)}
              >
                {isSoundMuted ? (
                  <span className="material-icons">volume_off</span>
                ) : (
                  <span className="material-icons">volume_up</span>
                )}
              </button>
              <button
                className="game-button green"
                onClick={() => {
                  if (isMusicMuted) playBBgMusic();
                  else pause();
                  setIsMusicMuted(!isMusicMuted);
                }}
              >
                {isMusicMuted ? (
                  <span className="material-icons">music_off</span>
                ) : (
                  <span className="material-icons">music_note</span>
                )}
              </button>
              <div className="reset-quit-button">
                <Link to="/">
                  <button className="game-button red">QUIT</button>
                </Link>
                <button className="game-button red" onClick={() => resetGame()}>
                  RESET
                </button>
              </div>
            </span>
          </div>

          {/* PLAYER LEFT MESSAGES */}
          {users.length === 1 && currentUser === "Player 2" && (
            <h1 className="topInfoText">Player 1 has left the game.</h1>
          )}
          {users.length === 1 && currentUser === "Player 1" && (
            <h1 className="topInfoText">
              Waiting for Player 2 to join the game.
            </h1>
          )}

          {users.length === 2 && (
            <>
              {gameOver ? (
                <div className="game-over-status">
                  {winner !== "" && (
                    <>
                      <h1>GAME OVER</h1>
                      <h2>{winner} wins!</h2>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {/* PLAYER 1 VIEW */}
                  {currentUser === "Player 1" && (
                    <>
                      <div className="cards">
                        <div
                          className="player2Deck"
                          style={{ pointerEvents: "none" }}
                        >
                          <Hand
                            title={`Player2's Hand (${player2Score})`}
                            cards={player2Deck}
                          />
                        </div>

                        <div
                          className="middleInfo"
                          style={
                            turn === "Player 2"
                              ? { pointerEvents: "none" }
                              : null
                          }
                        >
                          <button
                            className="game-button"
                            disabled={turn !== "Player 1"}
                            onClick={() => hit("Player 1")}
                          >
                            HIT
                          </button>

                          <button
                            className="game-button orange"
                            onClick={() => {
                              stand();
                            }}
                          >
                            STAND
                          </button>
                        </div>
                        <br />
                        <div
                          className="player1Deck"
                          style={
                            turn === "Player 1"
                              ? null
                              : { pointerEvents: "none" }
                          }
                        >
                          <Hand
                            title={`Player1's Hand (${player1Score})`}
                            cards={player1Deck}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* PLAYER 2 VIEW */}
                  {currentUser === "Player 2" && (
                    <>
                      <div className="cards">
                        <div
                          className="player1Deck"
                          style={{ pointerEvents: "none" }}
                        >
                          <Hand
                            title={`Player1's Hand (${player1Score})`}
                            cards={player1Deck}
                          />
                        </div>

                        <div
                          className="middleInfo"
                          style={
                            turn === "Player 1"
                              ? { pointerEvents: "none" }
                              : null
                          }
                        >
                          <button
                            className="game-button"
                            disabled={turn !== "Player 2"}
                            onClick={() => hit("Player 2")}
                          >
                            HIT
                          </button>

                          <button
                            className="game-button orange"
                            onClick={() => {
                              stand();
                            }}
                          >
                            STAND
                          </button>
                        </div>
                        <br />
                        <div
                          className="player2Deck"
                          style={
                            turn === "Player 1"
                              ? { pointerEvents: "none" }
                              : null
                          }
                        >
                          <Hand
                            title={`Player2's Hand (${player2Score})`}
                            cards={player2Deck}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <h1>Room full</h1>
      )}

      <br />
    </div>
  );
};

export default GamePage;
