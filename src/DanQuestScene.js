import Phaser from "phaser";
import { gsap } from "gsap";
import { CHARACTERS, CHARACTER_BY_ID, ENEMIES, MAP_THEMES, MISSIONS, activeCombos, computeHeroStats } from "./gameData.js";
import { playSound, startAmbient, stopAmbient } from "./sound.js";

const TAU = Math.PI * 2;

function hex(color) {
  return Number.parseInt(String(color).replace("#", ""), 16);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize(x, y) {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
}

function dist(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

export class DanQuestScene extends Phaser.Scene {
  constructor(handlers = {}) {
    super("DanQuestScene");
    this.handlers = handlers;
    this.inputVector = { x: 0, y: 0 };
    this.attackHeld = false;
    this.battle = null;
    this.ready = false;
  }

  create() {
    this.generateTextures();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,Q,E");
    this.physics.world.fixedStep = true;
    this.ready = true;
    this.handlers.onReady?.(this);
    this.add.text(16, 16, "DAN QUEST", { fontFamily: "Arial", fontSize: "22px", color: "#f8f3df", fontStyle: "900" }).setAlpha(0.22);
  }

  setTouchVector(x, y) {
    this.inputVector.x = x;
    this.inputVector.y = y;
  }

  setAttackHeld(value) {
    this.attackHeld = value;
  }

  setPaused(value) {
    if (!this.battle) return;
    this.battle.paused = value;
    this.heroes?.setVelocity?.(0, 0);
    this.enemies?.setVelocity?.(0, 0);
  }

  startMission(level, save, party) {
    const mission = MISSIONS.find((item) => item.level === level) || MISSIONS[0];
    this.clearBattle();
    startAmbient();
    const world = {
      w: clamp(1680 + mission.level * 90, 1680, 2520),
      h: clamp(980 + mission.level * 34, 980, 1380)
    };
    this.physics.world.setBounds(0, 0, world.w, world.h);
    this.cameras.main.setBounds(0, 0, world.w, world.h);
    this.cameras.main.setBackgroundColor(MAP_THEMES[mission.map].base);
    this.battle = {
      mission,
      save,
      party: party.slice(0, 3),
      world,
      heroes: [],
      activeIndex: 0,
      enemies: [],
      projectiles: [],
      zones: [],
      sentries: [],
      combos: activeCombos(party),
      comboTimer: 5200,
      wave: 0,
      wavesTotal: mission.final ? 3 : 2 + Math.floor(level / 4),
      spawnQueue: [],
      spawnTimer: 0,
      boss: null,
      bossPhase: 1,
      bossSpecial: 1800,
      kills: 0,
      jokeTimer: 2500,
      goodmanTimer: mission.level >= 4 ? 13500 : 999999,
      ended: false
    };
    this.mapLayer = this.add.group();
    this.obstacles = this.physics.add.staticGroup();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group({ allowGravity: false });
    this.heroes = this.physics.add.group({ allowGravity: false });
    this.fxLayer = this.add.group();

    this.createMap(mission, world);
    const startX = 170;
    const startY = world.h * 0.5;
    this.battle.party.forEach((id, index) => this.createHero(id, startX - index * 44, startY + (index - 1) * 58));
    this.spawnWave();
    this.battle.combos.forEach((combo) => this.handlers.onToast?.(`Combo: ${combo.name}`));

    this.physics.add.collider(this.heroes, this.obstacles);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.heroes, this.enemies, this.onHeroEnemyCollide, undefined, this);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.heroes, this.heroes);
    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileEnemy, undefined, this);
    this.physics.add.overlap(this.projectiles, this.heroes, this.onProjectileHero, undefined, this);

    this.cameras.main.startFollow(this.battle.heroes[0].sprite, true, 0.08, 0.08);
    this.handlers.onToast?.(mission.title);
    this.handlers.onToast?.(mission.joke);
    this.handlers.onHud?.(this.makeHud());
  }

  clearBattle() {
    stopAmbient();
    this.tweens.killAll();
    ["mapLayer", "obstacles", "projectiles", "enemies", "heroes", "fxLayer"].forEach((key) => {
      if (this[key]) {
        this[key].destroy(true);
        this[key] = null;
      }
    });
    this.battle = null;
  }

  update(_time, delta) {
    if (!this.battle || this.battle.ended || this.battle.paused) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.basicAttack();
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.castUltimate();
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.swapHero();
    this.updateSpawning(delta);
    this.updateHeroes(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updateCombos(delta);
    this.updateProjectiles(delta);
    this.updateZones(delta);
    this.updateSentries(delta);
    this.updateBattleFlow();
    this.battle.jokeTimer -= delta;
    this.battle.goodmanTimer -= delta;
    if (this.battle.jokeTimer <= 0) {
      this.battle.jokeTimer = 22000;
      this.floatText(this.activeHero().sprite.x, this.activeHero().sprite.y - 78, this.battle.mission.joke, "#fff1a8");
    }
    if (this.battle.goodmanTimer <= 0) {
      this.battle.goodmanTimer = Phaser.Math.Between(22000, 33000);
      this.goodmanChaos();
    }
    this.handlers.onHud?.(this.makeHud());
  }

  makeHud() {
    const battle = this.battle;
    const boss = battle.boss;
    return {
      level: battle.mission.level,
      mission: battle.mission.title,
      objective: boss ? "BOSS" : "OBJECTIVE",
      progress: boss ? `${boss.meta.name} ${Math.max(0, Math.ceil((boss.meta.hp / boss.meta.maxHp) * 100))}%` : `Wave ${battle.wave}/${battle.wavesTotal}`,
      heroes: battle.heroes.map((hero, index) => ({
        id: hero.id,
        name: CHARACTER_BY_ID[hero.id].name,
        color: CHARACTER_BY_ID[hero.id].color,
        active: index === battle.activeIndex,
        hp: hero.data.hp,
        maxHp: hero.data.maxHp,
        ult: hero.data.ult,
        ultCost: hero.data.ultCost,
        down: hero.data.down
      }))
    };
  }

  createHero(id, x, y) {
    const stats = computeHeroStats(id, this.battle.save, this.battle.party);
    const sprite = this.physics.add.sprite(x, y, `hero-${id}`);
    sprite.setDepth(20);
    sprite.setCircle(24, 8, 8);
    sprite.setDrag(1200);
    sprite.setMaxVelocity(stats.speed);
    sprite.body.setCollideWorldBounds(true);
    sprite.body.onWorldBounds = true;
    const hero = {
      id,
      sprite,
      data: {
        hp: stats.maxHp,
        maxHp: stats.maxHp,
        attack: stats.attack,
        speed: stats.speed,
        range: stats.range,
        cooldown: 0,
        cooldownMax: stats.cooldown,
        ult: 42,
        ultCost: stats.ultimateCost,
        ultimatePower: stats.ultimatePower,
        invuln: 0,
        down: false,
        revive: 0,
        face: { x: 1, y: 0 },
        brain: Math.random() * TAU
      }
    };
    this.heroes.add(sprite);
    this.battle.heroes.push(hero);
    gsap.fromTo(sprite, { scaleX: 0.2, scaleY: 0.2 }, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "back.out(2)" });
    return hero;
  }

  createMap(mission, world) {
    const theme = MAP_THEMES[mission.map];
    const floor = this.add.graphics();
    floor.clear();
    floor.fillStyle(theme.base, 1).fillRect(0, 0, world.w, world.h);
    for (let x = 0; x < world.w; x += 120) {
      for (let y = 0; y < world.h; y += 120) {
        if ((x + y) % 240 === 0) floor.fillStyle(theme.mid, 0.78).fillRect(x, y, 116, 116);
      }
    }
    floor.lineStyle(2, 0xffffff, 0.055);
    for (let x = 0; x < world.w; x += 80) floor.lineBetween(x, 0, x, world.h);
    for (let y = 0; y < world.h; y += 80) floor.lineBetween(0, y, world.w, y);
    floor.setDepth(-20);
    this.mapLayer.add(floor);

    this.addBillboard(world.w - 420, 72, theme.label);
    if (mission.map === "grapeFields") {
      for (let i = 0; i < 28; i += 1) this.addProp("prop-grapevine", (i * 151) % world.w, 120 + (i * 83) % (world.h - 240), true);
      this.addBillboard(170, world.h - 150, "Vine Soldiers patrol the grapes");
    } else if (mission.map === "jungle") {
      for (let i = 0; i < 34; i += 1) this.addProp("prop-tree", (i * 173) % world.w, 110 + (i * 97) % (world.h - 220), true);
      this.addBillboard(180, world.h - 140, "Monkey sounds. Banana danger.");
    } else if (mission.map === "workEmpire") {
      this.addProp("npc-goodman", world.w * 0.55, 170, false);
      this.addBillboard(180, 110, "GOODMAN FINANCE");
      for (let i = 0; i < 14; i += 1) this.addProp("prop-office", 220 + i * 115, 180 + (i % 4) * 150, true);
    } else if (mission.map === "military") {
      this.addBillboard(200, 110, "MILITARY ZONE");
      for (let i = 0; i < 16; i += 1) this.addProp("prop-crate", 200 + i * 135, 170 + (i % 5) * 130, true);
    } else if (mission.map === "darkVineyard") {
      for (let i = 0; i < 32; i += 1) this.addProp("prop-darkvine", (i * 137) % world.w, 130 + (i * 91) % (world.h - 260), true);
      this.addBillboard(world.w - 560, 110, "DARK VINEYARD");
    } else if (mission.map === "castle") {
      this.addProp("npc-giat", world.w * 0.46, 190, false);
      this.addProp("npc-bruiner", world.w * 0.58, 210, false);
      this.addBillboard(world.w * 0.38, 105, "KASHI CASTLE");
      this.addBillboard(world.w * 0.62, world.h - 170, "Low cost nap route");
      for (let i = 0; i < 12; i += 1) this.addProp("prop-office", world.w - 600 + i * 54, 180 + (i % 4) * 110, true);
    } else if (mission.map === "darkKashi") {
      for (let i = 0; i < 14; i += 1) this.addProp("prop-office", world.w - 640 + i * 46, 150 + (i % 5) * 92, true);
      for (let i = 0; i < 18; i += 1) this.addProp("prop-darkvine", 140 + i * 112, world.h - 220 - (i % 4) * 120, true);
      this.addBillboard(world.w - 550, 92, "EMPEROR OF GRAPES");
    } else {
      for (let i = 0; i < 10; i += 1) this.addProp("prop-crate", 220 + i * 145, 180 + (i % 4) * 170, true);
    }
  }

  drawSoccerField(world) {
    const g = this.add.graphics().setDepth(-10);
    g.lineStyle(6, 0xf8f3df, 0.5);
    g.strokeRect(world.w * 0.25, world.h * 0.2, world.w * 0.5, world.h * 0.6);
    g.strokeCircle(world.w * 0.5, world.h * 0.5, 90);
    this.mapLayer.add(g);
  }

  addProp(texture, x, y, collides) {
    const sprite = collides ? this.obstacles.create(x, y, texture) : this.add.sprite(x, y, texture);
    sprite.setDepth(collides ? 8 : 6);
    if (collides) {
      sprite.body.setCircle(Math.min(sprite.width, sprite.height) * 0.34);
      sprite.body.updateFromGameObject();
    } else {
      this.mapLayer.add(sprite);
      gsap.to(sprite, { y: y - 8, duration: 0.75, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
    return sprite;
  }

  addBillboard(x, y, text) {
    const group = this.add.group();
    const rect = this.add.graphics().setDepth(5);
    rect.fillStyle(0x10151f, 0.74).fillRoundedRect(x, y, 230, 58, 8);
    rect.lineStyle(2, 0xffffff, 0.14).strokeRoundedRect(x, y, 230, 58, 8);
    const label = this.add.text(x + 115, y + 29, text, {
      fontFamily: "Arial",
      fontSize: "17px",
      fontStyle: "900",
      color: "#f8f3df",
      align: "center"
    }).setOrigin(0.5).setDepth(6);
    group.addMultiple([rect, label]);
    this.mapLayer.addMultiple([rect, label]);
  }

  spawnWave() {
    const battle = this.battle;
    battle.wave += 1;
    const count = 5 + battle.mission.level * 2 + battle.wave * 2 + (battle.mission.final ? 8 : 0);
    battle.spawnQueue = Array.from({ length: count }, () => Phaser.Utils.Array.GetRandom(battle.mission.enemyPool));
    battle.spawnTimer = 0;
    this.handlers.onToast?.(`Wave ${battle.wave}/${battle.wavesTotal}`);
  }

  updateSpawning(delta) {
    const battle = this.battle;
    if (!battle.spawnQueue.length) return;
    battle.spawnTimer -= delta;
    if (battle.spawnTimer <= 0) {
      battle.spawnTimer = Math.max(140, 430 - battle.mission.level * 14);
      this.spawnEnemy(battle.spawnQueue.shift());
    }
  }

  spawnEnemy(type, elite = 0) {
    const battle = this.battle;
    const base = ENEMIES[type] || ENEMIES.vineSoldier;
    const pos = this.edgePosition();
    const levelScale = 1 + battle.mission.level * 0.115 + elite;
    const sprite = this.physics.add.sprite(pos.x, pos.y, base.texture);
    sprite.setDepth(18);
    sprite.setCircle(base.radius + (elite ? 4 : 0), 8, 8);
    sprite.setDrag(900);
    sprite.body.setCollideWorldBounds(true);
    sprite.body.onWorldBounds = true;
    sprite.meta = {
      type,
      name: base.name,
      hp: Math.round(base.hp * levelScale),
      maxHp: Math.round(base.hp * levelScale),
      speed: base.speed * (1 + battle.mission.level * 0.012),
      damage: base.damage * (1 + battle.mission.level * 0.055),
      mode: base.mode,
      range: base.range || 90,
      cooldown: Phaser.Math.Between(300, 1100),
      cooldownMax: base.cooldown || 1200,
      stun: 0,
      slow: 0,
      boss: false,
      color: base.color
    };
    this.enemies.add(sprite);
    battle.enemies.push(sprite);
    if (type === "monkey") playSound("monkey");
    gsap.fromTo(sprite, { scaleX: 0.1, scaleY: 0.1 }, { scaleX: elite ? 1.18 : 1, scaleY: elite ? 1.18 : 1, duration: 0.25, ease: "back.out(2)" });
    return sprite;
  }

  edgePosition() {
    const { world } = this.battle;
    const edge = Phaser.Math.Between(0, 3);
    if (edge === 0) return { x: Phaser.Math.Between(50, world.w - 50), y: 50 };
    if (edge === 1) return { x: world.w - 50, y: Phaser.Math.Between(80, world.h - 80) };
    if (edge === 2) return { x: Phaser.Math.Between(50, world.w - 50), y: world.h - 50 };
    return { x: 50, y: Phaser.Math.Between(80, world.h - 80) };
  }

  spawnBoss() {
    const battle = this.battle;
    const info = battle.mission.boss;
    const sprite = this.physics.add.sprite(battle.world.w - 260, battle.world.h * 0.5, info.type === "kashi" ? "boss-kashi" : "boss-generic");
    sprite.setDepth(25);
    sprite.setCircle(info.type === "kashi" ? 46 : 38, 8, 8);
    sprite.body.setCollideWorldBounds(true);
    sprite.meta = {
      type: info.type,
      name: info.name,
      hp: info.type === "kashi" ? info.hp : Math.round(info.hp * (1 + battle.mission.level * 0.12)),
      maxHp: info.type === "kashi" ? info.hp : Math.round(info.hp * (1 + battle.mission.level * 0.12)),
      speed: info.type === "kashi" ? 88 : 78 + battle.mission.level * 4,
      damage: info.type === "kashi" ? 26 : 18 + battle.mission.level * 1.5,
      mode: "boss",
      cooldown: 900,
      cooldownMax: info.type === "kashi" ? 900 : 1200,
      stun: 0,
      slow: 0,
      boss: true,
      color: info.color
    };
    this.enemies.add(sprite);
    battle.enemies.push(sprite);
    battle.boss = sprite;
    battle.bossPhase = 1;
    battle.bossSpecial = 1400;
    this.handlers.onToast?.(info.type === "kashi" ? "Kashi Phase 1: Assignments" : `${info.name} enters`);
    playSound("boss");
    this.cameras.main.shake(360, 0.008);
    gsap.fromTo(sprite, { alpha: 0, y: sprite.y - 120 }, { alpha: 1, y: sprite.y, duration: 0.8, ease: "back.out(1.5)" });
    gsap.fromTo(sprite, { scaleX: 2.1, scaleY: 2.1 }, { scaleX: 1.12, scaleY: 1.12, duration: 0.8, ease: "elastic.out(1, 0.4)" });
  }

  updateHeroes(delta) {
    const battle = this.battle;
    const move = this.getMoveVector();
    battle.heroes.forEach((hero, index) => {
      const data = hero.data;
      if (data.down) {
        data.revive -= delta;
        hero.sprite.setVelocity(0, 0);
        hero.sprite.setAlpha(0.35);
        if (data.revive <= 0 && this.livingHeroes().length) {
          data.down = false;
          data.hp = Math.round(data.maxHp * 0.45);
          hero.sprite.setAlpha(1);
          hero.sprite.setPosition(this.activeHero().sprite.x - 48, this.activeHero().sprite.y + 48);
          this.floatText(hero.sprite.x, hero.sprite.y - 48, `${CHARACTER_BY_ID[hero.id].name} returns`, "#b9f5cd");
        }
        return;
      }
      data.cooldown = Math.max(0, data.cooldown - delta);
      data.invuln = Math.max(0, data.invuln - delta);
      data.stun = Math.max(0, data.stun - delta);
      data.ult = clamp(data.ult + delta * (hero.id === "dan" ? 0.0085 : 0.0062), 0, data.ultCost);
      if (index === battle.activeIndex) {
        this.moveActiveHero(hero, move, delta);
        if (this.attackHeld) this.basicAttack(hero);
      } else {
        this.updateCompanion(hero, delta);
      }
      this.animateHero(hero, delta);
    });
    if (this.activeHero().data.down) this.swapHero();
    this.applyPassives(delta);
  }

  moveActiveHero(hero, move) {
    const speed = hero.data.speed;
    hero.sprite.setVelocity(move.x * speed, move.y * speed);
    if (Math.abs(move.x) + Math.abs(move.y) > 0.02) hero.data.face = { x: move.x, y: move.y };
  }

  updateCompanion(hero, delta) {
    const leader = this.activeHero();
    const target = this.nearestEnemy(hero.sprite, hero.data.range + 160);
    if (target && hero.data.cooldown <= 0) this.basicAttack(hero);
    const angle = hero.data.brain + this.time.now * 0.0015;
    const anchor = {
      x: leader.sprite.x - 90 + Math.cos(angle) * 58,
      y: leader.sprite.y + Math.sin(angle) * 66
    };
    const desired = target && dist(hero.sprite, target) < 220 ? normalize(hero.sprite.x - target.x, hero.sprite.y - target.y) : normalize(anchor.x - hero.sprite.x, anchor.y - hero.sprite.y);
    hero.sprite.setVelocity(desired.x * hero.data.speed * 0.72, desired.y * hero.data.speed * 0.72);
    hero.data.face = desired;
  }

  animateHero(hero) {
    const moving = Math.hypot(hero.sprite.body.velocity.x, hero.sprite.body.velocity.y) > 20;
    hero.sprite.setRotation(moving ? Math.sin(this.time.now * 0.012) * 0.08 : Math.sin(this.time.now * 0.004) * 0.035);
    if (hero.id === "dan") hero.sprite.setGlow?.();
  }

  applyPassives(delta) {
    const living = this.livingHeroes().map((hero) => hero.id);
    if (living.includes("hadar")) {
      this.battle.heroes.forEach((hero) => {
        if (!hero.data.down) hero.data.hp = Math.min(hero.data.maxHp, hero.data.hp + delta * 0.0018);
      });
    }
    if (living.includes("dan")) {
      this.battle.heroes.forEach((hero) => {
        if (!hero.data.down) hero.data.cooldown = Math.max(0, hero.data.cooldown - delta * 0.2);
      });
    }
  }

  updateCombos(delta) {
    const battle = this.battle;
    if (!battle.combos.length) return;
    battle.comboTimer -= delta;
    if (battle.comboTimer > 0) return;
    battle.comboTimer = 6400;
    const combo = Phaser.Utils.Array.GetRandom(battle.combos);
    this.fireComboAttack(combo);
  }

  fireComboAttack(combo) {
    const hero = this.activeHero();
    const target = this.nearestEnemy(hero.sprite, 99999);
    this.handlers.onToast?.(combo.line);
    this.floatText(hero.sprite.x, hero.sprite.y - 98, combo.name, combo.color);
    playSound("ultimate");
    if (target) {
      const n = normalize(target.x - hero.sprite.x, target.y - hero.sprite.y);
      for (let i = -1; i <= 1; i += 1) {
        const base = Math.atan2(n.y, n.x) + i * 0.18;
        this.spawnProjectile("hero", hero.sprite.x, hero.sprite.y, Math.cos(base) * 760, Math.sin(base) * 760, hero.data.attack * 1.15, combo.projectile, 1450, 13, combo.id);
      }
      this.addZone(target.x, target.y, 96, 420, hero.data.attack * 1.1, combo.color, "hero");
    } else {
      this.addZone(hero.sprite.x, hero.sprite.y, 170, 600, hero.data.attack * 0.8, combo.color, "hero");
    }
    this.cameras.main.shake(180, 0.006);
  }

  getMoveVector() {
    let x = this.inputVector.x;
    let y = this.inputVector.y;
    if (this.cursors.left.isDown || this.keys.A.isDown) x -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) x += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) y -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) y += 1;
    if (Math.hypot(x, y) > 1) return normalize(x, y);
    return { x, y };
  }

  updateEnemies(delta) {
    const battle = this.battle;
    for (let i = battle.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = battle.enemies[i];
      const data = enemy.meta;
      if (!enemy.active || data.hp <= 0) {
        this.defeatEnemy(enemy);
        continue;
      }
      data.cooldown = Math.max(0, data.cooldown - delta);
      data.stun = Math.max(0, data.stun - delta);
      data.slow = Math.max(0, data.slow - delta);
      if (data.stun > 0) {
        enemy.setVelocity(0, 0);
        continue;
      }
      const targetHero = this.nearestHero(enemy);
      if (!targetHero) continue;
      const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetHero.sprite.x, targetHero.sprite.y);
      const n = normalize(targetHero.sprite.x - enemy.x, targetHero.sprite.y - enemy.y);
      const speed = data.speed * (data.slow > 0 ? 0.45 : 1);
      if (data.mode === "ranged" || data.mode === "spray") {
        enemy.setVelocity(d > data.range * 0.74 ? n.x * speed : -n.x * speed * 0.22, d > data.range * 0.74 ? n.y * speed : -n.y * speed * 0.22);
        if (d < data.range && data.cooldown <= 0) {
          data.cooldown = data.cooldownMax;
          this.enemyShoot(enemy, targetHero.sprite, data.mode === "spray" ? 3 : 1);
        }
      } else if (data.mode === "boss") {
        enemy.setVelocity(n.x * speed, n.y * speed);
        if (data.cooldown <= 0 && d < 560) {
          data.cooldown = data.cooldownMax;
          this.enemyShoot(enemy, targetHero.sprite, data.type === "kashi" ? 3 : 2);
        }
      } else {
        enemy.setVelocity(n.x * speed, n.y * speed);
      }
      enemy.setRotation(Math.sin(this.time.now * 0.006 + i) * 0.08);
    }
  }

  updateBoss(delta) {
    const battle = this.battle;
    const boss = battle.boss;
    if (!boss || !boss.active || boss.meta.hp <= 0) return;
    battle.bossSpecial -= delta;
    if (boss.meta.type === "kashi") {
      const ratio = boss.meta.hp / boss.meta.maxHp;
      const phase = ratio > 0.75 ? 1 : ratio > 0.5 ? 2 : ratio > 0.25 ? 3 : 4;
      if (phase !== battle.bossPhase) {
        battle.bossPhase = phase;
        const text = phase === 2 ? "Phase 2: Rage Kashi" : phase === 3 ? "Phase 3: Emperor Kashi" : "Phase 4: Dark Kashi";
        this.handlers.onToast?.(text);
        this.floatText(boss.x, boss.y - 88, text, "#ffdf7f");
        this.cameras.main.shake(550, 0.013);
        playSound("boss");
      }
      if (battle.bossSpecial <= 0) {
        battle.bossSpecial = phase === 1 ? 3200 : phase === 2 ? 2500 : phase === 3 ? 2000 : 1450;
        this.kashiSpecial(phase);
      }
    } else if (battle.bossSpecial <= 0) {
      battle.bossSpecial = clamp(3000 - battle.mission.level * 80, 1450, 3000);
      this.bossSpecial(boss);
    }
  }

  enemyShoot(enemy, target, count) {
    const base = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    const spread = count > 1 ? 0.32 : 0;
    const texture = {
      grapeWarrior: "proj-grape",
      eliteGuard: "proj-darkgrape",
      darkVineBeast: "proj-darkgrape",
      kashiAssistant: "proj-sheet",
      grapeTank: "proj-grape",
      kashi: "proj-darkgrape"
    }[enemy.meta.type] || "proj-grape";
    for (let i = 0; i < count; i += 1) {
      const a = base + (count === 1 ? 0 : (i - (count - 1) / 2) * spread);
      this.spawnProjectile("enemy", enemy.x + Math.cos(a) * 26, enemy.y + Math.sin(a) * 26, Math.cos(a) * 330, Math.sin(a) * 330, enemy.meta.damage, texture, 2800, 14);
    }
  }

  bossSpecial(boss) {
    const target = this.activeHero().sprite;
    this.floatText(boss.x, boss.y - 72, boss.meta.name, "#fff1a8");
    const type = boss.meta.type;
    if (type === "monkeyBoss") {
      for (let i = 0; i < 5; i += 1) this.spawnEnemy("monkey", 0.15);
      this.floatText(boss.x, boss.y - 98, "MENDEL I FOUND YOU", "#fff1a8");
      this.radialShots(boss, 9, 330, "proj-banana");
    } else if (type === "vineCaptain") {
      this.radialShots(boss, 11, 315, "proj-grape");
      for (let i = 0; i < 4; i += 1) this.spawnEnemy("vineSoldier", 0.22);
    } else if (type === "financeBoss") {
      this.radialShots(boss, 10, 320, "proj-sheet");
      for (let i = 0; i < 14; i += 1) this.addZone(target.x + Phaser.Math.Between(-240, 240), target.y + Phaser.Math.Between(-200, 200), 44, 900, boss.meta.damage * 0.5, "#f5c451", "enemy");
    } else if (type === "militaryBoss") {
      this.radialShots(boss, 12, 350, "proj-wrench");
      for (let i = 0; i < 4; i += 1) this.spawnEnemy(Phaser.Utils.Array.GetRandom(["vineSoldier", "eliteGuard"]), 0.28);
    } else if (type === "identityBoss") {
      this.addZone(target.x, target.y, 168, 1250, boss.meta.damage * 0.62, "#ff9fc0", "enemy");
      this.radialShots(boss, 12, 300, "proj-confusion");
    } else if (type === "castleBoss") {
      this.radialShots(boss, 16, 350, "proj-darkgrape");
      for (let i = 0; i < 5; i += 1) this.spawnEnemy(Phaser.Utils.Array.GetRandom(["eliteGuard", "grapeTank", "kashiAssistant"]), 0.34);
    } else {
      this.radialShots(boss, 12, 310, "proj-grape");
    }
    this.cameras.main.shake(320, 0.008);
  }

  kashiSpecial(phase) {
    const boss = this.battle.boss;
    const target = this.activeHero().sprite;
    if (phase === 1) {
      this.floatText(boss.x, boss.y - 88, "Kashi", "#f6e9bf");
      this.radialShots(boss, 8, 330, "proj-grape");
      for (let i = 0; i < 3; i += 1) this.spawnEnemy("vineSoldier", 0.4);
    } else if (phase === 2) {
      this.floatText(boss.x, boss.y - 88, "Rage Kashi", "#ee6656");
      for (let i = 0; i < 8; i += 1) this.addZone(target.x + Phaser.Math.Between(-220, 220), target.y + Phaser.Math.Between(-180, 180), 50, 850, boss.meta.damage * 0.58, "#ee6656", "enemy");
      for (let i = 0; i < 4; i += 1) this.spawnEnemy("grapeWarrior", 0.45);
    } else if (phase === 3) {
      this.floatText(boss.x, boss.y - 88, "Emperor Kashi", "#b68cff");
      this.radialShots(boss, 16, 340, "proj-grape");
      this.addZone(target.x, target.y, 175, 1250, boss.meta.damage * 0.72, "#8e44ad", "enemy");
      for (let i = 0; i < 5; i += 1) this.spawnEnemy(Phaser.Utils.Array.GetRandom(["eliteGuard", "grapeTank", "kashiAssistant"]), 0.42);
    } else {
      this.floatText(boss.x, boss.y - 92, "Dark Kashi", "#d7b8ff");
      this.radialShots(boss, 22, 370, "proj-darkgrape");
      this.addZone(target.x, target.y, 220, 1400, boss.meta.damage * 0.9, "#20152f", "enemy");
      for (let i = 0; i < 6; i += 1) this.spawnEnemy(Phaser.Utils.Array.GetRandom(["darkVineBeast", "eliteGuard", "grapeTank"]), 0.52);
    }
    playSound("boss");
    this.cameras.main.shake(500, 0.014);
  }

  radialShots(source, count, speed, texture) {
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * TAU + this.time.now * 0.0004;
      this.spawnProjectile("enemy", source.x, source.y, Math.cos(a) * speed, Math.sin(a) * speed, source.meta.damage, texture, 3300, 13);
    }
  }

  basicAttack(hero = this.activeHero()) {
    const data = hero.data;
    if (!hero || data.down || data.cooldown > 0 || data.stun > 0) return;
    const character = CHARACTER_BY_ID[hero.id];
    const target = this.nearestEnemy(hero.sprite, data.range + 80);
    const dir = target ? normalize(target.x - hero.sprite.x, target.y - hero.sprite.y) : data.face;
    data.face = dir;
    data.cooldown = data.cooldownMax;
    playSound("attack");

    if (character.style === "dash") {
      hero.sprite.setVelocity(dir.x * data.speed * 2.5, dir.y * data.speed * 2.5);
      data.invuln = Math.max(data.invuln, 180);
      this.damageArc(hero.sprite.x, hero.sprite.y, 100, data.attack * 1.3, "#9b78de");
      this.trail(hero.sprite.x - dir.x * 80, hero.sprite.y - dir.y * 80, hero.sprite.x, hero.sprite.y, "#9b78de");
    } else if (character.style === "melee") {
      this.damageArc(hero.sprite.x + dir.x * 48, hero.sprite.y + dir.y * 48, 116, data.attack * 1.35, "#c97848");
    } else if (character.style === "spread") {
      const base = Math.atan2(dir.y, dir.x);
      [-0.22, 0, 0.22].forEach((offset) => this.spawnHeroProjectile(hero, Math.cos(base + offset), Math.sin(base + offset), data.attack * 0.9, "proj-money", 580));
    } else if (character.style === "debate") {
      this.addZone(hero.sprite.x + dir.x * 95, hero.sprite.y + dir.y * 95, 112, 280, data.attack * 1.4, "#ff8f52", "hero");
      this.floatText(hero.sprite.x, hero.sprite.y - 58, "Argument Mode", "#ffdf7f");
    } else {
      const texture = {
        banana: "proj-banana",
        question: "proj-question",
        spreadsheet: "proj-sheet",
        budget: "proj-coupon",
        tactical: "proj-wrench",
        charge: "proj-wrench",
        ice: "proj-ice",
        punch: "proj-punch",
        precision: "proj-focus",
        confusion: "proj-confusion",
        coupon: "proj-coupon",
        soccer: "proj-ball",
        ai: "proj-ai",
        rabbi: "proj-scroll",
        business: "proj-money",
        agig: "proj-agig",
        sleep: "proj-sleep",
        calm: "proj-calm",
        spray: "proj-spray",
        blessing: "proj-blessing"
      }[character.style] || "proj-paper";
      this.spawnHeroProjectile(hero, dir.x, dir.y, data.attack, texture, character.style === "soccer" ? 700 : 610);
    }
    data.ult = clamp(data.ult + 4, 0, data.ultCost);
  }

  spawnHeroProjectile(hero, dx, dy, damage, texture, speed) {
    this.spawnProjectile("hero", hero.sprite.x + dx * 28, hero.sprite.y + dy * 28, dx * speed, dy * speed, damage, texture, 1600, texture === "proj-ball" ? 15 : 12, hero.id);
  }

  spawnProjectile(owner, x, y, vx, vy, damage, texture, ttl, radius, source = null) {
    const sprite = this.physics.add.sprite(x, y, texture);
    sprite.setDepth(16);
    sprite.setCircle(radius || 12, 4, 4);
    sprite.setVelocity(vx, vy);
    sprite.setRotation(Math.atan2(vy, vx));
    sprite.meta = { owner, damage, ttl, source, hit: new Set(), radius: radius || 12 };
    this.projectiles.add(sprite);
    this.battle.projectiles.push(sprite);
    return sprite;
  }

  castUltimate() {
    const hero = this.activeHero();
    if (!hero || hero.data.down || hero.data.ult < hero.data.ultCost) {
      playSound("menu");
      return false;
    }
    const character = CHARACTER_BY_ID[hero.id];
    hero.data.ult = 0;
    const power = hero.data.ultimatePower;
    this.handlers.onToast?.(`${character.name}: ${character.ultimate}`);
    this.floatText(hero.sprite.x, hero.sprite.y - 84, character.ultimate, "#fff1a8");
    this.cameras.main.shake(520, 0.014);
    playSound("ultimate");

    if (hero.id === "mendel") {
      for (let i = 0; i < 22; i += 1) this.spawnHeroProjectile(hero, Math.cos((i / 22) * TAU), Math.sin((i / 22) * TAU), hero.data.attack * 1.3 * power, "proj-banana", 720);
      this.addZone(hero.sprite.x, hero.sprite.y, 220, 1200, hero.data.attack * 0.7 * power, "#f5c451", "hero");
    } else if (hero.id === "aviad") {
      this.battle.enemies.forEach((enemy) => {
        enemy.meta.stun = Math.max(enemy.meta.stun, 2500 * power);
        enemy.meta.hp -= hero.data.attack * 1.6 * power;
      });
      this.addZone(hero.sprite.x, hero.sprite.y, 330, 900, 0, "#55b8dc", "visual");
    } else if (hero.id === "halel") {
      hero.data.invuln = 2400;
      for (let i = 0; i < 7; i += 1) {
        const target = this.nearestEnemy(hero.sprite, 99999);
        if (!target) break;
        this.trail(hero.sprite.x, hero.sprite.y, target.x, target.y, "#9b78de");
        hero.sprite.setPosition(target.x + Phaser.Math.Between(-32, 32), target.y + Phaser.Math.Between(-32, 32));
        target.data.hp -= hero.data.attack * 2.2 * power;
      }
    } else if (hero.id === "farber") {
      for (let i = 0; i < 3; i += 1) this.addSentry(hero.sprite.x + Phaser.Math.Between(-90, 90), hero.sprite.y + Phaser.Math.Between(-90, 90), "#c97848", hero.data.attack * power, "wrench");
    } else if (hero.id === "kuzar") {
      this.battle.enemies.forEach((enemy) => {
        enemy.meta.hp -= hero.data.attack * 1.75 * power;
        enemy.meta.slow = Math.max(enemy.meta.slow, 4300);
      });
      this.addZone(hero.sprite.x, hero.sprite.y, 360, 1000, 0, "#68c58a", "visual");
    } else if (hero.id === "gelman") {
      for (let i = 0; i < 32; i += 1) this.addZone(hero.sprite.x + Phaser.Math.Between(-360, 360), hero.sprite.y + Phaser.Math.Between(-260, 260), 42, Phaser.Math.Between(450, 1000), hero.data.attack * 0.85 * power, "#f5c451", "hero");
    } else if (hero.id === "amichai") {
      this.floatText(hero.sprite.x, hero.sprite.y - 112, "SOCCER BEAST MODE", "#b9f5cd");
      gsap.fromTo(hero.sprite, { scaleX: 1.7, scaleY: 1.7 }, { scaleX: 1, scaleY: 1, duration: 1.1, ease: "elastic.out(1,0.45)" });
      for (let i = 0; i < 18; i += 1) this.spawnHeroProjectile(hero, Math.cos((i / 18) * TAU), Math.sin((i / 18) * TAU), hero.data.attack * 1.2 * power, "proj-ball", 780);
    } else if (hero.id === "david") {
      for (let i = 0; i < 5; i += 1) this.addSentry(hero.sprite.x + Phaser.Math.Between(-120, 120), hero.sprite.y + Phaser.Math.Between(-120, 120), "#43c9c9", hero.data.attack * power, "ai");
    } else if (hero.id === "amit") {
      this.battle.heroes.forEach((ally) => {
        ally.data.hp = Math.min(ally.data.maxHp, ally.data.hp + ally.data.maxHp * 0.36 * power);
        ally.data.invuln = Math.max(ally.data.invuln, 1800);
      });
      this.battle.enemies.forEach((enemy) => {
        enemy.meta.stun = Math.max(enemy.meta.stun, 2200);
        enemy.meta.hp -= hero.data.attack * 1.1 * power;
      });
    } else if (hero.id === "hadar") {
      this.battle.heroes.forEach((ally) => ally.data.hp = Math.min(ally.data.maxHp, ally.data.hp + ally.data.maxHp * 0.56 * power));
      this.addZone(hero.sprite.x, hero.sprite.y, 315, 3300, hero.data.attack * 0.55 * power, "#ff9fc0", "hero");
    } else if (hero.id === "tal") {
      this.addZone(hero.sprite.x, hero.sprite.y, 430, 5400, hero.data.attack * 0.5 * power, "#ff8f52", "hero");
    } else if (hero.id === "dan") {
      this.battle.heroes.forEach((ally) => {
        ally.data.hp = ally.data.maxHp;
        ally.data.invuln = Math.max(ally.data.invuln, 4200);
      });
      this.battle.enemies.forEach((enemy) => {
        enemy.meta.hp -= hero.data.attack * 3.5 * power;
        enemy.meta.stun = Math.max(enemy.meta.stun, 1400);
      });
      this.addZone(hero.sprite.x, hero.sprite.y, 530, 2600, hero.data.attack * 0.72 * power, "#fff1a8", "hero");
    }
    return true;
  }

  addSentry(x, y, color, damage, mode) {
    const sprite = this.add.sprite(x, y, mode === "ai" ? "sentry-ai" : "sentry-wrench").setDepth(17);
    sprite.meta = { life: mode === "ai" ? 7600 : 8200, fire: 0, damage, mode, color };
    this.battle.sentries.push(sprite);
    this.fxLayer.add(sprite);
    gsap.fromTo(sprite, { scaleX: 0.2, scaleY: 0.2 }, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "back.out(2)" });
  }

  updateSentries(delta) {
    for (let i = this.battle.sentries.length - 1; i >= 0; i -= 1) {
      const sentry = this.battle.sentries[i];
      sentry.meta.life -= delta;
      sentry.meta.fire -= delta;
      if (sentry.meta.mode === "ai") {
        const leader = this.activeHero().sprite;
        sentry.x += (leader.x + Math.cos(this.time.now * 0.002 + i) * 130 - sentry.x) * 0.05;
        sentry.y += (leader.y + Math.sin(this.time.now * 0.002 + i) * 100 - sentry.y) * 0.05;
      }
      if (sentry.meta.fire <= 0) {
        sentry.meta.fire = sentry.meta.mode === "ai" ? 430 : 620;
        const target = this.nearestEnemy(sentry, 640);
        if (target) {
          const n = normalize(target.x - sentry.x, target.y - sentry.y);
          this.spawnProjectile("hero", sentry.x, sentry.y, n.x * 650, n.y * 650, sentry.meta.damage, sentry.meta.mode === "ai" ? "proj-ai" : "proj-wrench", 1200, 12);
        }
      }
      if (sentry.meta.life <= 0) {
        sentry.destroy();
        this.battle.sentries.splice(i, 1);
      }
    }
  }

  updateProjectiles(delta) {
    for (let i = this.battle.projectiles.length - 1; i >= 0; i -= 1) {
      const p = this.battle.projectiles[i];
      if (!p.active) {
        this.battle.projectiles.splice(i, 1);
        continue;
      }
      p.meta.ttl -= delta;
      p.rotation += delta * 0.006;
      if (p.meta.ttl <= 0) {
        p.destroy();
        this.battle.projectiles.splice(i, 1);
      }
    }
  }

  updateZones(delta) {
    for (let i = this.battle.zones.length - 1; i >= 0; i -= 1) {
      const zone = this.battle.zones[i];
      zone.life -= delta;
      zone.gfx.setAlpha(Math.max(0, zone.life / zone.maxLife) * 0.32);
      zone.ring.setScale(1 + Math.sin(this.time.now * 0.01) * 0.03);
      if (zone.owner === "hero") {
        this.battle.enemies.forEach((enemy) => {
          if (enemy.active && enemy.meta.hp > 0 && Phaser.Math.Distance.Between(zone.x, zone.y, enemy.x, enemy.y) < zone.radius + 24) {
            enemy.meta.hp -= zone.damage * (delta / 1000);
            enemy.meta.slow = Math.max(enemy.meta.slow, 260);
          }
        });
      } else if (zone.owner === "enemy") {
        this.battle.heroes.forEach((hero) => {
          if (!hero.data.down && Phaser.Math.Distance.Between(zone.x, zone.y, hero.sprite.x, hero.sprite.y) < zone.radius + 24) {
            this.damageHero(hero, zone.damage * (delta / 1000), normalize(hero.sprite.x - zone.x, hero.sprite.y - zone.y), true);
          }
        });
      }
      if (zone.life <= 0) {
        zone.gfx.destroy();
        zone.ring.destroy();
        this.battle.zones.splice(i, 1);
      }
    }
  }

  addZone(x, y, radius, life, damage, color, owner) {
    const gfx = this.add.circle(x, y, radius, hex(color), 0.18).setDepth(10);
    const ring = this.add.circle(x, y, radius, hex(color), 0).setStrokeStyle(4, hex(color), 0.8).setDepth(11);
    this.fxLayer.addMultiple([gfx, ring]);
    this.battle.zones.push({ x, y, radius, life, maxLife: life, damage, color, owner, gfx, ring });
  }

  onProjectileEnemy(projectile, enemy) {
    if (!projectile.active || !enemy.active || projectile.meta.owner !== "hero" || projectile.meta.hit.has(enemy)) return;
    projectile.meta.hit.add(enemy);
    enemy.meta.hp -= projectile.meta.damage;
    enemy.meta.slow = Math.max(enemy.meta.slow, 180);
    this.hitFx(enemy.x, enemy.y, projectile.tintTopLeft || 0xffffff);
    playSound("hit");
    projectile.destroy();
  }

  onProjectileHero(projectile, sprite) {
    if (!projectile.active || projectile.meta.owner !== "enemy") return;
    const hero = this.battle.heroes.find((item) => item.sprite === sprite);
    if (!hero || hero.data.down) return;
    this.damageHero(hero, projectile.meta.damage, normalize(sprite.x - projectile.x, sprite.y - projectile.y));
    projectile.destroy();
  }

  onHeroEnemyCollide(heroSprite, enemy) {
    const hero = this.battle.heroes.find((item) => item.sprite === heroSprite);
    if (!hero || hero.data.down || !enemy.active) return;
    const n = normalize(heroSprite.x - enemy.x, heroSprite.y - enemy.y);
    this.damageHero(hero, enemy.meta.damage, n);
  }

  damageHero(hero, amount, n, soft = false) {
    if (hero.data.invuln > 0 || hero.data.down) return;
    hero.data.hp -= amount;
    hero.data.invuln = soft ? 40 : 420;
    hero.sprite.setVelocity(n.x * (soft ? 90 : 260), n.y * (soft ? 90 : 260));
    this.hitFx(hero.sprite.x, hero.sprite.y, 0xee6656);
    if (!soft) this.cameras.main.shake(110, 0.005);
    if (hero.data.hp <= 0) {
      hero.data.hp = 0;
      hero.data.down = true;
      hero.data.revive = 14000;
      hero.sprite.setAlpha(0.38);
      this.floatText(hero.sprite.x, hero.sprite.y - 50, `${CHARACTER_BY_ID[hero.id].name} down`, "#ee6656");
      if (!this.livingHeroes().length) this.endMission(false);
    }
  }

  damageArc(x, y, radius, damage, color) {
    this.addZone(x, y, radius, 150, 0, color, "visual");
    this.battle.enemies.forEach((enemy) => {
      if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < radius + 24) {
        enemy.meta.hp -= damage;
        enemy.meta.stun = Math.max(enemy.meta.stun, 120);
        this.hitFx(enemy.x, enemy.y, hex(color));
      }
    });
  }

  defeatEnemy(enemy) {
    if (!enemy.active) return;
    const isBoss = enemy.meta.boss;
    this.battle.enemies = this.battle.enemies.filter((item) => item !== enemy);
    this.hitFx(enemy.x, enemy.y, hex(enemy.meta.color), isBoss ? 32 : 12);
    enemy.destroy();
    this.battle.kills += 1;
    if (isBoss) {
      this.battle.boss = null;
      this.endMission(true);
    }
  }

  updateBattleFlow() {
    const battle = this.battle;
    if (battle.ended) return;
    const activeEnemies = battle.enemies.filter((enemy) => enemy.active && enemy.meta.hp > 0).length + battle.spawnQueue.length;
    if (!battle.boss && activeEnemies === 0) {
      if (battle.wave < battle.wavesTotal) this.spawnWave();
      else this.spawnBoss();
    }
  }

  endMission(win) {
    if (!this.battle || this.battle.ended) return;
    this.battle.ended = true;
    this.setAttackHeld(false);
    this.cameras.main.shake(win ? 500 : 260, win ? 0.008 : 0.004);
    if (win) playSound("unlock");
    this.handlers.onMissionEnd?.({ win, mission: this.battle.mission, kills: this.battle.kills });
  }

  swapHero() {
    if (!this.battle) return;
    for (let offset = 1; offset <= this.battle.heroes.length; offset += 1) {
      const next = (this.battle.activeIndex + offset) % this.battle.heroes.length;
      if (!this.battle.heroes[next].data.down) {
        this.battle.activeIndex = next;
        this.cameras.main.startFollow(this.battle.heroes[next].sprite, true, 0.08, 0.08);
        this.handlers.onToast?.(CHARACTER_BY_ID[this.battle.heroes[next].id].name);
        playSound("menu");
        return;
      }
    }
  }

  activeHero() {
    return this.battle.heroes[this.battle.activeIndex];
  }

  livingHeroes() {
    return this.battle.heroes.filter((hero) => !hero.data.down && hero.data.hp > 0);
  }

  nearestHero(from) {
    let best = null;
    let bestD = Infinity;
    this.battle.heroes.forEach((hero) => {
      if (hero.data.down) return;
      const d = Phaser.Math.Distance.Between(from.x, from.y, hero.sprite.x, hero.sprite.y);
      if (d < bestD) {
        best = hero;
        bestD = d;
      }
    });
    return best;
  }

  nearestEnemy(from, max = Infinity) {
    let best = null;
    let bestD = max;
    this.battle.enemies.forEach((enemy) => {
      if (!enemy.active || enemy.meta.hp <= 0) return;
      const d = Phaser.Math.Distance.Between(from.x, from.y, enemy.x, enemy.y);
      if (d < bestD) {
        best = enemy;
        bestD = d;
      }
    });
    return best;
  }

  trail(x1, y1, x2, y2, color) {
    for (let i = 0; i < 9; i += 1) {
      const t = i / 8;
      this.hitFx(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, hex(color), 2);
    }
  }

  hitFx(x, y, color, count = 8) {
    for (let i = 0; i < count; i += 1) {
      const p = this.add.circle(x, y, Phaser.Math.Between(3, 7), color, 0.85).setDepth(40);
      this.fxLayer?.add(p);
      const a = Math.random() * TAU;
      gsap.to(p, {
        x: x + Math.cos(a) * Phaser.Math.Between(22, 80),
        y: y + Math.sin(a) * Phaser.Math.Between(22, 80),
        alpha: 0,
        scale: 0.25,
        duration: 0.35 + Math.random() * 0.25,
        ease: "power2.out",
        onComplete: () => p.destroy()
      });
    }
  }

  floatText(x, y, text, color = "#fff1a8") {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: String(text).length > 20 ? "15px" : "21px",
      fontStyle: "900",
      color,
      stroke: "#10151f",
      strokeThickness: 5,
      align: "center"
    }).setOrigin(0.5).setDepth(80);
    this.fxLayer?.add(label);
    gsap.to(label, { y: y - 42, alpha: 0, duration: 1.15, ease: "power2.out", onComplete: () => label.destroy() });
  }

  goodmanChaos() {
    const battle = this.battle;
    this.handlers.onToast?.("Goodman caused chaos");
    const hero = this.activeHero().sprite;
    this.floatText(hero.x, hero.y - 86, "GOODMAN CHAOS", "#fff1a8");
    if (Math.random() < 0.55) {
      battle.enemies.forEach((enemy) => {
        enemy.meta.hp -= 28 + battle.mission.level * 4;
        enemy.meta.stun = Math.max(enemy.meta.stun, 650);
      });
    } else {
      for (let i = 0; i < 3; i += 1) this.spawnEnemy(Phaser.Utils.Array.GetRandom(battle.mission.enemyPool), 0.2);
    }
    this.cameras.main.shake(320, 0.008);
  }

  generateTextures() {
    CHARACTERS.forEach((hero) => this.makeHeroTexture(hero));
    this.makeEnemyTextures();
    this.makeProjectileTextures();
    this.makePropTextures();
    this.makeSentryTextures();
  }

  makeHeroTexture(hero) {
    const g = this.add.graphics();
    g.clear();
    g.fillStyle(0x000000, 0.28).fillEllipse(48, 68, 46, 16);
    if (hero.id === "dan") g.fillStyle(0xfff1a8, 0.32).fillCircle(48, 42, 42);
    g.fillStyle(hex(hero.color), 1).fillRoundedRect(25, 28, 46, 45, 13);
    g.fillStyle(0xf2bc8f, 1).fillCircle(48, 22, 18);
    g.fillStyle(0x232838, 1).fillRect(30, 8, 36, 10).fillCircle(48, 8, 15);
    g.fillStyle(0x10151f, 1).fillCircle(54, 21, 3);
    g.lineStyle(5, 0xf2bc8f, 1).lineBetween(66, 42, 80, 36);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(34, 45, 28, 18, 5);
    g.fillStyle(0x10151f, 1);
    if (hero.id === "mendel") {
      g.lineStyle(5, 0x6d4817, 1).arc(18, 44, 16, 1.4, 4.9).strokePath();
      g.lineStyle(4, 0xfff1a8, 1).arc(75, 36, 12, 0.2, 2.8).strokePath();
    } else if (hero.id === "goodman") {
      g.fillStyle(0xf6e9bf, 1).fillRoundedRect(6, 36, 22, 28, 4).fillRoundedRect(70, 34, 20, 26, 4);
      g.lineStyle(2, 0x10151f, 0.6).lineBetween(10, 44, 24, 44).lineBetween(74, 42, 86, 42);
    } else if (hero.id === "giat") {
      g.fillStyle(0xf5c451, 1).fillRoundedRect(4, 28, 28, 18, 5);
      g.fillStyle(0x10151f, 1).fillCircle(26, 37, 3);
    } else if (hero.id === "aviad" || hero.id === "farber") {
      g.fillStyle(0x4f5d51, 1).fillRect(27, 2, 42, 12);
      g.lineStyle(4, 0xc97848, 1).lineBetween(13, 68, 31, 48);
    } else if (hero.id === "david") {
      g.fillStyle(0x85d6ff, 0.8).fillCircle(75, 22, 9).fillCircle(20, 18, 7);
      g.lineStyle(4, 0xf8f3df, 1).lineBetween(15, 64, 34, 42);
    } else if (hero.id === "amichai") {
      g.fillStyle(0xf8f3df, 1).fillCircle(13, 39, 11).fillCircle(84, 40, 11);
      g.fillStyle(0xfff1a8, 1).fillRoundedRect(70, 2, 19, 11, 5);
    } else if (hero.id === "halel") {
      g.lineStyle(4, 0xd8a5ff, 1).strokeCircle(75, 30, 12).lineBetween(75, 17, 75, 43).lineBetween(62, 30, 88, 30);
    } else if (hero.id === "hadar") {
      g.fillStyle(0x8e44ad, 0.82).fillTriangle(25, 30, 48, 76, 25, 76);
      g.fillStyle(0xfff1a8, 1).fillCircle(78, 22, 7);
    } else if (hero.id === "tal") {
      g.fillStyle(0xf6e9bf, 1).fillRoundedRect(7, 32, 20, 28, 3);
      g.fillStyle(0x55b8dc, 1).fillRoundedRect(68, 31, 24, 18, 3);
    } else if (hero.id === "amit") {
      g.fillStyle(0xf6e9bf, 1).fillRoundedRect(5, 34, 26, 30, 5);
      g.lineStyle(3, 0x8ba3ff, 1).strokeCircle(48, 41, 32);
    } else if (hero.id === "gelman") {
      g.fillStyle(0xf5c451, 1).fillRoundedRect(8, 33, 24, 18, 4).fillRoundedRect(69, 40, 22, 18, 4);
    } else if (hero.id === "kuzar") {
      g.fillStyle(0x68c58a, 1).fillCircle(18, 62, 10);
      g.fillStyle(0x10151f, 1).fillCircle(18, 62, 3);
    } else if (hero.id === "bruiner") {
      g.fillStyle(0xfff1a8, 1).fillRect(67, 8, 18, 5).fillRect(77, 0, 15, 5);
      g.fillStyle(0xb78cff, 0.55).fillEllipse(48, 65, 54, 16);
    } else if (hero.id === "dan") {
      g.lineStyle(5, 0xfff1a8, 0.9).strokeCircle(48, 42, 41);
      g.fillStyle(0xffffff, 1).fillTriangle(48, 0, 58, 18, 38, 18);
    }
    g.generateTexture(`hero-${hero.id}`, 96, 86);
    g.destroy();
  }

  makeEnemyTextures() {
    Object.entries(ENEMIES).forEach(([, enemy]) => {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.28).fillEllipse(38, 54, 42, 14);
      if (enemy.texture === "enemy-monkey") {
        g.fillStyle(0x9b6a3f, 1).fillCircle(38, 36, 22).fillCircle(22, 24, 9).fillCircle(56, 24, 9);
        g.fillStyle(0xf5c451, 1).fillEllipse(38, 43, 23, 15);
        g.lineStyle(4, 0x6d4817, 1).arc(60, 48, 16, 0.2, 2.5).strokePath();
      } else if (enemy.texture === "enemy-vine") {
        g.fillStyle(0x304d2c, 1).fillRoundedRect(18, 14, 40, 46, 16);
        g.lineStyle(5, 0x6bbf6a, 1).lineBetween(20, 43, 56, 21).lineBetween(56, 43, 20, 21);
        g.fillStyle(0x8e44ad, 1).fillCircle(38, 22, 7);
      } else if (enemy.texture === "enemy-grape") {
        g.fillStyle(0x7a3db8, 1).fillCircle(31, 27, 14).fillCircle(45, 27, 14).fillCircle(38, 41, 16);
        g.fillStyle(0x6bbf6a, 1).fillEllipse(38, 12, 20, 8);
      } else if (enemy.texture === "enemy-guard") {
        g.fillStyle(0x3c314f, 1).fillRoundedRect(16, 15, 44, 46, 8);
        g.fillStyle(0xb68cff, 1).fillRect(19, 15, 38, 12).fillTriangle(14, 15, 38, 1, 62, 15);
        g.lineStyle(4, 0xf8f3df, 0.7).lineBetween(18, 50, 58, 30);
      } else if (enemy.texture === "enemy-beast") {
        g.fillStyle(0x20152f, 1).fillCircle(38, 37, 24);
        g.fillStyle(0xdf7ca4, 0.85).fillTriangle(16, 19, 25, 1, 32, 20).fillTriangle(45, 20, 54, 1, 61, 19);
        g.lineStyle(5, 0x4d2666, 1).lineBetween(16, 48, 1, 62).lineBetween(60, 48, 75, 62);
      } else if (enemy.texture === "enemy-assistant") {
        g.fillStyle(0xe8d8ad, 1).fillRoundedRect(17, 15, 42, 44, 7);
        g.fillStyle(0xf8f3df, 1).fillRoundedRect(23, 20, 30, 28, 4);
        g.lineStyle(2, 0x10151f, 0.55).lineBetween(27, 28, 49, 28).lineBetween(27, 36, 46, 36);
      } else if (enemy.texture === "enemy-tank") {
        g.fillStyle(0x56307a, 1).fillRoundedRect(10, 22, 56, 34, 10);
        g.fillStyle(0x8e44ad, 1).fillCircle(36, 37, 18);
        g.lineStyle(6, 0x20152f, 1).lineBetween(49, 36, 73, 30);
      } else {
        g.fillStyle(hex(enemy.color), 1).fillRoundedRect(15, 13, 46, 46, enemy.mode === "ranged" ? 5 : 20);
        g.fillStyle(0x10151f, 0.72).fillRect(25, 32, 28, 6);
      }
      g.fillStyle(0x10151f, 1).fillCircle(31, 30, 3).fillCircle(45, 30, 3);
      g.generateTexture(enemy.texture, 76, 70);
      g.destroy();
    });
    this.makeBossTexture("boss-generic", 0x6c7588, "B");
    this.makeBossTexture("boss-kashi", 0x596276, "K", true);
  }

  makeBossTexture(key, color, letter, crown = false) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.34).fillEllipse(56, 88, 70, 20);
    if (crown) {
      g.fillStyle(0x20152f, 1).fillTriangle(10, 28, 34, 102, 55, 34).fillTriangle(102, 28, 78, 102, 57, 34);
      g.fillStyle(0x8e44ad, 0.72).fillCircle(56, 67, 42);
    }
    g.fillStyle(color, 1).fillRoundedRect(24, 30, 64, 70, 16);
    g.fillStyle(0xf2bc8f, 1).fillCircle(56, 24, 24);
    if (crown) {
      g.fillStyle(0xf5c451, 1).fillTriangle(28, 10, 42, -4, 50, 12).fillTriangle(48, 10, 62, -8, 72, 12).fillTriangle(68, 10, 84, -2, 88, 12);
      g.fillStyle(0x8e44ad, 1).fillCircle(44, 12, 5).fillCircle(62, 10, 5).fillCircle(76, 12, 5);
      g.fillStyle(0x10151f, 1).fillCircle(49, 23, 4).fillCircle(63, 23, 4);
    }
    g.fillStyle(0xf8f3df, 1).fillRoundedRect(34, 53, 42, 28, 5);
    if (crown) {
      g.lineStyle(3, 0x8e44ad, 0.8).lineBetween(39, 61, 72, 61).lineBetween(39, 70, 68, 70);
    }
    g.fillStyle(0x10151f, 1);
    g.generateTexture(key, 112, 112);
    g.destroy();
  }

  makeProjectileTextures() {
    const defs = [
      ["proj-banana", 0xf5c451, "banana"], ["proj-paper", 0xf6e9bf, "paper"], ["proj-sheet", 0x68c58a, "paper"],
      ["proj-wrench", 0xc97848, "wrench"], ["proj-money", 0xf5c451, "$"], ["proj-coupon", 0x68c58a, "%"],
      ["proj-question", 0x55b8dc, "?"], ["proj-ball", 0xf8f3df, "ball"], ["proj-ai", 0x43c9c9, "AI"],
      ["proj-calm", 0x8ba3ff, "!"], ["proj-spray", 0xff9fc0, "~"], ["proj-blessing", 0xfff1a8, "+"],
      ["proj-ice", 0x85d6ff, "*"], ["proj-punch", 0xff8f52, "punch"], ["proj-focus", 0xd8a5ff, "focus"],
      ["proj-confusion", 0xff9fc0, "?"], ["proj-scroll", 0xf6e9bf, "scroll"], ["proj-agig", 0x68c58a, "AG"],
      ["proj-sleep", 0xb78cff, "Z"], ["proj-grape", 0x8e44ad, "grape"], ["proj-darkgrape", 0x20152f, "grape"]
    ];
    defs.forEach(([key, color, label]) => {
      const g = this.add.graphics();
      if (label === "banana") {
        g.lineStyle(8, 0x6d4817, 1).arc(24, 18, 18, 0.25, 2.65).strokePath();
        g.lineStyle(5, 0xfff1a8, 1).arc(24, 15, 16, 0.28, 2.55).strokePath();
      } else if (label === "ball") {
        g.fillStyle(color, 1).fillCircle(24, 24, 18);
        g.lineStyle(2, 0x10151f, 0.8).strokeCircle(24, 24, 18).lineBetween(7, 24, 41, 24).lineBetween(24, 7, 24, 41);
      } else if (label === "grape") {
        g.fillStyle(color, 1).fillCircle(24, 25, 16);
        g.fillStyle(0x6bbf6a, 1).fillEllipse(24, 9, 18, 8);
      } else if (label === "punch") {
        g.fillStyle(color, 1).fillRoundedRect(10, 16, 30, 24, 10).fillCircle(17, 15, 7).fillCircle(26, 13, 7).fillCircle(34, 16, 7);
      } else if (label === "focus") {
        g.lineStyle(4, color, 1).strokeCircle(24, 24, 18).lineBetween(24, 4, 24, 44).lineBetween(4, 24, 44, 24);
      } else if (label === "scroll") {
        g.fillStyle(color, 1).fillRoundedRect(11, 10, 26, 30, 4);
        g.fillStyle(0xc97848, 1).fillCircle(11, 25, 6).fillCircle(37, 25, 6);
      } else if (label === "wrench") {
        g.lineStyle(8, color, 1).lineBetween(12, 34, 34, 12);
        g.fillStyle(color, 1).fillCircle(37, 10, 8).fillCircle(10, 36, 6);
      } else {
        g.fillStyle(color, 1).fillRoundedRect(8, 12, 32, 24, 5);
        g.lineStyle(2, 0x10151f, 0.5).strokeRoundedRect(8, 12, 32, 24, 5);
      }
      g.generateTexture(key, 48, 48);
      g.destroy();
    });
  }

  makePropTextures() {
    const make = (key, draw) => {
      const g = this.add.graphics();
      draw(g);
      g.generateTexture(key, 96, 96);
      g.destroy();
    };
    make("prop-tree", (g) => {
      g.fillStyle(0x6a3f1d, 1).fillRoundedRect(42, 38, 12, 42, 5);
      g.fillStyle(0x1b7b4d, 1).fillCircle(48, 30, 30).fillCircle(26, 40, 22).fillCircle(70, 42, 24);
    });
    make("prop-grapevine", (g) => {
      g.lineStyle(8, 0x3d7a37, 1).lineBetween(18, 72, 48, 24).lineBetween(48, 24, 78, 72);
      g.fillStyle(0x8e44ad, 1).fillCircle(39, 40, 9).fillCircle(51, 41, 9).fillCircle(45, 53, 9);
      g.fillStyle(0x6bbf6a, 1).fillEllipse(30, 35, 20, 9).fillEllipse(64, 35, 20, 9);
    });
    make("prop-darkvine", (g) => {
      g.lineStyle(9, 0x20152f, 1).lineBetween(18, 74, 50, 18).lineBetween(50, 18, 82, 76);
      g.fillStyle(0x4d2666, 1).fillCircle(43, 42, 10).fillCircle(56, 42, 10).fillCircle(49, 55, 10);
      g.fillStyle(0xdf7ca4, 0.75).fillTriangle(20, 54, 34, 42, 32, 66).fillTriangle(72, 54, 58, 42, 60, 66);
    });
    make("prop-crate", (g) => {
      g.fillStyle(0x8b5a36, 1).fillRoundedRect(18, 24, 60, 50, 7);
      g.lineStyle(4, 0x4a2c17, 0.7).lineBetween(22, 49, 74, 49).lineBetween(48, 27, 48, 72);
    });
    make("prop-window", (g) => {
      g.fillStyle(0x8bd6ff, 0.85).fillRoundedRect(18, 18, 60, 58, 7);
      g.lineStyle(4, 0xf8f3df, 0.8).strokeRoundedRect(18, 18, 60, 58, 7).lineBetween(48, 18, 48, 76).lineBetween(18, 47, 78, 47);
    });
    make("prop-washer", (g) => {
      g.fillStyle(0xf8f3df, 1).fillRoundedRect(18, 14, 60, 70, 8);
      g.fillStyle(0x55b8dc, 1).fillCircle(48, 50, 22);
      g.fillStyle(0x10151f, 0.3).fillCircle(48, 50, 13);
    });
    make("prop-office", (g) => {
      g.fillStyle(0x596276, 1).fillRoundedRect(24, 10, 48, 80, 5);
      g.fillStyle(0x68c58a, 0.8);
      for (let y = 18; y < 76; y += 14) g.fillRect(32, y, 12, 8).fillRect(52, y, 12, 8);
    });
    make("npc-goodman", (g) => {
      g.fillStyle(0xee6656, 1).fillCircle(48, 32, 21).fillRoundedRect(28, 48, 40, 38, 8);
      g.fillStyle(0x10151f, 1).fillCircle(40, 30, 3).fillCircle(56, 30, 3);
      g.lineStyle(5, 0xfff1a8, 1).lineBetween(24, 55, 10, 42).lineBetween(72, 55, 90, 43);
    });
    make("npc-giat", (g) => {
      g.fillStyle(0x55b8dc, 1).fillCircle(48, 32, 21).fillRoundedRect(29, 49, 38, 35, 8);
      g.fillStyle(0xfff1a8, 1).fillCircle(75, 20, 12);
      g.fillStyle(0x10151f, 1);
    });
    make("npc-bruiner", (g) => {
      g.fillStyle(0x9b78de, 1).fillRoundedRect(20, 48, 58, 26, 13);
      g.fillStyle(0xf2bc8f, 1).fillCircle(25, 44, 14);
      g.fillStyle(0xfff1a8, 1);
      g.fillRect(58, 20, 20, 5).fillRect(70, 10, 18, 5);
    });
  }

  makeSentryTextures() {
    const g = this.add.graphics();
    g.fillStyle(0xc97848, 1).fillRoundedRect(16, 22, 32, 30, 6);
    g.fillStyle(0x10151f, 1).fillRect(29, 8, 6, 18);
    g.generateTexture("sentry-wrench", 64, 64);
    g.clear();
    g.fillStyle(0x43c9c9, 1).fillCircle(32, 32, 22);
    g.fillStyle(0x10151f, 1);
    g.generateTexture("sentry-ai", 64, 64);
    g.destroy();
  }
}

export function createDanQuestGame(parent, handlers) {
  const scene = new DanQuestScene(handlers);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#10151f",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [scene],
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    }
  });
  return { game, scene };
}
