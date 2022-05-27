//Debug
const debug = require("debug")("battleships:socket_controller");

//Socket.io server instance
let io = null;

//Sätter rummet och waitingRoom till två tomma arrayer
let room = [];
let readyRoom = [];
let waitingRoom = [];

// randomize player
const randomNumber = () => {
  return Math.floor(Math.random() * 2);
};

const getRoomById = () => {
  return room.find((room) => room === room);
};

const getRoomByUserId = (id) => {
  return room.find((room) => room.hasOwnProperty(id));
};

//Lyssnar på "user_connected" och pushar in användaren i waitingRoom. När det finns två användare pushas de sedan in i rummet.
const handleUserJoined = async (socketID) => {
  //Pushar in den nya användaren i waitingRoom
  waitingRoom.push(socketID);

  //Om det finns två användare i waitingRoom pushas de in i rummet
  if (waitingRoom.length === 2) {
    room.push(waitingRoom[0], waitingRoom[1]);

    //Sätter variabeln gameRoom till rummet innehållande de två spelarna
    const gameRoom = room;

    //Tar bort användarna från waitingRoom
    waitingRoom.splice(0, 2);

    //Skickar "start_game" till rummet
    io.to(gameRoom).emit("start_game");

    //Console.loggar spelarna
    debug("Starting game 🟢 The players in the gameroom are:", gameRoom);
  } else {
    //Emittar "waiting" till waitingRoom fram tills att det är två spelare i rummet
    io.to(waitingRoom).emit("waiting");

    //Console.loggar waiting
    debug("Waiting for game to start... 🔴");
  }
};

const handleDisconnect = async () => {
  // let everyone in the room know that this user has disconnected
  io.to(room).emit("user_disconnected");

  room = [];

  debug(`The other user disconnected from the room 😓`);
};

const handleClickedOnBox = (click) => {
  debug(`User clicked on box ${click}`);
};

const handlePlayerReady = (socketID) => {
  readyRoom.push(socketID);
  if (readyRoom.length === 2) {
    const randomIndex = randomNumber();
    debug(readyRoom[randomIndex]);
    io.to(readyRoom[randomIndex]).emit("your_turn");
  }
};

//Export controller and attach handlers to events
module.exports = function (socket, _io) {
  // save a reference to the socket.io server instance
  io = _io;

  //When the user connects, send this through debug in the terminal
  socket.on("user_connected", handleUserJoined);

  // handle user disconnect
  socket.on("disconnect", handleDisconnect);

  // handle clicked on box
  socket.on("clicked_box", handleClickedOnBox);

  // handle player ready
  socket.on("player_ready", handlePlayerReady);
};
