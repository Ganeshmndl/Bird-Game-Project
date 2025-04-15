const bird = document.getElementById("bird");
const gameContainer = document.querySelector(".game-container");
const pipesContainer = document.querySelector(".pipes-container");
const scoreElement = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreElement = document.getElementById("final-score");
const jumpBtn = document.getElementById("jump-btn");
const fallBtn = document.getElementById("fall-btn");
const hackBtn = document.getElementById("hack-btn");

let birdTop = 200;
let gravity = 1.5;
let score = 0;
let gameInterval;
let pipeInterval;
let pipeSpeed = 3; // Increased pipe speed
let hackMode = false; // Track hack mode state

// List of colors for pipes
const pipeColors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#A133FF",
  "#33FFF5",
];

// Move the bird
function moveBird() {
  birdTop += gravity;
  bird.style.top = birdTop + "px";

  // Prevent the bird from flying outside the container
  if (birdTop < 0) {
    birdTop = 0;
  } else if (birdTop >= gameContainer.clientHeight - bird.clientHeight) {
    birdTop = gameContainer.clientHeight - bird.clientHeight;
  }

  // Check for collisions with pipes (only if hack mode is off)
  if (!hackMode && checkCollision()) {
    endGame();
  }

  // Check for collisions with fruits
  checkFruitCollision();
}

// Make the bird jump
function jump() {
  birdTop -= 40;
  bird.classList.add("rotate-up");
  setTimeout(() => {
    bird.classList.remove("rotate-up");
  }, 200);
}

// Make the bird fall faster
function fallFaster() {
  birdTop += 20;
}

// Generate pipes
function generatePipes() {
  const pipeGap = 150; // Reduced gap between pipes
  const pipeWidth = 80; // Increased pipe width
  const pipeHeight = Math.floor(
    Math.random() * (gameContainer.clientHeight - pipeGap)
  );

  // Randomly select a color for this pair of pipes
  const pipeColor = pipeColors[Math.floor(Math.random() * pipeColors.length)];

  const topPipe = document.createElement("div");
  topPipe.classList.add("pipe");
  topPipe.style.height = pipeHeight + "px";
  topPipe.style.left = gameContainer.clientWidth + "px";
  topPipe.style.backgroundColor = pipeColor;

  const bottomPipe = document.createElement("div");
  bottomPipe.classList.add("pipe");
  bottomPipe.style.height =
    gameContainer.clientHeight - pipeHeight - pipeGap + "px";
  bottomPipe.style.left = gameContainer.clientWidth + "px";
  bottomPipe.style.top = pipeHeight + pipeGap + "px";
  bottomPipe.style.backgroundColor = pipeColor;

  pipesContainer.appendChild(topPipe);
  pipesContainer.appendChild(bottomPipe);

  // Generate fruits between pipes (50% chance)
  if (Math.random() < 0.5) {
    generateFruit(pipeHeight, pipeGap, pipeWidth);
  }

  // Track whether the bird has passed this pair of pipes
  let scored = false;

  // Move pipes
  let pipePosition = gameContainer.clientWidth;
  const pipeMoveInterval = setInterval(() => {
    pipePosition -= pipeSpeed;
    topPipe.style.left = pipePosition + "px";
    bottomPipe.style.left = pipePosition + "px";

    // Remove pipes when they go off-screen
    if (pipePosition < -pipeWidth) {
      clearInterval(pipeMoveInterval);
      pipesContainer.removeChild(topPipe);
      pipesContainer.removeChild(bottomPipe);
    }

    // Check if the bird has passed the pipes
    if (!scored && pipePosition + pipeWidth < bird.offsetLeft) {
      score++;
      scoreElement.textContent = "Score: " + score;
      scored = true;

      // Increase pipe speed based on score
      if (score % 5 === 0) {
        pipeSpeed += 0.5;
      }
    }
  }, 20);
}

// Generate fruits
function generateFruit(pipeHeight, pipeGap, pipeWidth) {
  const fruitTypes = ["small", "large"];
  const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

  const fruit = document.createElement("div");
  fruit.classList.add("fruit", fruitType);
  fruit.style.left = gameContainer.clientWidth + pipeWidth / 2 + "px";
  fruit.style.top = pipeHeight + pipeGap / 2 + "px";

  pipesContainer.appendChild(fruit);

  // Move fruit
  let fruitPosition = gameContainer.clientWidth + pipeWidth / 2;
  const fruitMoveInterval = setInterval(() => {
    fruitPosition -= pipeSpeed;
    fruit.style.left = fruitPosition + "px";

    // Remove fruit when it goes off-screen
    if (fruitPosition < -50) {
      clearInterval(fruitMoveInterval);
      pipesContainer.removeChild(fruit);
    }
  }, 20);
}

// Check for collisions with fruits
function checkFruitCollision() {
  const fruits = document.querySelectorAll(".fruit");
  for (let fruit of fruits) {
    const fruitRect = fruit.getBoundingClientRect();
    const birdRect = bird.getBoundingClientRect();

    if (
      birdRect.left < fruitRect.right &&
      birdRect.right > fruitRect.left &&
      birdRect.top < fruitRect.bottom &&
      birdRect.bottom > fruitRect.top
    ) {
      // Add points based on fruit type
      if (fruit.classList.contains("small")) {
        score += 5;
      } else if (fruit.classList.contains("large")) {
        score += 10;
      }
      scoreElement.textContent = "Score: " + score;
      pipesContainer.removeChild(fruit); // Remove the fruit after collision
    }
  }
}

// Check for collisions with pipes
function checkCollision() {
  const pipes = document.querySelectorAll(".pipe");
  for (let pipe of pipes) {
    const pipeRect = pipe.getBoundingClientRect();
    const birdRect = bird.getBoundingClientRect();

    if (
      birdRect.left < pipeRect.right &&
      birdRect.right > pipeRect.left &&
      birdRect.top < pipeRect.bottom &&
      birdRect.bottom > pipeRect.top
    ) {
      return true;
    }
  }
  return false;
}

// End the game
function endGame() {
  clearInterval(gameInterval);
  clearInterval(pipeInterval);
  finalScoreElement.textContent = score;
  gameOverScreen.style.display = "block";
}

// Start the game
function startGame() {
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  score = 0;
  pipeSpeed = 3;
  birdTop = 200;
  bird.style.top = birdTop + "px";
  pipesContainer.innerHTML = "";
  scoreElement.textContent = "Score: 0";
  gameInterval = setInterval(moveBird, 20);
  pipeInterval = setInterval(generatePipes, 2000);
}

// Event listener for starting the game (keyboard)
document.addEventListener("keydown", (e) => {
  if (startScreen.style.display !== "none") {
    startGame(); // Start the game when any key is pressed
  }
});

// Event listener for starting the game (mobile buttons)
jumpBtn.addEventListener("click", () => {
  if (startScreen.style.display !== "none") {
    startGame(); // Start the game when the Jump button is clicked
  }
  jump(); // Make the bird jump
});

fallBtn.addEventListener("click", () => {
  if (startScreen.style.display !== "none") {
    startGame(); // Start the game when the Fall Faster button is clicked
  }
  fallFaster(); // Make the bird fall faster
});

// Event listener for jumping and falling (keyboard)
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp") {
    jump();
  } else if (e.code === "ArrowDown") {
    fallFaster();
  }
});

// Event listener for hack button
hackBtn.addEventListener("click", () => {
  hackMode = !hackMode; // Toggle hack mode
  hackBtn.classList.toggle("active", hackMode); // Add/remove active class
});

// Show the start screen when the page loads
startScreen.style.display = "block";
