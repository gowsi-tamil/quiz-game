const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server); // Pass the server instance to Socket.IO
//const Player = require("./database.js");
const mongoose = require("mongoose");
require("dotenv").config();


var bodyParser = require("body-parser");

mongoose.connect("mongodb+srv://gowsi:ncXEU2J3puENS6Bl@cluster0.plrul.mongodb.net/gameDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PlayerSchema = new mongoose.Schema({
  playername: String,
  score: String,
  player_id: String,
  room: String,
});

const Player = mongoose.model("player", PlayerSchema);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const rooms = {};
app.get("/", (req, res) => {
  res.render("index", { rooms: rooms });
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect("/");
  }
  console.log("logggg", req.body.room);
  rooms[req.body.room] = { users: {} };
  res.redirect(req.body.room);
  io.emit("room-created", req.body.room);
});

app.get("/:room", (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect("/");
  }
  res.render("room", { roomName: req.params.room });
});

server.listen(5500, (req, res) => {
  console.log("running on port 5500");
});

io.on("connection", (socket) => {
  socket.on("new-user", (room, name) => {
    console.log("new-user-serverside", room, name);
    socket.join(room);
    rooms[room].users[socket.id] = name;
    console.log("users", rooms[room].users);


    const playerScores = {};
  
    socket.on("update-score", (roomName, playerName, score) => {
      playerScores[playerName] = score;

      io.in(roomName).emit("player-scores", playerScores);

      if (Object.keys(playerScores).length === 2) {
        const players = Object.keys(playerScores);
        const player1 = players[0];
        const player2 = players[1];

        const winner = playerScores[player1] > playerScores[player2] ? player1 : player2;

        io.in(roomName).emit("quiz-end", { winner, score: playerScores[winner] });
      }
    });




    //-----------





    const player = new Player({
      playername: name,
      room: room,
    });
    player.save().then((data) => {
      console.log("Its done");
    });

    var userPerRoom = Object.keys(rooms[room].users).length;
    console.log("user per room", userPerRoom);

    if (userPerRoom === 2) {
      io.in(room).emit("quiz-start", room);
    }



    
    if (userPerRoom <= 2) {
      socket.to(room).broadcast.emit("user-connected", name);
      console.log("server-side", name);
    }
    if (userPerRoom > 2) {
      console.log(userPerRoom);
      socket.emit("user-full", "User-full");
    }
  });

  sendResult = (score, roomName, name) => {
    socket.to(roomName).broadcast.emit("chat-message", {
      message: score,
      name: name,
    });
  };

  socket.on("send-chat-message", (room, message) => {
    socket.to(room).broadcast.emit("chat-message", {
      message: message,
      name: rooms[room].users[socket.id],
    });


  });


  deleteRooms = () => {
    socket.on("disconnect", () => {
      console.log("disconnect-channel");
      getUserRooms(socket).forEach((room) => {
        socket
          .to(room)
          .broadcast.emit("user-disconnected", rooms[room].users[socket.id]);
        delete rooms[room]

      });
    });
  };
});

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name);
    return names;
  }, []);
}

//------







app.get("/game/end", (req, res) => {
  console.log("end page");
  res.render("end", { name: "playername" });
});





var playerNAME = "";
var score = 0;
app.post("/game/end", (req, res) => {
  console.log("end game post", req.body);
  const roomName = req.body.roomName;
  const name = req.body.name;
  score = req.body.score;
  playerNAME = name;

  const update = {
    playername: name,
    room: roomName,
    score: score,
  };

  const query = {
    room: req.body.roomName,
    playername: req.body.name,
  };
  Player.updateOne(
    query,
    { playername: name, room: roomName, score: score },
    function (err, data) {
      if (err) {
        console.log(err);
        res.jsonp("False");
      } else {
        console.log("updated sucessfully", data);
        sendResult(score, roomName, name);

         deleteRooms();
         console.log("rooms")

console.log(rooms)
        res.jsonp("True");
      }
    }
  );

});


app.get("/game/board", (req, res) => {
  console.log("/game/board", playerNAME, score);
  res.render("end", { playername: playerNAME, Score: score });
});



