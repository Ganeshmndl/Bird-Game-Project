// Game Elements
const bird = document.getElementById("bird");
const gameContainer = document.querySelector(".game-container");
const pipesContainer = document.querySelector(".pipes-container");
const particlesContainer = document.querySelector(".particles-container");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreElement = document.getElementById("final-score");
const finalHighScoreElement = document.getElementById("final-high-score");
const jumpBtn = document.getElementById("jump-btn");
const fallBtn = document.getElementById("fall-btn");
const hackBtn = document.getElementById("hack-btn");
const restartBtn = document.getElementById("restart-btn");

// Audio Elements
const sounds = {
  jump: document.getElementById("jump-sound"),
  score: document.getElementById("score-sound"),
  gameover: document.getElementById("gameover-sound"),
};

// Game State
const gameState = {
  isRunning: false,
  score: 0,
  highScore: localStorage.getItem("flappyHighScore") || 0,
  difficulty: 1,
  gravity: 1.5,
  hackMode: false,
  powerUps: {
    doublePoints: false,
    slowMotion: false,
  },
  reset() {
    this.score = 0;
    this.difficulty = 1;
    this.gravity = 1.5;
    this.powerUps.doublePoints = false;
    this.powerUps.slowMotion = false;
  },
  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("flappyHighScore", this.highScore);
    }
  },
};

// Game Variables
let birdTop = 200;
let pipeSpeed = 3;
let pipes = [];
let fruits = [];
let animationFrameId;
let pipeInterval;

// Initialize Game
function init() {
  updateHighScoreDisplay();
  setupEventListeners();
  startScreen.style.display = "block";
}

// Event Listeners
function setupEventListeners() {
  // Keyboard Controls
  document.addEventListener("keydown", handleKeyDown);

  // Mobile Controls handler
  const createMobileHandler = (action) => (e) => {
    if (e.cancelable) e.preventDefault();
    if (!gameState.isRunning) {
      startGame();
    } else {
      action();
    }
  };

  // Jump button
  jumpBtn.addEventListener("click", createMobileHandler(jump));
  jumpBtn.addEventListener("touchstart", createMobileHandler(jump));

  // Fall button
  fallBtn.addEventListener("click", createMobileHandler(fallFaster));
  fallBtn.addEventListener("touchstart", createMobileHandler(fallFaster));

  // Game Controls
  hackBtn.addEventListener("click", toggleHackMode);
  restartBtn.addEventListener("click", startGame);

  // Start Game (Desktop - any key)
  document.addEventListener("keydown", (e) => {
    if (!gameState.isRunning) {
      startGame();
    }
  });
}

function handleKeyDown(e) {
  if (e.code === "Space" || e.key === " ") {
    jump();
  } else if (e.code === "ArrowDown") {
    fallFaster();
  } else if (e.code === "KeyH") {
    toggleHackMode();
  }
}

// Game Loop
function gameLoop() {
  if (!gameState.isRunning) return;

  moveBird();
  checkCollisions();
  updateScoreDisplay();

  animationFrameId = requestAnimationFrame(gameLoop);
}

// Bird Movement
function moveBird() {
  birdTop += gameState.gravity;
  bird.style.top = birdTop + "px";

  // Boundary checking
  if (birdTop < 0) {
    birdTop = 0;
  } else if (birdTop >= gameContainer.clientHeight - bird.clientHeight) {
    if (!gameState.hackMode) {
      endGame();
    } else {
      birdTop = gameContainer.clientHeight - bird.clientHeight;
    }
  }
}

function jump() {
  if (!gameState.isRunning) return;

  birdTop -= 40;
  bird.classList.add("rotate-up");
  playSound("jump");

  // Create jump particles
  createParticles(
    bird.offsetLeft + bird.clientWidth / 2,
    bird.offsetTop + bird.clientHeight,
    "#FFD700"
  );

  setTimeout(() => {
    bird.classList.remove("rotate-up");
  }, 200);
}

