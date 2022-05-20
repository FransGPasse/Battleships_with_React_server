//Båda dessa är bara tomma <div:ar> inuti en container i HTML
const userGrid = document.querySelector(".user-grid");
const computerGrid = document.querySelector(".computer-grid");

let width = 10;

const userSquares = [];
const computerSquares = [];

//Skapar två bräden
function createBoard(grid, squares) {
  for (let i = 0; i < width * width; i++) {
    const square = document.createElement("div");
    square.dataset.id = i;
    grid.appendChild(square);
    squares.push(square);
  }
}

createBoard(userGrid, userSquares);
createBoard(computerGrid, computerSquares);
