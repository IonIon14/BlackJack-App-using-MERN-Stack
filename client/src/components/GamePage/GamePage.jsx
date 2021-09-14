import React from "react";
import "./GamePage.scss";
import { useState, useEffect, useCallback } from "react";
import cardPack from "../../utils/cardPack";
import shuffleCards from "../../utils/shuffleCards";
import io from "socket.io-client";
import queryString from "query-string";
import Spinner from "../Spinner/Spinner";
import useSound from "use-sound";
import Card from "../Card/Card";

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
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const connectionOptions = {
      forceNew: true,
      reconnectionAttempts: "Infinity",
      timeout: 10000,
      transports: ["websocket"],
    };
    socket = io.connect(ENDPOINT, connectionOptions);

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

  const [gameOver, setGameOver] = useState(true);
  const [winner, setWinner] = useState("");

  const [player1Deck, setPlayer1Deck] = useState([]);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player1Count, setPlayer1Count] = useState(0);

  const [player2Deck, setPlayer2Deck] = useState([]);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player2Count, setPlayer2Count] = useState(0);

  const [turn, setTurn] = useState("");

  const [isChatBoxHidden, setIsChatBoxHidden] = useState(true);
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

  const dealCard = useCallback(
    (dealType, value, imageFront) => {
      switch (dealType) {
        case "Player 1":
          player1Deck.push({
            value: value,
            imageFront: imageFront,
            hidden: false,
          });
          setPlayer1Deck([...player1Deck]);
          break;
        case "Player 2":
          player2Deck.push({
            value: value,
            imageFront: imageFront,
            hidden: false,
          });
          setPlayer2Deck([...player2Deck]);
          break;
        default:
          break;
      }
    },
    [player1Deck, player2Deck]
  );

  const drawCard = useCallback(
    (dealType) => {
      if (deck.length > 0) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        const card = deck[randomIndex];
        deck.splice(randomIndex, 1);
        setDeck([...deck]);
        console.log("Remaining Cards:", deck.length);
        switch (card.suit) {
          case "spades":
            dealCard(dealType, card.value, "♠");
            break;
          case "diamonds":
            dealCard(dealType, card.value, "♦");
            break;
          case "clubs":
            dealCard(dealType, card.value, "♣");
            break;
          case "hearts":
            dealCard(dealType, card.value, "♥");
            break;
          default:
            break;
        }
      } else {
        alert("All cards have been drawn");
      }
    },
    [dealCard, deck]
  );

  const bust = useCallback(() => {
    buttonState.hitDisabled = true;
    buttonState.standDisabled = true;
    buttonState.resetDisabled = false;
    setButtonState({ ...buttonState });
    setMessage("Busted");
  }, [buttonState]);

  const checkWin = useCallback(() => {
    if (player1Score > player2Score || player2Score > 21) {
      setMessage("Player 1 won");
      setWinner("Player 1");
      playWinningSound();
    } else if (player2Score > player1Score) {
      setMessage("Player 2 won");
      setWinner("Player 2");
      playWinningSound();
    } else {
      setMessage("Tie");
    }
  }, [playWinningSound, player1Score, player2Score]);

  useEffect(() => {
    const shuffledCards = shuffleCards(cardPack);

    const player1Deck = shuffledCards.splice(0, 2);

    const player2Deck = shuffledCards.splice(0, 2);

    socket.emit("initGameState", {
      gameOver: false,
      turn: "Player 1",
      player1Deck: [...player1Deck],
      player2Deck: [...player2Deck],
    });
  }, []);

  useEffect(() => {
    calculate(player1Deck, setPlayer1Score);
    setPlayer1Count(player1Count + 1);
  }, [player1Count, player1Deck]);

  useEffect(() => {
    calculate(player2Deck, setPlayer2Score);
    setPlayer1Count(player2Count + 1);
  }, [player2Count, player2Deck]);

  useEffect(() => {
    if (turn === "Player 1") {
      if (player1Score === 21) {
        buttonState.hitDisabled = true;
        setButtonState({ ...buttonState });
      } else if (player1Score > 21) {
        bust();
      }
    }
  }, [bust, buttonState, player1Count, player1Score, turn]);

  useEffect(() => {
    if (turn === "Player 2") {
      if (player2Score >= 17) {
        checkWin();
      } else {
        drawCard("Player 2");
      }
    }
  }, [checkWin, drawCard, player2Deck, player2Score, turn]);

  useEffect(() => {
    socket.on(
      "initGameState",
      ({
        gameOver,
        turn,
        player1Deck,
        player1Count,
        player1Score,
        player2Deck,
        player2Count,
        player2Score,
      }) => {
        setGameOver(gameOver);
        setTurn(turn);
        setPlayer1Deck(player1Deck);
        setPlayer1Count(player1Count);
        setPlayer1Score(player1Score);
        setPlayer2Deck(player2Deck);
        setPlayer2Count(player2Count);
        setPlayer2Score(player2Score);
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
        player2Deck,
        player2Count,
        player2Score,
      }) => {
        gameOver && setGameOver(gameOver);
        gameOver === true && playGameOverSound();
        winner && setWinner(winner);
        turn && setTurn(turn);
        player1Deck && setPlayer1Deck(player1Deck);
        player1Count && setPlayer1Count(player1Count);
        player1Score && setPlayer1Score(player1Score);
        player2Deck && setPlayer2Deck(player2Deck);
        player2Count && setPlayer2Count(player2Count);
        player2Score && setPlayer2Score(player2Score);
      }
    );

    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });

    socket.on("currentUserData", ({ name }) => {
      setCurrentUser(name);
    });

    socket.on("message", (message) => {
      setMessages((messages) => [...messages, message]);

      const chatBody = document.querySelector(".chat-body");
      chatBody.scrollTop = chatBody.scrollHeight;
    });
  }, [playGameOverSound]);

  const resetGame = () => {
    console.clear();
    setDeck(cardPack);

    setPlayer1Deck([]);
    setPlayer1Score(0);
    setPlayer1Count(0);

    setPlayer2Deck([]);
    setPlayer2Score(0);
    setPlayer2Count(0);

    // setGameState(GameState.bet);
    setMessage(message);
    setButtonState({
      hitDisabled: false,
      standDisabled: false,
      resetDisabled: true,
    });
  };

  const toggleChatBox = () => {
    const chatBody = document.querySelector(".chat-body");
    if (isChatBoxHidden) {
      chatBody.style.display = "block";
      setIsChatBoxHidden(false);
    } else {
      chatBody.style.display = "none";
      setIsChatBoxHidden(true);
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (message) {
      socket.emit("sendMessage", { message: message }, () => {
        setMessage("");
      });
    }
  };

  const calculate = (cards, setScore) => {
    let total = 0;
    cards.forEach((card) => {
      if (card.hidden === false && card.value !== "A") {
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
      if (card.hidden === false) {
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
      }
    });
    setScore(total);
  };

  const hit = (dealType) => {
    drawCard(dealType);
    playHitSound();
  };

  const stand = () => {
    buttonState.hitDisabled = true;
    buttonState.standDisabled = true;
    buttonState.resetDisabled = false;
    setButtonState({ ...buttonState });
  };

  console.log("Player 1 deck is:", player1Deck);
  console.log("Player 2 deck is:", player2Deck);

  return (
    <div className={`Game backgroundPlay`}>
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
                <div>
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
                      <div
                        className="player2Deck"
                        style={{ pointerEvents: "none" }}
                      >
                        <p className="playerDeckText">Player 2</p>
                        {player2Deck.map((item, i) => (
                          <Card key={i} isHidden={false} imageFront={item} />
                        ))}
                        {turn === "Player 2" && <Spinner />}
                      </div>
                      <br />
                      <div
                        className="middleInfo"
                        style={
                          turn === "Player 2" ? { pointerEvents: "none" } : null
                        }
                      >
                        <button
                          className="game-button"
                          disabled={turn !== "Player 1"}
                          onClick={() => hit()}
                        >
                          HIT
                        </button>

                        <button
                          className="game-button orange"
                          onClick={() => stand()}
                        >
                          STAND
                        </button>
                      </div>
                      <br />
                      <div
                        className="player1Deck"
                        style={
                          turn === "Player 1" ? null : { pointerEvents: "none" }
                        }
                      >
                        <p className="playerDeckText">Player 1</p>
                        {player1Deck.map((item, i) => (
                          <Card key={i} isHidden={false} imageFront={item} />
                        ))}
                      </div>
                      <div className="chatBoxWrapper">
                        <div className="chat-box chat-box-player1">
                          <div className="chat-head">
                            <h2>Chat Box</h2>
                            {!isChatBoxHidden ? (
                              <span
                                onClick={toggleChatBox}
                                class="material-icons"
                              >
                                keyboard_arrow_down
                              </span>
                            ) : (
                              <span
                                onClick={toggleChatBox}
                                class="material-icons"
                              >
                                keyboard_arrow_up
                              </span>
                            )}
                          </div>
                          <div className="chat-body">
                            <div className="msg-insert">
                              {messages.map(
                                (msg) =>
                                  msg.user === "Player 2" && (
                                    <div className="msg-receive">
                                      {msg.text}
                                    </div>
                                  ) &&
                                  msg.user === "Player 1" && (
                                    <div className="msg-send">{msg.text}</div>
                                  )
                              )}
                            </div>
                            <div className="chat-text">
                              <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(event) =>
                                  setMessage(event.target.value)
                                }
                                onKeyPress={(event) =>
                                  event.key === "Enter" && sendMessage(event)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>{" "}
                    </>
                  )}

                  {/* PLAYER 2 VIEW */}
                  {currentUser === "Player 2" && (
                    <>
                      <div
                        className="player1Deck"
                        style={{ pointerEvents: "none" }}
                      >
                        <p className="playerDeckText">Player 1</p>
                        {player1Deck.map((item, i) => (
                          <Card key={i} isHidden={false} imageFront={item} />
                        ))}

                        {turn === "Player 1" && <Spinner />}
                      </div>
                      <br />
                      <div
                        className="middleInfo"
                        style={
                          turn === "Player 1" ? { pointerEvents: "none" } : null
                        }
                      >
                        <button
                          className="game-button"
                          disabled={turn !== "Player 2"}
                          onClick={() => hit()}
                        >
                          HIT
                        </button>

                        <button
                          className="game-button orange"
                          onClick={() => stand()}
                        >
                          STAND
                        </button>
                      </div>
                      <br />
                      <div
                        className="player2Deck"
                        style={
                          turn === "Player 1" ? { pointerEvents: "none" } : null
                        }
                      >
                        <p className="playerDeckText">Player 2</p>
                        {player2Deck.map((item, i) => (
                          <Card key={i} isHidden={false} imageFront={item} />
                        ))}
                      </div>
                      <div className="chatBoxWrapper">
                        <div className="chat-box chat-box-player2">
                          <div className="chat-head">
                            <h2>Chat Box</h2>
                            {!isChatBoxHidden ? (
                              <span
                                onClick={toggleChatBox}
                                class="material-icons"
                              >
                                keyboard_arrow_down
                              </span>
                            ) : (
                              <span
                                onClick={toggleChatBox}
                                class="material-icons"
                              >
                                keyboard_arrow_up
                              </span>
                            )}
                          </div>
                          <div className="chat-body">
                            <div className="msg-insert">
                              {messages.map(
                                (msg) =>
                                  msg.user === "Player 1" && (
                                    <div className="msg-receive">
                                      {msg.text}
                                    </div>
                                  ) &&
                                  msg.user === "Player 2" && (
                                    <div className="msg-send">{msg.text}</div>
                                  )
                              )}
                            </div>
                            <div className="chat-text">
                              <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(event) =>
                                  setMessage(event.target.value)
                                }
                                onKeyPress={(event) =>
                                  event.key === "Enter" && sendMessage(event)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>{" "}
                    </>
                  )}
                </div>
              )}
            </>
          )}
          <Hand
            title={`Player2's Hand (${player2Score})`}
            cards={player2Deck}
          />
          <Hand
            title={`Player1's Hand (${player1Score})`}
            cards={player1Deck}
          />
        </>
      ) : (
        <h1>Room full</h1>
      )}

      <br />
      <a href="/">
        <button className="game-button red">QUIT</button>
        <button className="game-button red" onClick={() => resetGame()}>
          QUIT
        </button>
      </a>
    </div>
  );
};

export default GamePage;
