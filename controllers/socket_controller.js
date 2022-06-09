//Debug
const debug = require("debug")("battleships:socket_controller");

//Socket.io server instance
let io = null;

//Sätter alla rum till arrayer
let room = [];
let waitingRoom = [];
let readyRoom = [];

//Lyssnar på "user_connected" och pushar in användaren i waitingRoom. När det finns två användare pushas de sedan in i rummet.
const handleUserJoined = async (socketID) => {
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
  waitingRoom = [];
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

    debug(
      "The first round goes to the user with the ID: ",
      shuffledArray[0],
      "😎"
    );

    //Skickar ut till respektive vem som ska börja och vem som får vänta
    io.to(shuffledArray[0]).emit("you_start");
    io.to(shuffledArray[1]).emit("not_your_start");

    //Tar bort användarna från readyRoom
    readyRoom.splice(0, 2);
  }
};

//Lyssnar efter klick på "opponentGameBoard" och hantera
const handleClickedOnBox = function (clickedBoxID, socketID) {
  //Slicear av "opp" från den klickade lådans ID och...
  let slicedBoxID = clickedBoxID.slice(4, clickedBoxID.length);

  //Skickar ut i konsolen
  debug(`User clicked on ${slicedBoxID}`);

  //Hittar därefter motståndaren och...
  const opponent = room.find((user) => user !== socketID);

  //Emittar en koll om det var träff eller inte till motståndaren
  io.to(opponent).emit("hit_or_miss", slicedBoxID, socketID);
  io.to(opponent).emit("your_turn_to_shoot");
  io.to(socketID).emit("not_your_turn_to_shoot");
};

//Lyssnar efter "ship_response" och tar emot ett Boolskt-värde om det var träff eller ej
const handleShipResponse = function (clickedBox, hitShip, socketID) {
  let concatBoxID = "opp-" + clickedBox;

  io.to(socketID).emit("server_ship_response", concatBoxID, hitShip);
};

// Listen for "ship_change" and emit the change to the opponent
const handleShipChange = function (shipsLeft, socketID) {
  // find your opponent
  const opponent = room.find((user) => user !== socketID);

  // send amount of ships to opponent
  io.to(opponent).emit("ship_change", shipsLeft);
};

// Listen for player loss
const handlePlayerLoss = function (socketID) {
  // find your opponent
  const opponent = room.find((user) => user !== socketID);

  // send amount of ships to opponent
  io.to(opponent).emit("you_win");
  io.to(socketID).emit("you_lose");
};

//Export controller and attach handlers to events
module.exports = function (socket, _io) {
  // save a reference to the socket.io server instance
  io = _io;

  //Hanterar att en användare ansluter
  socket.on("user_connected", handleUserJoined);

  //Hanterar när en användare stänger ner fönstret
  socket.on("disconnect", handleDisconnect);

  //Hanterar spelare redo
  socket.on("player_ready", handlePlayerReady);

  //Hanterar när en låda klickas på
  socket.on("clicked_box", handleClickedOnBox);

  //Hanterar träffar och missar
  socket.on("ship_response", handleShipResponse);

  //Hanterar förändringar i motståndarens skepp
  socket.on("ship_change", handleShipChange);

  //Hanterar om någon får slut på skepp
  socket.on("you_lose", handlePlayerLoss);
};
