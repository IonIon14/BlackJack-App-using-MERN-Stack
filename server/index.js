const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const server = http.createServer(app);

const { PORT } = require("./data");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");
const path = require("path");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());

//SOCKET STATES

io.on("connection", (socket) => {
  socket.on("join", (payload, callback) => {
    let numberOfUsersInRoom = getUsersInRoom(payload.room).length;
    const { error, newUser } = addUser({
      id: socket.id,
      name: numberOfUsersInRoom === 0 ? "Player 1" : "Player 2",
      room: payload.room,
    });
    if (error) {
      return callback(error);
    }
    socket.join(newUser.room);
    io.to(newUser.room).emit("roomData", {
      room: newUser.room,
      users: getUsersInRoom(newUser.room),
    });
    socket.emit("currentUserData", { name: newUser.name });
    callback();
  });

  socket.on("initGameState", (gameState) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit("initGameState", gameState);
    }
  });

  socket.on("updateGameState", (gameState) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit("updateGameState", gameState);
    }
  });

  socket.on("sendMessage", (payload, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", {
      user: user.name,
      text: payload.message,
    });
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

if (process.env.NODE_ENV === "production") {
  //set static folder
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

server.listen(process.env.PORT || 5000, () => {
  console.log(`listening on *:${PORT}`);
});
