let playerName = "";
document.querySelector('.start').addEventListener('click', () => {
  const input = document.getElementById("username");
  if (!input.value.trim()) {
    alert("Please enter your name!");
    return;
  }
  playerName = input.value.trim();

  document.querySelector('.container').innerHTML = `
    <div class="score"></div>
    <div class="highScore"></div>
    <div class="lives"></div>
    <canvas id="gameCanvas" width="800" height="700"></canvas>
    <div class="controls">
      <button class="moveLeft">←</button>
      <button class="moveRight">→</button>
      <button class="shoot">⎋</button>
    </div>
  `;
  game();
  bgMusic.play();
  setTimeout(()=>{
    console.log("after 2 second")
  }, 2000);
});


const bgMusic = document.getElementById('bgMusic');
bgMusic.volume = 1;

let canShoot = true;
let shootCooldown = 90; // milliseconds


function game() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let score = 0;
  let lives = 5;

  const savedData = JSON.parse(localStorage.getItem("highScoreData")) || { score: 0, name: "None" };
  let highScore = savedData.score;
  let highScoreName = savedData.name;

  let planeX = canvas.width / 2;
  const planeY = canvas.height - 50;
  const planeSize = 30;
  const bullets = [];
  const obstacles = [];

  let moveLeft = false, moveRight = false, shooting = false;
  let obstacleSpeed = 2;
  let spawnInterval = 2000;

  function showHUD() {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
    document.querySelector(".highScore").innerHTML = `High Score: ${highScore} (${highScoreName})`;
    document.querySelector(".lives").innerHTML = `Lives: ${lives}`;
  }

  function shootBullet() {
    if (!canShoot) return;
    bullets.push({ x: planeX + planeSize / 2 - 2.5, y: planeY });
    canShoot = false;
    setTimeout(() => canShoot = true, shootCooldown);
  }


  function spawnObstacle() {
    const x = Math.random() * (canvas.width - 30) + 15;
    const y = 0;
    const shape = ["circle", "square", "triangle"][Math.floor(Math.random() * 3)];
    const color = `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`;
    obstacles.push({ x, y, shape, color });
  }

  function drawObstacles() {
    obstacles.forEach(obs => {
      ctx.fillStyle = obs.color;
      switch (obs.shape) {
        case "circle":
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, 15, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "square":
          ctx.fillRect(obs.x - 15, obs.y - 15, 30, 30);
          break;
        case "triangle":
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y - 15);
          ctx.lineTo(obs.x - 15, obs.y + 15);
          ctx.lineTo(obs.x + 15, obs.y + 15);
          ctx.closePath();
          ctx.fill();
          break;
      }
    });
  }

  function updateObstacles() {
    for (let obs of obstacles) obs.y += obstacleSpeed;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].y > canvas.height) {
        obstacles.splice(i, 1);
      }
    }
  }

  function updateBullets() {
    for (let bullet of bullets) bullet.y -= 10;
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].y < 0) bullets.splice(i, 1);
    }
  }

  function drawBullets() {
    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 5, 10));
  }

  function drawPlane() {
    ctx.beginPath();
    ctx.moveTo(planeX, planeY);
    ctx.lineTo(planeX + planeSize, planeY);
    ctx.lineTo(planeX + planeSize / 2, planeY - planeSize);
    ctx.closePath();
    ctx.fillStyle = "red";
    ctx.fill();
  }

  function checkCollisions() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (
          b.x >= o.x - 15 && b.x <= o.x + 15 &&
          b.y >= o.y - 15 && b.y <= o.y + 15
        ) {
          obstacles.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          if (score % 5 === 0) {
            obstacleSpeed += 0.5;
            spawnInterval = Math.max(500, spawnInterval - 100);
          }
          if (score > highScore) {
            highScore = score;
            highScoreName = playerName;
            localStorage.setItem("highScoreData", JSON.stringify({ score: highScore, name: playerName }));
          }
          showHUD();
          return;
        }
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (
        o.y + 15 >= planeY - planeSize &&
        o.x >= planeX && o.x <= planeX + planeSize
      ) {
        obstacles.splice(i, 1);
        lives--;
        showHUD();
        if (lives === 0) {
          bgMusic.pause();
          alert(`Game Over, ${playerName}! Your Score: ${score}`);
          location.reload();
        }
      }
    }
  }

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (moveLeft && planeX > 0) planeX -= 5;
    if (moveRight && planeX < canvas.width - planeSize) planeX += 5;
    if (shooting) shootBullet();

    updateBullets();
    updateObstacles();
    checkCollisions();

    drawPlane();
    drawBullets();
    drawObstacles();

    requestAnimationFrame(gameLoop);
  }

  setInterval(spawnObstacle, spawnInterval);
  document.querySelector(".moveLeft").onmousedown = () => moveLeft = true;
  document.querySelector(".moveLeft").onmouseup = () => moveLeft = false;
  document.querySelector(".moveRight").onmousedown = () => moveRight = true;
  document.querySelector(".moveRight").onmouseup = () => moveRight = false;
  document.querySelector(".shoot").onmousedown = () => shooting = true;
  document.querySelector(".shoot").onmouseup = () => shooting = false;

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") moveLeft = true;
    if (e.key === "ArrowRight") moveRight = true;
    if (e.code === "Space") shooting = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") moveLeft = false;
    if (e.key === "ArrowRight") moveRight = false;
    if (e.code === "Space") shooting = false;
  });

  showHUD();
  gameLoop();
}