function fallFaster() {
  if (!gameState.isRunning) return;
  birdTop += 20;
}

// Pipe System
function generatePipes() {
  const pipeGap = 150 - gameState.difficulty * 5;
  const pipeWidth = 80;
  const pipeHeight =
    Math.floor(Math.random() * (gameContainer.clientHeight - pipeGap - 100)) +
    50;

  // Create top pipe
  const topPipe = createPipeElement(pipeHeight, pipeWidth, "top");

  // Create bottom pipe
  const bottomPipe = createPipeElement(
    gameContainer.clientHeight - pipeHeight - pipeGap,
    pipeWidth,
    "bottom",
    pipeHeight + pipeGap
  );

  pipes.push(topPipe, bottomPipe);
  pipesContainer.appendChild(topPipe);
  pipesContainer.appendChild(bottomPipe);

  // Generate fruit (40% chance)
  if (Math.random() < 0.4) {
    generateFruit(pipeHeight, pipeGap, pipeWidth);
  }

  // Move pipes
  let pipePosition = gameContainer.clientWidth;
  let scored = false;

  const moveInterval = setInterval(() => {
    if (!gameState.isRunning) {
      clearInterval(moveInterval);
      return;
    }

    const speed = gameState.powerUps.slowMotion ? pipeSpeed * 0.7 : pipeSpeed;
    pipePosition -= speed;

    topPipe.style.left = pipePosition + "px";
    bottomPipe.style.left = pipePosition + "px";

    // Remove off-screen pipes
    if (pipePosition < -pipeWidth) {
      clearInterval(moveInterval);
      removePipe(topPipe);
      removePipe(bottomPipe);
    }

    // Score point when passing pipes
    if (!scored && pipePosition + pipeWidth < bird.offsetLeft) {
      scored = true;
      addScore(1);

      // Increase difficulty every 5 points
      if (gameState.score % 5 === 0) {
        increaseDifficulty();
      }
    }
  }, 20);
}

function createPipeElement(height, width, position, top = 0) {
  const pipe = document.createElement("div");
  pipe.className = `pipe pipe-${position}`;
  pipe.style.height = `${height}px`;
  pipe.style.width = `${width}px`;
  pipe.style.left = `${gameContainer.clientWidth}px`;
  pipe.style.top = `${top}px`;
  return pipe;
}

function removePipe(pipe) {
  pipes = pipes.filter((p) => p !== pipe);
  if (pipe.parentNode) {
    pipesContainer.removeChild(pipe);
  }
}

// Fruit System
function generateFruit(pipeHeight, pipeGap, pipeWidth) {
  const fruitTypes = ["small", "large"];
  const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

  const fruit = document.createElement("div");
  fruit.className = `fruit ${fruitType}`;
  fruit.style.left = `${gameContainer.clientWidth + pipeWidth / 2}px`;
  fruit.style.top = `${pipeHeight + pipeGap / 2}px`;

  fruits.push(fruit);
  pipesContainer.appendChild(fruit);

  // Move fruit
  let fruitPosition = gameContainer.clientWidth + pipeWidth / 2;
  const fruitInterval = setInterval(() => {
    if (!gameState.isRunning) {
      clearInterval(fruitInterval);
      return;
    }

    fruitPosition -= pipeSpeed;
    fruit.style.left = `${fruitPosition}px`;

    // Remove off-screen fruit
    if (fruitPosition < -50) {
      clearInterval(fruitInterval);
      removeFruit(fruit);
    }
  }, 20);
}

function removeFruit(fruit) {
  fruits = fruits.filter((f) => f !== fruit);
  if (fruit.parentNode) {
    pipesContainer.removeChild(fruit);
  }
}

