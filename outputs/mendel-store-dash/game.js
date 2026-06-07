(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayKicker = document.getElementById("overlayKicker");
  const overlayCopy = document.getElementById("overlayCopy");
  const playButton = document.getElementById("playButton");
  const playLabel = document.getElementById("playLabel");
  const heartsEl = document.getElementById("hearts");
  const storeMeter = document.getElementById("storeMeter");
  const guardStatus = document.getElementById("guardStatus");
  const movePad = document.getElementById("movePad");
  const moveKnob = document.getElementById("moveKnob");
  const fireButton = document.getElementById("fireButton");
  const dashButton = document.getElementById("dashButton");

  const TAU = Math.PI * 2;
  const state = {
    mode: "title",
    time: 0,
    camera: { x: 0, y: 0 },
    view: { w: 1, h: 1, dpr: 1 },
    world: { w: 1880, h: 900 },
    player: null,
    guard: null,
    projectiles: [],
    particles: [],
    floatingText: [],
    shake: 0,
    lastResult: "title"
  };

  const input = {
    keys: new Set(),
    move: { x: 0, y: 0 },
    touchMove: { x: 0, y: 0 },
    fireHeld: false,
    activePadPointer: null
  };

  function makePlayer() {
    return {
      x: 120,
      y: state.world.h * 0.52,
      vx: 0,
      vy: 0,
      r: 24,
      hp: 3,
      maxHp: 3,
      speed: 310,
      fireCooldown: 0,
      dashCooldown: 0,
      dashTime: 0,
      invulnerable: 0,
      face: 1,
      step: 0
    };
  }

  function makeGuard() {
    return {
      x: state.world.w - 285,
      y: state.world.h * 0.5,
      baseY: state.world.h * 0.5,
      r: 32,
      hp: 6,
      maxHp: 6,
      breakTime: 0,
      shotTimer: 0.65,
      patrol: 0,
      face: -1
    };
  }

  function resetGame() {
    state.mode = "playing";
    state.time = 0;
    state.camera.x = 0;
    state.camera.y = 0;
    state.player = makePlayer();
    state.guard = makeGuard();
    state.projectiles = [];
    state.particles = [];
    state.floatingText = [];
    state.shake = 0;
    state.lastResult = "playing";
    overlay.hidden = true;
    syncHud(true);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(420, window.innerHeight);
    state.view.w = w;
    state.view.h = h;
    state.view.dpr = dpr;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.world.h = Math.max(820, Math.min(980, h * 1.35));
    if (state.player) {
      state.player.y = clamp(state.player.y, 96, state.world.h - 96);
    }
    if (state.guard) {
      state.guard.baseY = state.world.h * 0.5;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function length(x, y) {
    return Math.hypot(x, y);
  }

  function normalize(x, y) {
    const len = length(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function getMoveVector() {
    let x = 0;
    let y = 0;
    if (input.keys.has("ArrowLeft") || input.keys.has("KeyA")) x -= 1;
    if (input.keys.has("ArrowRight") || input.keys.has("KeyD")) x += 1;
    if (input.keys.has("ArrowUp") || input.keys.has("KeyW")) y -= 1;
    if (input.keys.has("ArrowDown") || input.keys.has("KeyS")) y += 1;

    x += input.touchMove.x;
    y += input.touchMove.y;
    if (length(x, y) > 1) {
      const n = normalize(x, y);
      x = n.x;
      y = n.y;
    }
    input.move.x = x;
    input.move.y = y;
    return input.move;
  }

  function fireBanana() {
    if (state.mode !== "playing") return;
    const player = state.player;
    const guard = state.guard;
    if (player.fireCooldown > 0) return;

    let dir = normalize(guard.x - player.x, guard.y - player.y);
    if (length(guard.x - player.x, guard.y - player.y) > 720) {
      dir = normalize(player.face || 1, input.move.y * 0.35);
    }

    player.fireCooldown = 0.23;
    state.projectiles.push({
      kind: "banana",
      x: player.x + dir.x * 30,
      y: player.y + dir.y * 30,
      vx: dir.x * 760,
      vy: dir.y * 760,
      r: 13,
      life: 1.25,
      angle: Math.atan2(dir.y, dir.x)
    });
    burst(player.x + dir.x * 28, player.y + dir.y * 28, "#f7c948", 5, 120);
  }

  function tryDash() {
    if (state.mode !== "playing") return;
    const player = state.player;
    if (player.dashCooldown > 0) return;
    const move = getMoveVector();
    const dir = normalize(move.x || player.face || 1, move.y);
    player.vx = dir.x * 760;
    player.vy = dir.y * 760;
    player.dashTime = 0.13;
    player.dashCooldown = 0.9;
    player.invulnerable = Math.max(player.invulnerable, 0.14);
    state.shake = Math.max(state.shake, 2);
    burst(player.x, player.y, "#83d2ff", 12, 220);
  }

  function update(dt) {
    if (state.mode !== "playing") return;
    state.time += dt;
    updatePlayer(dt);
    updateGuard(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateCamera(dt);
    syncHud(false);
  }

  function updatePlayer(dt) {
    const player = state.player;
    const move = getMoveVector();

    if (move.x !== 0) player.face = Math.sign(move.x);
    if (input.fireHeld || input.keys.has("Space")) fireBanana();
    if (input.keys.has("ShiftLeft") || input.keys.has("ShiftRight")) tryDash();

    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.step += dt * (length(move.x, move.y) > 0 ? 11 : 3);

    if (player.dashTime > 0) {
      player.dashTime -= dt;
      player.vx *= 0.92;
      player.vy *= 0.92;
    } else {
      player.vx = move.x * player.speed;
      player.vy = move.y * player.speed;
    }

    player.x = clamp(player.x + player.vx * dt, 52, state.world.w - 94);
    player.y = clamp(player.y + player.vy * dt, 78, state.world.h - 78);

    const guard = state.guard;
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = length(dx, dy);
    const blocking = guard.breakTime <= 0 && dist < player.r + guard.r;
    if (blocking) {
      const push = normalize(dx, dy);
      player.x += push.x * 14;
      player.y += push.y * 14;
      hurtPlayer(push.x, push.y, 0.4);
    }

    const doorY = state.world.h * 0.5;
    const inDoor = player.x > state.world.w - 138 && Math.abs(player.y - doorY) < 108;
    if (inDoor && guard.breakTime > 0) {
      finish("win");
    }
  }

  function updateGuard(dt) {
    const guard = state.guard;
    const player = state.player;

    guard.breakTime = Math.max(0, guard.breakTime - dt);
    guard.face = player.x < guard.x ? -1 : 1;

    if (guard.breakTime > 0) {
      guard.y += Math.sin(state.time * 15) * 0.22;
      guard.shotTimer = 0.55;
      return;
    }

    guard.patrol += dt;
    const targetY = guard.baseY + Math.sin(guard.patrol * 1.85) * 190;
    guard.y += (targetY - guard.y) * Math.min(1, dt * 4.5);

    guard.shotTimer -= dt;
    if (guard.shotTimer <= 0) {
      guard.shotTimer = clamp(0.84 - state.time * 0.008, 0.52, 0.84);
      const dir = normalize(player.x - guard.x, player.y - guard.y);
      state.projectiles.push({
        kind: "money",
        x: guard.x + dir.x * 34,
        y: guard.y + dir.y * 28,
        vx: dir.x * 420,
        vy: dir.y * 420,
        r: 15,
        life: 2.2,
        angle: Math.atan2(dir.y, dir.x)
      });
      burst(guard.x + dir.x * 30, guard.y + dir.y * 30, "#70c87b", 4, 115);
    }
  }

  function updateProjectiles(dt) {
    const player = state.player;
    const guard = state.guard;

    for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
      const p = state.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.angle += p.kind === "banana" ? dt * 8 : dt * 3;

      let remove = p.life <= 0 || p.x < 0 || p.x > state.world.w || p.y < 0 || p.y > state.world.h;
      if (!remove && p.kind === "banana" && length(p.x - guard.x, p.y - guard.y) < p.r + guard.r) {
        remove = true;
        hitGuard();
      }
      if (!remove && p.kind === "money" && length(p.x - player.x, p.y - player.y) < p.r + player.r) {
        remove = true;
        const push = normalize(player.x - p.x, player.y - p.y);
        hurtPlayer(push.x, push.y, 1);
      }
      if (remove) {
        state.projectiles.splice(i, 1);
      }
    }
  }

  function hitGuard() {
    const guard = state.guard;
    guard.hp -= 1;
    state.shake = Math.max(state.shake, 4);
    burst(guard.x, guard.y, "#f7c948", 18, 260);
    addFloat(guard.x, guard.y - 42, "BANANA");

    if (guard.hp <= 0) {
      guard.hp = guard.maxHp;
      guard.breakTime = 5.2;
      state.projectiles = state.projectiles.filter((p) => p.kind !== "money");
      burst(guard.x, guard.y, "#fff1a8", 34, 360);
      addFloat(guard.x, guard.y - 68, "STUNNED");
    }
  }

  function hurtPlayer(pushX, pushY, amount) {
    const player = state.player;
    if (player.invulnerable > 0) return;
    player.hp = Math.max(0, player.hp - amount);
    player.invulnerable = 0.8;
    player.x = clamp(player.x + pushX * 34, 52, state.world.w - 94);
    player.y = clamp(player.y + pushY * 34, 78, state.world.h - 78);
    state.shake = Math.max(state.shake, 8);
    burst(player.x, player.y, "#e35f5f", 22, 280);
    addFloat(player.x, player.y - 44, "HIT");
    if (player.hp <= 0) {
      finish("lose");
    }
  }

  function finish(result) {
    state.mode = result;
    state.lastResult = result;
    overlay.hidden = false;
    if (result === "win") {
      overlayKicker.textContent = "Store Reached";
      overlayTitle.textContent = "Mendel Made It";
      overlayCopy.textContent = "Kashi is stunned, the door is clear, and the banana run is complete.";
      playLabel.textContent = "Play Again";
    } else {
      overlayKicker.textContent = "Money Storm";
      overlayTitle.textContent = "Kashi Held the Door";
      overlayCopy.textContent = "Mendel ran out of health before reaching the store.";
      playLabel.textContent = "Retry";
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floatingText.length - 1; i >= 0; i -= 1) {
      const f = state.floatingText[i];
      f.y -= dt * 42;
      f.life -= dt;
      if (f.life <= 0) state.floatingText.splice(i, 1);
    }
    state.shake = Math.max(0, state.shake - dt * 18);
  }

  function updateCamera(dt) {
    const targetX = clamp(state.player.x - state.view.w * 0.38, 0, state.world.w - state.view.w);
    const targetY = clamp(state.player.y - state.view.h * 0.53, 0, state.world.h - state.view.h);
    state.camera.x += (targetX - state.camera.x) * Math.min(1, dt * 7);
    state.camera.y += (targetY - state.camera.y) * Math.min(1, dt * 7);
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * TAU;
      const s = Math.random() * speed;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        color,
        life: 0.35 + Math.random() * 0.35,
        size: 3 + Math.random() * 5
      });
    }
  }

  function addFloat(x, y, text) {
    state.floatingText.push({ x, y, text, life: 0.8 });
  }

  function syncHud(force) {
    const player = state.player || { hp: 3, maxHp: 3, x: 0 };
    const guard = state.guard || { breakTime: 0, hp: 6, maxHp: 6 };
    if (force || heartsEl.children.length !== player.maxHp) {
      heartsEl.innerHTML = "";
      for (let i = 0; i < player.maxHp; i += 1) {
        const heart = document.createElement("span");
        heart.className = "heart";
        heartsEl.appendChild(heart);
      }
    }

    Array.from(heartsEl.children).forEach((heart, index) => {
      heart.classList.toggle("heart-empty", index >= player.hp);
    });

    const progress = clamp((player.x - 70) / (state.world.w - 250), 0, 1);
    storeMeter.style.width = `${Math.round(progress * 100)}%`;

    if (guard.breakTime > 0) {
      guardStatus.textContent = `${Math.ceil(guard.breakTime)}s Clear`;
      guardStatus.style.color = "#fff1a8";
    } else {
      guardStatus.textContent = `${guard.hp}/${guard.maxHp}`;
      guardStatus.style.color = "";
    }
  }

  function render() {
    ctx.clearRect(0, 0, state.view.w, state.view.h);

    const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    ctx.save();
    ctx.translate(-state.camera.x + sx, -state.camera.y + sy);
    drawWorld();
    drawProjectiles();
    drawActors();
    drawParticles();
    drawFloatingText();
    ctx.restore();

    if (state.mode === "title") {
      renderAttract();
    }
  }

  function drawWorld() {
    const world = state.world;
    ctx.fillStyle = "#252833";
    ctx.fillRect(0, 0, world.w, world.h);

    ctx.fillStyle = "#1f222b";
    for (let x = 0; x < world.w; x += 90) {
      ctx.fillRect(x, 0, 2, world.h);
    }
    for (let y = 0; y < world.h; y += 90) {
      ctx.fillRect(0, y, world.w, 2);
    }

    ctx.fillStyle = "#343847";
    ctx.fillRect(0, 48, world.w, 58);
    ctx.fillRect(0, world.h - 106, world.w, 58);

    drawLaneLines(world);
    drawCrates();
    drawStore();
  }

  function drawLaneLines(world) {
    ctx.strokeStyle = "rgba(247, 241, 223, 0.42)";
    ctx.lineWidth = 5;
    ctx.setLineDash([36, 34]);
    ctx.beginPath();
    ctx.moveTo(0, world.h * 0.5);
    ctx.lineTo(world.w - 420, world.h * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const startX = world.w - 455;
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(startX + i * 26, world.h * 0.5 - 120, 14, 240);
    }
  }

  function drawCrates() {
    const crates = [
      [260, 180],
      [520, 690],
      [760, 250],
      [1060, 620],
      [1250, 170]
    ];
    crates.forEach(([x, y], index) => {
      ctx.fillStyle = index % 2 ? "#8b5a36" : "#7f6240";
      roundRect(x, y, 66, 44, 7);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.17)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(35,21,10,0.45)";
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 23);
      ctx.lineTo(x + 58, y + 23);
      ctx.moveTo(x + 34, y + 5);
      ctx.lineTo(x + 34, y + 39);
      ctx.stroke();
    });
  }

  function drawStore() {
    const world = state.world;
    const x = world.w - 210;
    const y = world.h * 0.5 - 190;
    const open = state.guard && state.guard.breakTime > 0;

    ctx.fillStyle = open ? "rgba(255, 241, 168, 0.2)" : "rgba(221, 64, 69, 0.13)";
    ctx.fillRect(world.w - 170, world.h * 0.5 - 126, 156, 252);

    ctx.fillStyle = "#efe0b7";
    roundRect(x, y, 196, 380, 8);
    ctx.fill();
    ctx.fillStyle = "#dd4045";
    ctx.fillRect(x - 8, y, 212, 82);

    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = i % 2 ? "#f7f1df" : "#dd4045";
      ctx.fillRect(x - 8 + i * 36, y + 82, 36, 42);
    }

    ctx.fillStyle = "#1e5d56";
    roundRect(x + 38, y + 18, 118, 36, 6);
    ctx.fill();
    ctx.fillStyle = "#fff1a8";
    ctx.font = "800 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("STORE", x + 97, y + 44);

    ctx.fillStyle = open ? "#fff1a8" : "#242733";
    roundRect(x + 52, world.h * 0.5 - 82, 92, 164, 8);
    ctx.fill();
    ctx.fillStyle = open ? "#4b2a12" : "#141720";
    roundRect(x + 67, world.h * 0.5 - 64, 62, 128, 7);
    ctx.fill();

    if (open) {
      ctx.strokeStyle = "rgba(255, 241, 168, 0.7)";
      ctx.lineWidth = 5 + Math.sin(state.time * 8) * 1.5;
      roundRect(x + 47, world.h * 0.5 - 87, 102, 174, 10);
      ctx.stroke();
    }
  }

  function drawActors() {
    drawMendel(state.player);
    drawKashi(state.guard);
  }

  function drawMendel(player) {
    if (!player) return;
    const flicker = player.invulnerable > 0 && Math.floor(state.time * 18) % 2 === 0;
    if (flicker) return;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.face, 1);
    const bob = Math.sin(player.step) * 3;

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 28, 10, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#e95b47";
    roundRect(-20, -14 + bob, 40, 46, 13);
    ctx.fill();
    ctx.fillStyle = "#f2c49a";
    ctx.beginPath();
    ctx.arc(0, -30 + bob, 19, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#2b303d";
    ctx.fillRect(-18, -46 + bob, 36, 10);
    ctx.fillStyle = "#3b4150";
    ctx.beginPath();
    ctx.arc(-2, -46 + bob, 16, Math.PI, TAU);
    ctx.fill();

    ctx.fillStyle = "#161923";
    ctx.beginPath();
    ctx.arc(7, -32 + bob, 3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#161923";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2, -25 + bob, 7, 0.1, 1.1);
    ctx.stroke();

    ctx.strokeStyle = "#f2c49a";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(16, -4 + bob);
    ctx.lineTo(33, -11 + bob);
    ctx.stroke();

    ctx.strokeStyle = "#253048";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-10, 30 + bob);
    ctx.lineTo(-17, 45 + bob);
    ctx.moveTo(10, 30 + bob);
    ctx.lineTo(17, 45 + bob);
    ctx.stroke();
    ctx.restore();
  }

  function drawKashi(guard) {
    if (!guard) return;
    ctx.save();
    ctx.translate(guard.x, guard.y);
    const stunned = guard.breakTime > 0;
    const tilt = stunned ? Math.sin(state.time * 12) * 0.18 : 0;
    ctx.rotate(tilt);

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 35, 36, 12, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = stunned ? "#6f7890" : "#4d7bdc";
    roundRect(-25, -12, 50, 58, 12);
    ctx.fill();
    ctx.fillStyle = "#f0b98c";
    ctx.beginPath();
    ctx.arc(0, -34, 21, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#24365f";
    ctx.fillRect(-24, -56, 48, 12);
    ctx.fillStyle = stunned ? "#f7c948" : "#24365f";
    ctx.beginPath();
    ctx.arc(0, -56, 20, Math.PI, TAU);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(-7, -35, 3, 0, TAU);
    ctx.arc(9, -35, 3, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1, -25, 8, stunned ? 0.2 : 3.4, stunned ? 1.15 : 5.35);
    ctx.stroke();

    ctx.fillStyle = "#70c87b";
    roundRect(-47, -3, 23, 36, 5);
    ctx.fill();
    ctx.fillStyle = "#24784d";
    ctx.font = "700 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("$", -35, 21);

    if (stunned) {
      drawStar(-33, -70, 8, "#fff1a8");
      drawStar(0, -82, 10, "#f7c948");
      drawStar(32, -70, 8, "#fff1a8");
    } else {
      const pct = guard.hp / guard.maxHp;
      ctx.setTransform(ctx.getTransform());
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(-30, -78, 60, 8, 4);
      ctx.fill();
      ctx.fillStyle = "#f7c948";
      roundRect(-30, -78, 60 * pct, 8, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawProjectiles() {
    state.projectiles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      if (p.kind === "banana") {
        ctx.strokeStyle = "#6f4f18";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, -2, 18, 0.3, 2.7);
        ctx.stroke();
        ctx.strokeStyle = "#fff1a8";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, -5, 16, 0.34, 2.55);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#70c87b";
        roundRect(-16, -10, 32, 20, 4);
        ctx.fill();
        ctx.strokeStyle = "#24784d";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#155f3a";
        ctx.font = "800 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 1);
      }
      ctx.restore();
    });
  }

  function drawParticles() {
    state.particles.forEach((p) => {
      ctx.globalAlpha = clamp(p.life * 2.5, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawFloatingText() {
    state.floatingText.forEach((f) => {
      ctx.globalAlpha = clamp(f.life * 1.4, 0, 1);
      ctx.font = "900 18px sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#111827";
      ctx.fillStyle = "#fff1a8";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });
  }

  function renderAttract() {
    if (!state.player) {
      state.player = makePlayer();
      state.guard = makeGuard();
    }
    const t = performance.now() / 1000;
    state.player.x = 122 + Math.sin(t * 1.1) * 10;
    state.player.y = state.world.h * 0.54 + Math.sin(t * 1.7) * 22;
    state.guard.x = state.world.w - 285;
    state.guard.y = state.world.h * 0.5 + Math.sin(t * 1.5) * 130;
    updateCamera(1 / 60);
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  function drawStar(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(state.time * 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? size : size * 0.45;
      const a = (i / 10) * TAU - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function setPadVector(clientX, clientY) {
    const rect = movePad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.34;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const mag = Math.min(max, length(dx, dy));
    const dir = normalize(dx, dy);
    const nx = (dir.x * mag) / max;
    const ny = (dir.y * mag) / max;
    input.touchMove.x = Math.abs(dx) < 4 && Math.abs(dy) < 4 ? 0 : nx;
    input.touchMove.y = Math.abs(dx) < 4 && Math.abs(dy) < 4 ? 0 : ny;
    moveKnob.style.transform = `translate3d(${dir.x * mag}px, ${dir.y * mag}px, 0)`;
  }

  function resetPad() {
    input.activePadPointer = null;
    input.touchMove.x = 0;
    input.touchMove.y = 0;
    moveKnob.style.transform = "translate3d(0, 0, 0)";
  }

  movePad.addEventListener("pointerdown", (event) => {
    input.activePadPointer = event.pointerId;
    movePad.setPointerCapture(event.pointerId);
    setPadVector(event.clientX, event.clientY);
  });

  movePad.addEventListener("pointermove", (event) => {
    if (event.pointerId === input.activePadPointer) {
      setPadVector(event.clientX, event.clientY);
    }
  });

  movePad.addEventListener("pointerup", resetPad);
  movePad.addEventListener("pointercancel", resetPad);
  movePad.addEventListener("lostpointercapture", resetPad);

  fireButton.addEventListener("pointerdown", () => {
    input.fireHeld = true;
    fireBanana();
  });
  fireButton.addEventListener("pointerup", () => {
    input.fireHeld = false;
  });
  fireButton.addEventListener("pointercancel", () => {
    input.fireHeld = false;
  });
  dashButton.addEventListener("pointerdown", tryDash);

  window.addEventListener("keydown", (event) => {
    input.keys.add(event.code);
    if (event.code === "Space") {
      event.preventDefault();
      fireBanana();
    }
    if (event.code === "Escape" && state.mode === "playing") {
      finish("lose");
    }
  });

  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.code);
  });

  playButton.addEventListener("click", resetGame);
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  resize();
  syncHud(true);
  if (new URLSearchParams(window.location.search).has("autoplay")) {
    resetGame();
  }
  requestAnimationFrame(frame);
})();
