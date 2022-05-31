//Debug
const debug = require("debug")("battleships:socket_controller");

//Socket.io server instance
let io = null;

//Sätter alla rum till arrayer
let room = [];
const waitingRoom = [];
let readyRoom = [];

/* // Randomizes player
const randomNumber = () => {
  return Math.floor(Math.random() * 2);
};
 */

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
  //Säger till den andra användaren att motspelaren lämnat
  io.to(room).emit("user_disconnected");

  //Tömmer rummen
  room = [];
  readyRoom = [];

  debug(`The other user disconnected from the room 😓`);
};

//Funktion som bara shufflar arrayn som man ger den med hjälp av Fisher-Yates/Knuth-shuffle...
const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

//Lyssnar efter player_ready och tar emot id:t på personerna som är redo
const handlePlayerReady = (socketID) => {
  //Pushar in dem i ett tomt rum
  readyRoom.push(socketID);

  //När båda är redo så...
  if (readyRoom.length === 2) {
    //Shufflar man arrayen med de båda spelarna och...
    let shuffledArray = shuffleArray(readyRoom);

    debug("The first round goes to the user with the ID: ", readyRoom[0], "😎");

    //Skickar ut till respektive vem som ska börja och vem som får vänta
    io.to(shuffledArray[0]).emit("you_start");
    io.to(shuffledArray[1]).emit("not_your_turn");

    //Tar bort användarna från readyRoom
    readyRoom.splice(0, 2);
  }
};

/* const handlePlayerReady = (socketID) => {
  readyRoom.push(socketID);
  if (readyRoom.length === 2) {
    const randomIndex = randomNumber();
    debug(
      "The first round goes to the user with the ID: ",
      readyRoom[randomIndex],
      "1️⃣"
    );
    io.to(readyRoom[randomIndex]).emit("your_turn");
    readyRoom = [];
  }
}; */

const handleClickedOnBox = (click) => {
  debug(`User clicked on box ${click}`);
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