// Collision Detection
function checkCollisions() {
  // Pipe collisions (skip if in hack mode)
  if (!gameState.hackMode) {
    for (const pipe of pipes) {
      if (pipe.parentNode && checkCollision(bird, pipe)) {
        endGame();
        return;
      }
    }
  }

  // Fruit collisions
  for (const fruit of fruits) {
    if (fruit.parentNode && checkCollision(bird, fruit)) {
      collectFruit(fruit);
    }
  }
}

function checkCollision(element1, element2) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
}

function collectFruit(fruit) {
  const points = fruit.classList.contains("large") ? 10 : 5;
  addScore(gameState.powerUps.doublePoints ? points * 2 : points);

  // Visual effects
  createParticles(
    fruit.offsetLeft + fruit.clientWidth / 2,
    fruit.offsetTop + fruit.clientHeight / 2,
    fruit.classList.contains("large") ? "#FF6347" : "#98FB98"
  );

  // Special effects for large fruit
  if (fruit.classList.contains("large")) {
    gameState.powerUps.doublePoints = true;
    bird.style.filter = "brightness(1.5)";
    setTimeout(() => {
      gameState.powerUps.doublePoints = false;
      bird.style.filter = "";
    }, 5000);
  }

  playSound("score");
  removeFruit(fruit);
}

// Score System
function addScore(points) {
  gameState.score += points;
  updateScoreDisplay();
}

function increaseDifficulty() {
  gameState.difficulty++;
  pipeSpeed += 0.25;

  // Cap the maximum difficulty
  if (pipeSpeed > 6) pipeSpeed = 6;
}

// Game Flow
function startGame() {
  // Reset game state
  gameState.reset();
  gameState.isRunning = true;

  // Reset UI
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  birdTop = 200;
  bird.style.top = `${birdTop}px`;
  pipesContainer.innerHTML = "";
  particlesContainer.innerHTML = "";

  // Reset game variables
  pipes = [];
  fruits = [];
  pipeSpeed = 3;

  // Start game systems
  updateScoreDisplay();
  gameLoop();
  pipeInterval = setInterval(generatePipes, 2000);

  // Visual feedback
  bird.style.filter = "";
}

function endGame() {
  gameState.isRunning = false;
  gameState.updateHighScore();

  // Stop game systems
  cancelAnimationFrame(animationFrameId);
  clearInterval(pipeInterval);

  // Update UI
  finalScoreElement.textContent = gameState.score;
  finalHighScoreElement.textContent = gameState.highScore;
  gameOverScreen.style.display = "block";

  // Visual effects
  createParticles(
    bird.offsetLeft + bird.clientWidth / 2,
    bird.offsetTop + bird.clientHeight / 2,
    "#FF0000",
    15
  );

  playSound("gameover");
}

// Hack Mode
function toggleHackMode() {
  gameState.hackMode = !gameState.hackMode;
  hackBtn.classList.toggle("active", gameState.hackMode);

  if (gameState.hackMode) {
    bird.style.border = "2px dashed gold";
    bird.style.boxShadow = "0 0 10px gold";
  } else {
    bird.style.border = "";
    bird.style.boxShadow = "";
  }
}

// Visual Effects
function createParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.backgroundColor = color;

    // Randomize particle movement
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const lifetime = 500 + Math.random() * 500;

    particlesContainer.appendChild(particle);

    // Animate particle
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / lifetime;

      if (progress >= 1) {
        particle.remove();
        return;
      }

      particle.style.transform = `translate(${
        (Math.cos(angle) * speed * elapsed) / 10
      }px, 
                                              ${
                                                (Math.sin(angle) *
                                                  speed *
                                                  elapsed) /
                                                10
                                              }px)`;
      particle.style.opacity = 1 - progress;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

// UI Updates
function updateScoreDisplay() {
  scoreElement.textContent = `Score: ${gameState.score}`;
}

function updateHighScoreDisplay() {
  highScoreElement.textContent = gameState.highScore;
}

// Audio
function playSound(name) {
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch((e) => console.log("Audio play failed:", e));
  }
}

// Initialize the game
init();
