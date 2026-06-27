"use strict";

const STORAGE_KEY = "infinite_runner_factory_save_v1";
const SAVE_VERSION = 1;

const upgradeDefs = [
  { id: "speed", name: "スピード", base: 10, growth: 2, currency: "coins", effect: (lv) => `速度 +${Math.round(lv * 2)}%` },
  { id: "jump", name: "ジャンプ", base: 15, growth: 1.85, currency: "coins", effect: (lv) => `跳躍 +${Math.round(lv * 4)}%` },
  { id: "hp", name: "HP", base: 50, growth: 2.1, currency: "coins", effect: (lv) => `最大HP ${1 + lv}` },
  { id: "coin", name: "コイン倍率", base: 25, growth: 2, currency: "coins", effect: (lv) => `獲得 +${Math.round(lv * 15)}%` },
  { id: "magnet", name: "磁石", base: 80, growth: 1.95, currency: "coins", effect: (lv) => `吸収範囲 +${lv * 14}` },
  { id: "dash", name: "ダッシュ", base: 120, growth: 2.05, currency: "coins", effect: (lv) => `持続 +${(lv * 0.18).toFixed(1)}秒` },
  { id: "regen", name: "自動回復", base: 200, growth: 2.15, currency: "coins", effect: (lv) => lv ? `${Math.max(10, 32 - lv * 2)}秒ごと` : "未開放" },
  { id: "combo", name: "コンボ倍率", base: 160, growth: 2, currency: "coins", effect: (lv) => `上限 x${(2 + lv * 0.15).toFixed(2)}` },
  { id: "chest", name: "宝箱率", base: 300, growth: 2.05, currency: "coins", effect: (lv) => `出現 +${Math.round(lv * 3)}%` },
  { id: "item", name: "アイテム出現率", base: 250, growth: 2.05, currency: "coins", effect: (lv) => `出現 +${Math.round(lv * 4)}%` }
];

const factoryDefs = [
  { id: "coinFactory", name: "コイン工場", base: 500, growth: 1.18, currency: "coins", effect: (lv) => `${formatNumber(idleCoinPerSecond(lv))}/秒` },
  { id: "mine", name: "鉱山", base: 2500, growth: 1.22, currency: "coins", effect: (lv) => `${formatNumber(idleGemPerSecond(lv), 2)}/秒` },
  { id: "lab", name: "研究所", base: 4, growth: 1.2, currency: "gems", effect: (lv) => `${formatNumber(idleResearchPerSecond(lv), 2)}/秒` },
  { id: "robotFactory", name: "ロボット工場", base: 7000, growth: 1.24, currency: "coins", effect: (lv) => `${formatNumber(autoRunnerMeters(lv))}m級` }
];

const permanentDefs = [
  { id: "coin", name: "獲得コイン", base: 1, growth: 1.35, effect: (lv) => `+${lv * 5}%` },
  { id: "speed", name: "速度", base: 1, growth: 1.45, effect: (lv) => `+${lv * 2}%` },
  { id: "ad", name: "広告倍率", base: 2, growth: 1.5, effect: (lv) => `+${lv * 20}%` },
  { id: "rarity", name: "レア率", base: 2, growth: 1.55, effect: (lv) => `+${lv}%` },
  { id: "chest", name: "宝箱速度", base: 2, growth: 1.5, effect: (lv) => `+${lv * 5}%` }
];

const researchDefs = [
  { id: "jumpStudy", name: "ジャンプ研究", base: 10, growth: 1.28, effect: (lv) => `空中制御 +${lv * 2}%` },
  { id: "speedStudy", name: "速度研究", base: 12, growth: 1.28, effect: (lv) => `速度 +${lv * 1}%` },
  { id: "idleStudy", name: "放置研究", base: 14, growth: 1.3, effect: (lv) => `工場出力 +${lv * 4}%` },
  { id: "bossStudy", name: "ボス研究", base: 18, growth: 1.32, effect: (lv) => `ボス報酬 +${lv * 6}%` },
  { id: "comboStudy", name: "コンボ研究", base: 16, growth: 1.3, effect: (lv) => `倍率成長 +${lv * 3}%` }
];

const areas = [
  { name: "草原", line: "Grassland Line", start: 0, sky: ["#81c7e8", "#d6f3ff"], ground: "#61a64f", accent: "#f2cf5a", obstacle: "#8a6a45" },
  { name: "砂漠", line: "Dune Engine", start: 1000, sky: ["#f1c274", "#ffe7a8"], ground: "#c78942", accent: "#5cb8b2", obstacle: "#9c6a32" },
  { name: "雪山", line: "Frost Conveyor", start: 3000, sky: ["#9bbbe0", "#f4fbff"], ground: "#d9ecf7", accent: "#48bde7", obstacle: "#60798d" },
  { name: "火山", line: "Lava Belt", start: 7000, sky: ["#4a2530", "#d45d43"], ground: "#53312d", accent: "#ffb238", obstacle: "#2d2527" },
  { name: "未来都市", line: "Neon Loop", start: 15000, sky: ["#17213b", "#246c9d"], ground: "#2c3948", accent: "#7af0d2", obstacle: "#5461b9" },
  { name: "宇宙", line: "Orbital Track", start: 30000, sky: ["#080b1a", "#1c2750"], ground: "#29314a", accent: "#f1efff", obstacle: "#7a7fa4" },
  { name: "ブラックホール", line: "Singularity Rail", start: 60000, sky: ["#050508", "#30214f"], ground: "#171320", accent: "#b98cff", obstacle: "#4c3b72" },
  { name: "神界", line: "Aether Road", start: 100000, sky: ["#e5d9ff", "#9fd9ff"], ground: "#e8e1b8", accent: "#f4cc5f", obstacle: "#b99067" },
  { name: "無限空間", line: "Infinite Span", start: 160000, sky: ["#11151d", "#2e465b"], ground: "#24313a", accent: "#4cc38a", obstacle: "#394859" }
];

const chestDefs = {
  wood: { name: "木", seconds: 30, color: "#a97942", weight: 56 },
  silver: { name: "銀", seconds: 300, color: "#aeb7c2", weight: 28 },
  gold: { name: "金", seconds: 1800, color: "#e7b84d", weight: 12 },
  rainbow: { name: "虹", seconds: 28800, color: "#b98cff", weight: 3 },
  god: { name: "神", seconds: 28800, color: "#fff1a5", weight: 1 }
};

const rarityDefs = [
  { id: "N", rank: 1, colorClass: "rarity-n", weight: 50 },
  { id: "R", rank: 2, colorClass: "rarity-r", weight: 25 },
  { id: "SR", rank: 3, colorClass: "rarity-sr", weight: 14 },
  { id: "SSR", rank: 4, colorClass: "rarity-ssr", weight: 7 },
  { id: "UR", rank: 5, colorClass: "rarity-ur", weight: 3 },
  { id: "LR", rank: 6, colorClass: "rarity-lr", weight: 1 }
];

const slots = ["頭", "靴", "胴", "アクセサリー"];
const statNames = {
  speed: "速度",
  jump: "跳躍",
  coin: "コイン",
  hp: "HP",
  idle: "放置"
};

const dailyMissionDefs = [
  { id: "dailyDistance", name: "500m走る", target: 500, reward: { coins: 300 } },
  { id: "dailyCoins", name: "コイン1000枚", target: 1000, reward: { gems: 1 } },
  { id: "dailyChest", name: "宝箱1個", target: 1, reward: { coins: 750 } },
  { id: "dailyEnemies", name: "敵20体", target: 20, reward: { coins: 600 } }
];

const weeklyMissionDefs = [
  { id: "weeklyDistance", name: "100000m走る", target: 100000, reward: { gems: 15, research: 5 } },
  { id: "weeklyBoss", name: "ボス20体", target: 20, reward: { gems: 10, research: 8 } },
  { id: "weeklyPrestige", name: "転生1回", target: 1, reward: { research: 20 } }
];

const achievementDefs = [
  { id: "firstJump", name: "初ジャンプ", condition: (s) => s.stats.jumps >= 1, reward: { coins: 50 } },
  { id: "m1000", name: "1000m", condition: (s) => s.bestDistance >= 1000, reward: { coins: 1000, gems: 1 } },
  { id: "m100000", name: "100000m", condition: (s) => s.totalDistance >= 100000, reward: { gems: 30, research: 20 } },
  { id: "lv100", name: "Lv100", condition: (s) => s.level >= 100, reward: { research: 50 } },
  { id: "firstPrestige", name: "転生", condition: (s) => s.prestigeCount >= 1, reward: { gems: 10 } }
];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const panelContent = document.getElementById("panelContent");
const eventLog = document.getElementById("eventLog");
const runOverlay = document.getElementById("runOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

let state = loadState();
let activeTab = "upgrades";
let canvasWidth = 960;
let canvasHeight = 420;
let groundY = 340;
let lastFrame = performance.now();
let autosaveTimer = 0;
let uiTimer = 0;
let messageTimer = 0;

const player = {
  x: 112,
  y: 0,
  w: 36,
  h: 48,
  vy: 0,
  jumpsUsed: 0,
  slideTimer: 0,
  invulnerable: 0,
  regenTimer: 0
};

const run = {
  active: true,
  gameOver: false,
  distance: 0,
  hp: 1,
  combo: 0,
  dashTimer: 0,
  dashCooldown: 0,
  skillShield: 0,
  timeStop: 0,
  nextSpawn: 0.4,
  nextBossMark: 1000,
  event: null,
  eventTimer: 0,
  eventCooldown: 50,
  gravityFlip: false,
  sessionCoins: 0,
  sessionEnemies: 0,
  sessionBosses: 0,
  sessionChests: 0
};

let objects = [];
let particles = [];

init();

function init() {
  applyOfflineProgress();
  ensureMissions();
  resetRun();
  bindEvents();
  resizeCanvas();
  renderPanel();
  updateHud();
  logEvent("RUN START");
  requestAnimationFrame(loop);
}

function defaultState() {
  return {
    version: SAVE_VERSION,
    coins: 0,
    gems: 0,
    research: 0,
    xp: 0,
    level: 1,
    totalDistance: 0,
    bestDistance: 0,
    lifetimeCoins: 0,
    lifetimeEnemies: 0,
    lifetimeBosses: 0,
    runs: 0,
    prestigePoints: 0,
    spentPrestigePoints: 0,
    prestigeCount: 0,
    upgrades: objectFromDefs(upgradeDefs),
    factories: objectFromDefs(factoryDefs),
    permanent: objectFromDefs(permanentDefs),
    researchTree: objectFromDefs(researchDefs),
    equipment: [],
    equipped: {},
    chests: [],
    achievements: {},
    missions: null,
    boosts: {
      coinDouble: 0
    },
    stats: {
      jumps: 0,
      chestsOpened: 0,
      adsWatched: 0
    },
    lastSavedAt: Date.now()
  };
}

function objectFromDefs(defs) {
  return defs.reduce((acc, def) => {
    acc[def.id] = 0;
    return acc;
  }, {});
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return mergeDefaults(JSON.parse(raw), defaultState());
  } catch (error) {
    console.warn(error);
    return defaultState();
  }
}

function mergeDefaults(saved, fallback) {
  if (!saved || typeof saved !== "object") return fallback;
  for (const key of Object.keys(fallback)) {
    if (saved[key] === undefined) {
      saved[key] = fallback[key];
    } else if (
      fallback[key] &&
      typeof fallback[key] === "object" &&
      !Array.isArray(fallback[key])
    ) {
      saved[key] = mergeDefaults(saved[key], fallback[key]);
    }
  }
  return saved;
}

function saveState() {
  state.lastSavedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  flashButton("saveBtn");
  logEvent("SAVED");
}

function applyOfflineProgress() {
  const now = Date.now();
  const elapsed = Math.max(0, Math.min(8 * 60 * 60, (now - (state.lastSavedAt || now)) / 1000));
  if (elapsed < 5) return;

  const before = {
    coins: state.coins,
    gems: state.gems,
    research: state.research
  };

  tickIdle(elapsed);
  tickChestTimers(elapsed);
  state.boosts.coinDouble = Math.max(0, state.boosts.coinDouble - elapsed);
  const gained = state.coins - before.coins;
  if (gained > 0) logEvent(`OFFLINE +${formatNumber(gained)} COIN`);
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);

  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      jump();
    }
    if (event.code === "ArrowDown") {
      event.preventDefault();
      slide();
    }
    if (event.code === "KeyD") {
      event.preventDefault();
      dash();
    }
  });

  document.getElementById("jumpBtn").addEventListener("click", jump);
  document.getElementById("slideBtn").addEventListener("click", slide);
  document.getElementById("dashBtn").addEventListener("click", dash);
  document.getElementById("restartBtn").addEventListener("click", restartFromButton);
  document.getElementById("overlayRestart").addEventListener("click", restartFromButton);
  document.getElementById("saveBtn").addEventListener("click", saveState);

  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener("pointerdown", (event) => {
    touchStartX = event.clientX;
    touchStartY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", (event) => {
    const dx = event.clientX - touchStartX;
    const dy = event.clientY - touchStartY;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 22) {
      if (dy < 0) jump();
      else slide();
    } else {
      jump();
    }
  });

  document.querySelector(".tab-bar").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (!button) return;
    activeTab = button.dataset.tab;
    document.querySelectorAll(".tab-bar button").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === activeTab);
    });
    renderPanel();
  });

  panelContent.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "buyUpgrade") buyUpgrade(id);
    if (action === "buyFactory") buyFactory(id);
    if (action === "buyPermanent") buyPermanent(id);
    if (action === "buyResearch") buyResearch(id);
    if (action === "prestige") prestige();
    if (action === "openChest") openChest(id);
    if (action === "equip") equipItem(id);
    if (action === "claimDaily") claimMission("daily", id);
    if (action === "claimWeekly") claimMission("weekly", id);
    if (action === "claimAchievement") claimAchievement(id);
    if (action === "adCoin") activateCoinAd();
    if (action === "adChest") finishFirstChest();
    if (action === "adGacha") freeGacha();
    renderPanel();
    updateHud();
  });

  window.addEventListener("beforeunload", () => {
    state.lastSavedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  groundY = canvasHeight - 62;
  if (!Number.isFinite(player.y) || player.y === 0) {
    player.y = groundY - player.h;
  }
}

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  ensureMissions();
  tickIdle(dt);
  tickChestTimers(dt);
  tickBoosts(dt);
  checkAchievements();

  if (messageTimer > 0) messageTimer -= dt;

  if (!run.gameOver) {
    updateRun(dt);
  }

  autosaveTimer += dt;
  uiTimer += dt;
  if (autosaveTimer >= 12) {
    autosaveTimer = 0;
    state.lastSavedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  if (uiTimer >= 0.2) {
    uiTimer = 0;
    updateHud();
    if (activeTab === "equipment" || activeTab === "missions" || activeTab === "prestige") {
      renderPanel();
    }
  }
}

function updateRun(dt) {
  const stats = getStats();
  const dashMult = run.dashTimer > 0 ? 1.9 : 1;
  const eventSpeed = run.event === "fever" ? 1.25 : 1;
  const stopped = run.timeStop > 0;
  const speedMeters = stats.speed * dashMult * eventSpeed;
  const scrollSpeed = stopped ? 0 : speedMeters * 48;

  run.distance += speedMeters * dt;
  state.totalDistance += speedMeters * dt;
  addMissionProgress("dailyDistance", speedMeters * dt);
  addMissionProgress("weeklyDistance", speedMeters * dt);

  run.nextBossMark = Math.max(run.nextBossMark, 1000);
  if (run.distance >= run.nextBossMark) {
    spawnBoss();
    run.nextBossMark += 1000;
  }

  run.nextSpawn -= dt;
  if (run.nextSpawn <= 0 && !stopped) {
    spawnSegment(stats);
    run.nextSpawn = random(0.5, Math.max(0.95, 1.35 - Math.min(0.55, stats.speed / 42)));
  }

  updatePlayer(dt, stats);
  updateObjects(dt, scrollSpeed, stats);
  updateParticles(dt);
  updateEvent(dt);

  if (run.dashTimer > 0) run.dashTimer -= dt;
  if (run.dashCooldown > 0) run.dashCooldown -= dt;
  if (run.skillShield > 0) run.skillShield -= dt;
  if (run.timeStop > 0) run.timeStop -= dt;
  if (player.invulnerable > 0) player.invulnerable -= dt;

  if (stats.regenEvery > 0) {
    player.regenTimer += dt;
    if (player.regenTimer >= stats.regenEvery && run.hp < stats.maxHp) {
      player.regenTimer = 0;
      run.hp += 1;
      logEvent("HP RECOVERED");
    }
  }

  state.bestDistance = Math.max(state.bestDistance, run.distance);
}

function updatePlayer(dt, stats) {
  const gravity = run.gravityFlip ? -1200 : 1200;
  const ceilingY = 34;
  const targetGround = run.gravityFlip ? ceilingY : groundY - getPlayerHeight();

  player.slideTimer = Math.max(0, player.slideTimer - dt);
  player.vy += gravity * dt;
  player.y += player.vy * dt;

  if (!run.gravityFlip) {
    if (player.y >= targetGround) {
      player.y = targetGround;
      player.vy = 0;
      player.jumpsUsed = 0;
    }
  } else if (player.y <= targetGround) {
    player.y = targetGround;
    player.vy = 0;
    player.jumpsUsed = 0;
  }

  const controlBonus = 1 + state.researchTree.jumpStudy * 0.02;
  if (player.jumpsUsed > 0) {
    player.vy += (run.gravityFlip ? -1 : 1) * 12 * stats.jumpPower * controlBonus * dt;
  }
}

function updateObjects(dt, scrollSpeed, stats) {
  const magnetRadius = stats.magnetRadius * (run.event === "coinRain" ? 1.35 : 1);
  const playerRect = getPlayerRect();
  const removed = new Set();

  for (const obj of objects) {
    obj.x -= scrollSpeed * dt;

    if ((obj.type === "coin" || obj.type === "rare" || obj.type === "chest" || obj.type === "item") && magnetRadius > 0) {
      const dx = player.x + player.w / 2 - (obj.x + obj.w / 2);
      const dy = player.y + getPlayerHeight() / 2 - (obj.y + obj.h / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < magnetRadius) {
        obj.x += (dx / Math.max(1, dist)) * 360 * dt;
        obj.y += (dy / Math.max(1, dist)) * 360 * dt;
      }
    }

    if (rectsOverlap(playerRect, obj)) {
      if (obj.type === "coin") {
        collectCoin(obj.value, obj.x, obj.y);
        removed.add(obj);
      } else if (obj.type === "rare") {
        collectRare(obj.kind, obj.x, obj.y);
        removed.add(obj);
      } else if (obj.type === "chest") {
        addChest(obj.chestType);
        removed.add(obj);
      } else if (obj.type === "item") {
        activateItem(obj.kind);
        removed.add(obj);
      } else if (obj.type === "obstacle") {
        if (isInvincible() || run.event === "clearPath") {
          burst(obj.x, obj.y, "#f2b84b", 9);
          removed.add(obj);
          gainCombo(1);
        } else {
          damagePlayer();
          obj.x -= 80;
        }
      } else if (obj.type === "enemy") {
        if (canStomp(obj) || isInvincible()) {
          defeatEnemy(obj);
          removed.add(obj);
        } else {
          damagePlayer();
          obj.x -= 85;
        }
      } else if (obj.type === "boss") {
        if (canStomp(obj) || isInvincible()) {
          obj.hp -= isInvincible() ? 2 : 1;
          player.vy = run.gravityFlip ? 480 : -480;
          burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#ef6b65", 14);
          gainCombo(3);
          if (obj.hp <= 0) {
            defeatBoss(obj);
            removed.add(obj);
          }
        } else {
          damagePlayer();
          obj.x -= 90;
        }
      }
    }
  }

  objects = objects.filter((obj) => obj.x > -220 && !removed.has(obj));
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

function updateEvent(dt) {
  if (run.eventTimer > 0) {
    run.eventTimer -= dt;
    if (run.eventTimer <= 0) {
      const ended = run.event;
      run.event = null;
      run.gravityFlip = false;
      logEvent(`${eventName(ended)} END`);
    }
    return;
  }

  run.eventCooldown -= dt;
  if (run.eventCooldown <= 0) {
    startRandomEvent();
    run.eventCooldown = random(55, 100);
  }
}

function spawnSegment(stats) {
  const area = currentArea();
  const roll = Math.random();
  const baseX = canvasWidth + random(30, 90);
  const coinRain = run.event === "coinRain" || run.event === "coin3";

  if (coinRain || roll < 0.42) {
    spawnCoinLine(baseX, Math.random() < 0.35);
  }

  if (run.event === "clearPath") return;

  if (roll > 0.23 && roll < 0.74) {
    spawnObstacleOrEnemy(baseX + random(120, 220), area);
  }

  const chestChance = 0.035 + state.upgrades.chest * 0.003 + state.permanent.chest * 0.001;
  if (Math.random() < chestChance || run.event === "chestRush") {
    spawnChest(baseX + random(260, 380));
  }

  const itemChance = 0.04 + state.upgrades.item * 0.004;
  if (Math.random() < itemChance) {
    spawnItem(baseX + random(180, 320));
  }
}

function spawnCoinLine(startX, arc) {
  const values = [1, 5, 10, 50, 100];
  const value = weightedPick([
    { value: 1, weight: 56 },
    { value: 5, weight: 24 },
    { value: 10, weight: 13 },
    { value: 50, weight: 5 },
    { value: 100, weight: 2 }
  ]);
  const count = run.event === "coinRain" ? 10 : randomInt(4, 7);
  for (let i = 0; i < count; i++) {
    const y = arc
      ? groundY - 120 - Math.sin(i / Math.max(1, count - 1) * Math.PI) * 78
      : groundY - random(80, 160);
    objects.push({
      type: "coin",
      x: startX + i * 38,
      y,
      w: 20,
      h: 20,
      value: values.includes(value) ? value : 1,
      spin: Math.random() * Math.PI
    });
  }

  if (Math.random() < 0.025 + state.permanent.rarity * 0.01) {
    objects.push({
      type: "rare",
      kind: weightedPick([
        { value: "rainbow", weight: 65 },
        { value: "diamond", weight: 25 },
        { value: "gem", weight: 10 }
      ]),
      x: startX + count * 38 + 18,
      y: groundY - random(120, 210),
      w: 24,
      h: 24
    });
  }
}

function spawnObstacleOrEnemy(x, area) {
  const kind = weightedPick([
    { value: "crate", weight: 28 },
    { value: "spike", weight: 24 },
    { value: "laser", weight: 14 },
    { value: "slime", weight: 18 },
    { value: "bird", weight: 10 },
    { value: "bomb", weight: 6 }
  ]);

  if (kind === "slime" || kind === "bird" || kind === "bomb") {
    const airborne = kind === "bird";
    objects.push({
      type: "enemy",
      kind,
      x,
      y: airborne ? groundY - 150 : groundY - 38,
      w: airborne ? 42 : 40,
      h: airborne ? 28 : 38,
      color: kind === "bird" ? area.accent : kind === "bomb" ? "#30333c" : "#75d05e"
    });
    return;
  }

  if (kind === "laser") {
    objects.push({
      type: "obstacle",
      kind,
      x,
      y: groundY - 118,
      w: 26,
      h: 78,
      color: "#ef6b65"
    });
    return;
  }

  const height = kind === "spike" ? 42 : randomInt(44, 70);
  objects.push({
    type: "obstacle",
    kind,
    x,
    y: groundY - height,
    w: kind === "spike" ? 48 : 44,
    h: height,
    color: area.obstacle
  });
}

function spawnChest(x) {
  const chestType = weightedPick(Object.entries(chestDefs).map(([value, def]) => ({ value, weight: def.weight })));
  objects.push({
    type: "chest",
    chestType,
    x,
    y: groundY - 34,
    w: 40,
    h: 32
  });
}

function spawnItem(x) {
  const kind = weightedPick([
    { value: "dash", weight: 24 },
    { value: "shield", weight: 22 },
    { value: "giant", weight: 15 },
    { value: "magnet", weight: 18 },
    { value: "time", weight: 10 },
    { value: "doubleJump", weight: 11 }
  ]);
  objects.push({
    type: "item",
    kind,
    x,
    y: groundY - random(95, 170),
    w: 26,
    h: 26
  });
}

function spawnBoss() {
  const area = currentArea();
  const hp = 3 + areaIndex() + Math.floor(run.distance / 10000);
  objects.push({
    type: "boss",
    kind: bossName(areaIndex()),
    x: canvasWidth + 160,
    y: groundY - 100,
    w: 92,
    h: 100,
    hp,
    maxHp: hp,
    color: area.accent
  });
  logEvent(`BOSS ${bossName(areaIndex()).toUpperCase()}`);
}

function collectCoin(value, x, y) {
  const stats = getStats();
  const comboBoost = 1 + Math.min(stats.maxCombo - 1, run.combo * (0.012 + state.researchTree.comboStudy * 0.0003));
  const eventBoost = run.event === "coin3" ? 3 : run.event === "fever" ? 2 : 1;
  const adBoost = state.boosts.coinDouble > 0 ? 2 : 1;
  const gained = Math.ceil(value * stats.coinMultiplier * comboBoost * eventBoost * adBoost);
  state.coins += gained;
  state.lifetimeCoins += gained;
  run.sessionCoins += gained;
  addMissionProgress("dailyCoins", gained);
  gainCombo(1);
  burst(x, y, "#f2b84b", 4);
}

function collectRare(kind, x, y) {
  if (kind === "rainbow") {
    const gained = 1 + Math.floor(state.permanent.rarity / 3);
    state.gems += gained;
    logEvent(`RAINBOW +${gained} GEM`);
  } else if (kind === "diamond") {
    state.gems += 3;
    logEvent("DIAMOND +3 GEM");
  } else {
    state.research += 2;
    logEvent("JEWEL +2 LAB");
  }
  gainCombo(2);
  burst(x, y, "#b98cff", 10);
}

function addChest(chestType) {
  const def = chestDefs[chestType] || chestDefs.wood;
  const speed = 1 + state.permanent.chest * 0.05;
  state.chests.push({
    id: `chest_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type: chestType,
    remaining: Math.ceil(def.seconds / speed)
  });
  run.sessionChests += 1;
  addMissionProgress("dailyChest", 1);
  logEvent(`${def.name}宝箱 GET`);
}

function activateItem(kind) {
  if (kind === "dash") {
    run.dashTimer = Math.max(run.dashTimer, 2.5 + state.upgrades.dash * 0.18);
    run.dashCooldown = Math.max(run.dashCooldown, 3);
    logEvent("DASH ITEM");
  } else if (kind === "shield") {
    run.skillShield = Math.max(run.skillShield, 3);
    logEvent("INVINCIBLE 3s");
  } else if (kind === "giant") {
    run.skillShield = Math.max(run.skillShield, 4);
    logEvent("GIANT MODE");
  } else if (kind === "magnet") {
    player.invulnerable = Math.max(player.invulnerable, 0.8);
    logEvent("MAGNET BURST");
    for (const obj of objects) {
      if (obj.type === "coin" || obj.type === "rare") obj.x = Math.min(obj.x, player.x + random(20, 70));
    }
  } else if (kind === "time") {
    run.timeStop = Math.max(run.timeStop, 2.5);
    logEvent("TIME STOP");
  } else if (kind === "doubleJump") {
    player.jumpsUsed = Math.max(0, player.jumpsUsed - 1);
    logEvent("DOUBLE JUMP READY");
  }
  gainCombo(2);
}

function defeatEnemy(obj) {
  state.lifetimeEnemies += 1;
  run.sessionEnemies += 1;
  addMissionProgress("dailyEnemies", 1);
  gainXp(4);
  collectCoin(8 + areaIndex() * 3, obj.x, obj.y);
  burst(obj.x, obj.y, obj.color || "#75d05e", 9);
}

function defeatBoss(obj) {
  const bossBoost = 1 + state.researchTree.bossStudy * 0.06;
  const coinReward = Math.ceil((600 + areaIndex() * 350 + obj.maxHp * 90) * bossBoost);
  const researchReward = Math.ceil((1 + areaIndex() * 0.5) * bossBoost);
  state.coins += coinReward;
  state.research += researchReward;
  state.lifetimeBosses += 1;
  run.sessionBosses += 1;
  addMissionProgress("weeklyBoss", 1);
  gainXp(80 + areaIndex() * 16);
  addChest(weightedPick([
    { value: "silver", weight: 55 },
    { value: "gold", weight: 32 },
    { value: "rainbow", weight: 10 },
    { value: "god", weight: 3 }
  ]));
  logEvent(`BOSS CLEAR +${formatNumber(coinReward)} COIN`);
}

function damagePlayer() {
  if (player.invulnerable > 0 || run.skillShield > 0 || run.dashTimer > 0) return;
  run.hp -= 1;
  run.combo = 0;
  player.invulnerable = 1.25;
  burst(player.x + player.w / 2, player.y + player.h / 2, "#ef6b65", 12);
  if (run.hp <= 0) endRun();
  else logEvent(`DAMAGE HP ${run.hp}`);
}

function endRun() {
  run.gameOver = true;
  run.active = false;
  state.runs += 1;
  const xp = Math.max(5, Math.floor(run.distance / 12));
  gainXp(xp);
  overlayTitle.textContent = "RUN END";
  overlayText.textContent = `${formatNumber(run.distance)}m / XP +${formatNumber(xp)}`;
  runOverlay.classList.remove("hidden");
  logEvent(`RUN END ${formatNumber(run.distance)}m`);
  saveState();
}

function restartFromButton() {
  resetRun();
  logEvent("RUN START");
  updateHud();
}

function resetRun() {
  const stats = getStats();
  run.active = true;
  run.gameOver = false;
  run.distance = 0;
  run.hp = stats.maxHp;
  run.combo = 0;
  run.dashTimer = 0;
  run.dashCooldown = 0;
  run.skillShield = 0;
  run.timeStop = 0;
  run.nextSpawn = 0.4;
  run.nextBossMark = 1000;
  run.event = null;
  run.eventTimer = 0;
  run.eventCooldown = random(45, 85);
  run.gravityFlip = false;
  run.sessionCoins = 0;
  run.sessionEnemies = 0;
  run.sessionBosses = 0;
  run.sessionChests = 0;
  objects = [];
  particles = [];
  player.x = 112;
  player.w = 36;
  player.h = 48;
  player.y = groundY - player.h;
  player.vy = 0;
  player.jumpsUsed = 0;
  player.slideTimer = 0;
  player.invulnerable = 1;
  player.regenTimer = 0;
  runOverlay.classList.add("hidden");
}

function jump() {
  if (run.gameOver) {
    resetRun();
    return;
  }
  const stats = getStats();
  const maxJumps = 1 + (state.upgrades.jump >= 8 ? 1 : 0) + (state.researchTree.jumpStudy >= 12 ? 1 : 0);
  if (player.jumpsUsed >= maxJumps) return;
  player.vy = (run.gravityFlip ? 1 : -1) * (540 * stats.jumpPower);
  player.jumpsUsed += 1;
  player.slideTimer = 0;
  state.stats.jumps += 1;
  gainCombo(0.2);
}

function slide() {
  if (run.gameOver) return;
  player.slideTimer = 0.55;
  if (Math.abs(player.vy) < 1) {
    player.vy = run.gravityFlip ? -110 : 110;
  }
}

function dash() {
  if (run.gameOver || run.dashCooldown > 0) return;
  const duration = 1.2 + state.upgrades.dash * 0.18;
  run.dashTimer = duration;
  run.dashCooldown = Math.max(7, 16 - state.upgrades.dash * 0.25);
  logEvent("DASH");
}

function getStats() {
  const eq = equipmentBonuses();
  const idleStudy = 1 + state.researchTree.idleStudy * 0.04 + (eq.idle || 0);
  return {
    speed: (5 * (1 + state.upgrades.speed * 0.02) * (1 + state.permanent.speed * 0.02) * (1 + state.researchTree.speedStudy * 0.01) * (1 + (eq.speed || 0))),
    jumpPower: (1 + state.upgrades.jump * 0.04 + (eq.jump || 0)),
    maxHp: 1 + state.upgrades.hp + Math.floor(eq.hp || 0),
    coinMultiplier: (1 + state.upgrades.coin * 0.15) * (1 + state.permanent.coin * 0.05) * (1 + (eq.coin || 0)),
    magnetRadius: 44 + state.upgrades.magnet * 14,
    maxCombo: 2 + state.upgrades.combo * 0.15,
    regenEvery: state.upgrades.regen > 0 ? Math.max(10, 32 - state.upgrades.regen * 2) : 0,
    idleMultiplier: idleStudy
  };
}

function equipmentBonuses() {
  const bonuses = {};
  for (const itemId of Object.values(state.equipped)) {
    const item = state.equipment.find((entry) => entry.id === itemId);
    if (!item) continue;
    bonuses[item.stat] = (bonuses[item.stat] || 0) + item.value;
  }
  return bonuses;
}

function getPlayerHeight() {
  return player.slideTimer > 0 ? 28 : 48;
}

function getPlayerRect() {
  const h = getPlayerHeight();
  const y = run.gravityFlip ? player.y : player.y + (48 - h);
  return { x: player.x + 4, y: y + 3, w: player.w - 8, h: h - 6 };
}

function isInvincible() {
  return run.dashTimer > 0 || run.skillShield > 0 || player.invulnerable > 0.05;
}

function canStomp(obj) {
  if (run.gravityFlip) {
    return player.vy < -80 && player.y + 12 < obj.y + obj.h;
  }
  return player.vy > 80 && player.y + getPlayerHeight() - 8 < obj.y + 18;
}

function gainCombo(amount) {
  run.combo = Math.min(180, run.combo + amount);
}

function gainXp(amount) {
  state.xp += amount;
  let needed = xpForLevel(state.level);
  while (state.xp >= needed) {
    state.xp -= needed;
    state.level += 1;
    state.coins += 25 * state.level;
    needed = xpForLevel(state.level);
    logEvent(`LEVEL ${state.level}`);
  }
}

function xpForLevel(level) {
  return Math.floor(60 * Math.pow(level, 1.35));
}

function tickIdle(seconds) {
  const stats = getStats();
  const adBoost = state.boosts.coinDouble > 0 ? 2 : 1;
  const cps =
    (idleCoinPerSecond(state.factories.coinFactory) +
      autoRunnerIncome(state.factories.robotFactory)) *
    stats.idleMultiplier *
    adBoost;
  const gps = idleGemPerSecond(state.factories.mine) * stats.idleMultiplier;
  const rps = idleResearchPerSecond(state.factories.lab) * stats.idleMultiplier;
  state.coins += cps * seconds;
  state.gems += gps * seconds;
  state.research += rps * seconds;
  if (cps > 0) {
    state.lifetimeCoins += cps * seconds;
  }
}

function tickChestTimers(seconds) {
  const speed = 1 + state.permanent.chest * 0.05;
  for (const chest of state.chests) {
    chest.remaining = Math.max(0, chest.remaining - seconds * speed);
  }
}

function tickBoosts(seconds) {
  state.boosts.coinDouble = Math.max(0, state.boosts.coinDouble - seconds);
}

function idleCoinPerSecond(level) {
  if (!level) return 0;
  return level * Math.pow(1.045, level) * 1.1;
}

function idleGemPerSecond(level) {
  if (!level) return 0;
  return level * Math.pow(1.035, level) * 0.008;
}

function idleResearchPerSecond(level) {
  if (!level) return 0;
  return level * Math.pow(1.032, level) * 0.006;
}

function autoRunnerMeters(level) {
  if (!level) return 0;
  return 10 + level * 10 + Math.floor(Math.pow(level, 1.45));
}

function autoRunnerIncome(level) {
  if (!level) return 0;
  return autoRunnerMeters(level) * level * 0.018;
}

function upgradeCost(def, level) {
  return Math.ceil(def.base * Math.pow(def.growth, level));
}

function buyUpgrade(id) {
  const def = upgradeDefs.find((entry) => entry.id === id);
  if (!def) return;
  const level = state.upgrades[id] || 0;
  const cost = upgradeCost(def, level);
  if (!spend(def.currency, cost)) return;
  state.upgrades[id] = level + 1;
  logEvent(`${def.name} Lv${level + 1}`);
}

function buyFactory(id) {
  const def = factoryDefs.find((entry) => entry.id === id);
  if (!def) return;
  const level = state.factories[id] || 0;
  const cost = upgradeCost(def, level);
  if (!spend(def.currency, cost)) return;
  state.factories[id] = level + 1;
  logEvent(`${def.name} Lv${level + 1}`);
}

function buyPermanent(id) {
  const def = permanentDefs.find((entry) => entry.id === id);
  if (!def) return;
  const level = state.permanent[id] || 0;
  const cost = upgradeCost(def, level);
  if (state.prestigePoints < cost) return;
  state.prestigePoints -= cost;
  state.spentPrestigePoints += cost;
  state.permanent[id] = level + 1;
  logEvent(`${def.name} 永続Lv${level + 1}`);
}

function buyResearch(id) {
  const def = researchDefs.find((entry) => entry.id === id);
  if (!def) return;
  const level = state.researchTree[id] || 0;
  const cost = upgradeCost(def, level);
  if (state.research < cost) return;
  state.research -= cost;
  state.researchTree[id] = level + 1;
  logEvent(`${def.name} Lv${level + 1}`);
}

function prestigeGain() {
  if (state.coins < 1000000) return 0;
  const coinPart = Math.floor(Math.sqrt(state.coins / 1000000));
  const distancePart = Math.floor(state.bestDistance / 25000);
  return Math.max(1, coinPart + distancePart);
}

function prestige() {
  const gain = prestigeGain();
  if (gain <= 0) return;
  state.prestigePoints += gain;
  state.prestigeCount += 1;
  state.coins = 0;
  state.upgrades = objectFromDefs(upgradeDefs);
  addMissionProgress("weeklyPrestige", 1);
  logEvent(`PRESTIGE +${gain} PR`);
  resetRun();
  saveState();
}

function spend(currency, amount) {
  if ((state[currency] || 0) < amount) return false;
  state[currency] -= amount;
  return true;
}

function openChest(chestId) {
  const chest = state.chests.find((entry) => entry.id === chestId);
  if (!chest || chest.remaining > 0) return;
  const index = state.chests.indexOf(chest);
  state.chests.splice(index, 1);
  const item = generateEquipment(chest.type);
  const coinReward = chestCoinReward(chest.type);
  state.coins += coinReward;
  state.equipment.push(item);
  state.stats.chestsOpened += 1;
  logEvent(`${item.rarity}${item.slot} GET`);
}

function generateEquipment(chestType) {
  const typeBoost = { wood: 0, silver: 8, gold: 18, rainbow: 34, god: 50 }[chestType] || 0;
  const rarity = weightedPick(rarityDefs.map((rarityDef) => ({
    value: rarityDef,
    weight: Math.max(1, rarityDef.weight + typeBoost * (rarityDef.rank - 2))
  })));
  const slot = slots[randomInt(0, slots.length - 1)];
  const stat = weightedPick([
    { value: "speed", weight: slot === "靴" ? 28 : 16 },
    { value: "jump", weight: slot === "靴" ? 26 : 12 },
    { value: "coin", weight: slot === "アクセサリー" ? 30 : 17 },
    { value: "hp", weight: slot === "胴" ? 28 : 12 },
    { value: "idle", weight: slot === "頭" ? 22 : 16 }
  ]);
  const value = stat === "hp"
    ? rarity.rank
    : Number((0.02 * rarity.rank + Math.random() * 0.015 * rarity.rank).toFixed(3));
  return {
    id: `eq_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: equipmentName(slot, rarity.id),
    slot,
    rarity: rarity.id,
    rarityClass: rarity.colorClass,
    stat,
    value
  };
}

function equipmentName(slot, rarity) {
  const prefix = {
    頭: "アンテナ",
    靴: "ブーツ",
    胴: "コア",
    アクセサリー: "チャーム"
  }[slot];
  return `${rarity} ${prefix}`;
}

function chestCoinReward(type) {
  return {
    wood: 120,
    silver: 800,
    gold: 4200,
    rainbow: 25000,
    god: 120000
  }[type] || 100;
}

function equipItem(itemId) {
  const item = state.equipment.find((entry) => entry.id === itemId);
  if (!item) return;
  state.equipped[item.slot] = itemId;
  logEvent(`${item.slot} EQUIPPED`);
}

function ensureMissions() {
  const dayKey = new Date().toISOString().slice(0, 10);
  const weekKey = weekStamp(new Date());
  if (!state.missions) {
    state.missions = {
      dayKey,
      weekKey,
      daily: missionStateFromDefs(dailyMissionDefs),
      weekly: missionStateFromDefs(weeklyMissionDefs)
    };
  }
  if (state.missions.dayKey !== dayKey) {
    state.missions.dayKey = dayKey;
    state.missions.daily = missionStateFromDefs(dailyMissionDefs);
  }
  if (state.missions.weekKey !== weekKey) {
    state.missions.weekKey = weekKey;
    state.missions.weekly = missionStateFromDefs(weeklyMissionDefs);
  }
}

function missionStateFromDefs(defs) {
  return defs.reduce((acc, def) => {
    acc[def.id] = { progress: 0, claimed: false };
    return acc;
  }, {});
}

function weekStamp(date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
  return `${temp.getUTCFullYear()}-${week}`;
}

function addMissionProgress(id, amount) {
  ensureMissions();
  if (state.missions.daily[id]) {
    state.missions.daily[id].progress += amount;
  }
  if (state.missions.weekly[id]) {
    state.missions.weekly[id].progress += amount;
  }
}

function claimMission(group, id) {
  const defs = group === "daily" ? dailyMissionDefs : weeklyMissionDefs;
  const def = defs.find((entry) => entry.id === id);
  const mission = state.missions[group][id];
  if (!def || !mission || mission.claimed || mission.progress < def.target) return;
  mission.claimed = true;
  grantReward(def.reward);
  logEvent(`${def.name} CLEAR`);
}

function grantReward(reward) {
  state.coins += reward.coins || 0;
  state.gems += reward.gems || 0;
  state.research += reward.research || 0;
}

function checkAchievements() {
  for (const def of achievementDefs) {
    if (!state.achievements[def.id] && def.condition(state)) {
      state.achievements[def.id] = { unlocked: true, claimed: false };
      logEvent(`ACHIEVEMENT ${def.name}`);
    }
  }
}

function claimAchievement(id) {
  const def = achievementDefs.find((entry) => entry.id === id);
  const achievement = state.achievements[id];
  if (!def || !achievement || achievement.claimed) return;
  achievement.claimed = true;
  grantReward(def.reward);
  logEvent(`${def.name} REWARD`);
}

function activateCoinAd() {
  const adBoost = 1 + state.permanent.ad * 0.2;
  state.boosts.coinDouble = Math.max(state.boosts.coinDouble, 300 * adBoost);
  state.stats.adsWatched += 1;
  logEvent("REWARD BOOST 5m");
}

function finishFirstChest() {
  const chest = state.chests.find((entry) => entry.remaining > 0);
  if (!chest) return;
  chest.remaining = 0;
  state.stats.adsWatched += 1;
  logEvent("CHEST READY");
}

function freeGacha() {
  state.equipment.push(generateEquipment("silver"));
  state.stats.adsWatched += 1;
  logEvent("FREE GACHA");
}

function startRandomEvent() {
  const event = weightedPick([
    { value: "coinRain", weight: 18 },
    { value: "meteor", weight: 12 },
    { value: "fever", weight: 16 },
    { value: "chestRush", weight: 12 },
    { value: "gravity", weight: 11 },
    { value: "clearPath", weight: 15 },
    { value: "coin3", weight: 16 }
  ]);
  run.event = event;
  run.eventTimer = event === "gravity" ? 12 : 14;
  if (event === "gravity") run.gravityFlip = true;
  if (event === "meteor") spawnMeteorWave();
  logEvent(`${eventName(event)} START`);
}

function spawnMeteorWave() {
  for (let i = 0; i < 5; i++) {
    objects.push({
      type: "obstacle",
      kind: "meteor",
      x: canvasWidth + 150 + i * 120,
      y: groundY - random(120, 250),
      w: 34,
      h: 34,
      color: "#ef6b65"
    });
  }
}

function eventName(event) {
  return {
    coinRain: "COIN RAIN",
    meteor: "METEOR",
    fever: "FEVER",
    chestRush: "CHEST RUSH",
    gravity: "GRAVITY FLIP",
    clearPath: "CLEAR PATH",
    coin3: "COIN x3"
  }[event] || "EVENT";
}

function currentArea() {
  return areas[areaIndex()];
}

function areaIndex() {
  let index = 0;
  const distance = Math.max(state.bestDistance, run.distance);
  for (let i = 0; i < areas.length; i++) {
    if (distance >= areas[i].start) index = i;
  }
  return index;
}

function bossName(index) {
  return ["Slime King", "Sand Wyrm", "Frost Core", "Lava Golem", "Giant Robot", "Star Dragon", "Void Engine", "Aether Lord", "Infinity Gate"][index] || "Infinity Gate";
}

function renderPanel() {
  if (activeTab === "upgrades") renderUpgrades();
  if (activeTab === "factory") renderFactory();
  if (activeTab === "prestige") renderPrestige();
  if (activeTab === "equipment") renderEquipment();
  if (activeTab === "missions") renderMissions();
  if (activeTab === "research") renderResearch();
}

function renderUpgrades() {
  const html = [
    panelHead("通常強化", `Lv合計 ${sumValues(state.upgrades)}`),
    `<div class="list">`,
    ...upgradeDefs.map((def) => {
      const level = state.upgrades[def.id] || 0;
      const cost = upgradeCost(def, level);
      return rowItem({
        title: `${def.name} Lv${level}`,
        desc: def.effect(level),
        meta: [`次 ${def.effect(level + 1)}`, `${formatCurrency(cost, def.currency)}`],
        action: "buyUpgrade",
        id: def.id,
        disabled: (state[def.currency] || 0) < cost,
        label: "強化"
      });
    }),
    `</div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderFactory() {
  const stats = getStats();
  const html = [
    panelHead("放置施設", `放置倍率 x${stats.idleMultiplier.toFixed(2)}`),
    `<div class="summary-band">
      <div><span>コイン/秒</span><strong>${formatNumber((idleCoinPerSecond(state.factories.coinFactory) + autoRunnerIncome(state.factories.robotFactory)) * stats.idleMultiplier)}</strong></div>
      <div><span>宝石/秒</span><strong>${formatNumber(idleGemPerSecond(state.factories.mine) * stats.idleMultiplier, 2)}</strong></div>
    </div>`,
    `<div class="list">`,
    ...factoryDefs.map((def) => {
      const level = state.factories[def.id] || 0;
      const cost = upgradeCost(def, level);
      return rowItem({
        title: `${def.name} Lv${level}`,
        desc: def.effect(level),
        meta: [`次 ${def.effect(level + 1)}`, `${formatCurrency(cost, def.currency)}`],
        action: "buyFactory",
        id: def.id,
        disabled: (state[def.currency] || 0) < cost,
        label: "建設"
      });
    }),
    `</div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderPrestige() {
  const gain = prestigeGain();
  const progress = Math.min(1, state.coins / 1000000);
  const html = [
    panelHead("Prestige", `転生 ${state.prestigeCount}回`),
    `<div class="section-stack">
      <div class="summary-band">
        <div><span>所持PR</span><strong>${formatNumber(state.prestigePoints)}</strong></div>
        <div><span>獲得予定</span><strong>${formatNumber(gain)}</strong></div>
      </div>
      <div class="row-item">
        <div>
          <h3>100万コインで転生</h3>
          <p>コインと通常強化をリセットし、永続強化用のPRを得ます。</p>
          <div class="progress"><i style="width:${progress * 100}%"></i></div>
        </div>
        <button class="buy-button" data-action="prestige" ${gain <= 0 ? "disabled" : ""}>転生</button>
      </div>
      <div class="list">
        ${permanentDefs.map((def) => {
          const level = state.permanent[def.id] || 0;
          const cost = upgradeCost(def, level);
          return rowItem({
            title: `${def.name} Lv${level}`,
            desc: def.effect(level),
            meta: [`次 ${def.effect(level + 1)}`, `${cost} PR`],
            action: "buyPermanent",
            id: def.id,
            disabled: state.prestigePoints < cost,
            label: "永続"
          });
        }).join("")}
      </div>
      <div class="list">
        ${renderAdRewards()}
      </div>
    </div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderAdRewards() {
  return [
    rowItem({
      title: "リワード: コイン2倍",
      desc: state.boosts.coinDouble > 0 ? `残り ${formatTime(state.boosts.coinDouble)}` : "5分間、獲得と放置のコインが2倍になります。",
      meta: [`広告倍率 ${permanentDefs.find((d) => d.id === "ad").effect(state.permanent.ad)}`],
      action: "adCoin",
      id: "coinAd",
      label: "受取"
    }),
    rowItem({
      title: "リワード: 宝箱即開封",
      desc: "待機中の宝箱を1個だけ準備完了にします。",
      meta: [`宝箱 ${state.chests.length}`],
      action: "adChest",
      id: "chestAd",
      disabled: !state.chests.some((chest) => chest.remaining > 0),
      label: "受取"
    }),
    rowItem({
      title: "リワード: 無料ガチャ",
      desc: "銀宝箱相当の装備を1つ獲得します。",
      meta: [`装備 ${state.equipment.length}`],
      action: "adGacha",
      id: "gachaAd",
      label: "受取"
    })
  ].join("");
}

function renderEquipment() {
  const chests = state.chests.slice().sort((a, b) => a.remaining - b.remaining);
  const equippedNames = slots.map((slot) => {
    const item = state.equipment.find((entry) => entry.id === state.equipped[slot]);
    return `<div><span>${slot}</span><strong>${item ? escapeHtml(item.name) : "-"}</strong></div>`;
  }).join("");
  const html = [
    panelHead("装備", `所持 ${state.equipment.length}`),
    `<div class="section-stack">
      <div class="summary-band">${equippedNames}</div>
      <div class="list">
        ${chests.length ? chests.map((chest) => {
          const def = chestDefs[chest.type];
          return rowItem({
            title: `${def.name}宝箱`,
            desc: chest.remaining <= 0 ? "開封できます。" : `残り ${formatTime(chest.remaining)}`,
            meta: [`開封 ${formatTime(def.seconds)}`],
            action: "openChest",
            id: chest.id,
            disabled: chest.remaining > 0,
            label: "開封"
          });
        }).join("") : `<div class="row-item"><div><h3>宝箱なし</h3><p>ラン中の宝箱、ボス報酬、リワードから入手できます。</p></div></div>`}
      </div>
      <div class="list">
        ${state.equipment.slice().reverse().slice(0, 60).map((item) => {
          const equipped = state.equipped[item.slot] === item.id;
          const valueText = item.stat === "hp" ? `+${item.value}` : `+${Math.round(item.value * 100)}%`;
          return rowItem({
            title: `<span class="${item.rarityClass}">${escapeHtml(item.name)}</span>`,
            desc: `${item.slot} / ${statNames[item.stat]} ${valueText}`,
            meta: [item.rarity, equipped ? "装備中" : "未装備"],
            action: "equip",
            id: item.id,
            disabled: equipped,
            label: equipped ? "装備中" : "装備"
          });
        }).join("")}
      </div>
    </div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderMissions() {
  ensureMissions();
  const daily = renderMissionGroup("daily", dailyMissionDefs);
  const weekly = renderMissionGroup("weekly", weeklyMissionDefs);
  const achievements = achievementDefs.map((def) => {
    const achievement = state.achievements[def.id];
    const unlocked = achievement?.unlocked;
    const claimed = achievement?.claimed;
    return rowItem({
      title: def.name,
      desc: unlocked ? "達成済み" : "未達成",
      meta: [rewardText(def.reward)],
      action: "claimAchievement",
      id: def.id,
      disabled: !unlocked || claimed,
      label: claimed ? "受取済" : "受取"
    });
  }).join("");
  panelContent.innerHTML = [
    panelHead("任務と実績", `日替 ${state.missions.dayKey}`),
    `<div class="section-stack">
      <div class="list">${daily}</div>
      <div class="list">${weekly}</div>
      <div class="list">${achievements}</div>
    </div>`
  ].join("");
}

function renderMissionGroup(group, defs) {
  return defs.map((def) => {
    const mission = state.missions[group][def.id];
    const progress = Math.min(1, mission.progress / def.target);
    return rowItem({
      title: def.name,
      desc: `${formatNumber(Math.min(mission.progress, def.target))} / ${formatNumber(def.target)}`,
      meta: [group === "daily" ? "毎日" : "週間", rewardText(def.reward)],
      action: group === "daily" ? "claimDaily" : "claimWeekly",
      id: def.id,
      disabled: mission.progress < def.target || mission.claimed,
      label: mission.claimed ? "受取済" : "受取",
      progress
    });
  }).join("");
}

function renderResearch() {
  const unlockText = state.prestigeCount >= 100
    ? "ENDGAME ONLINE"
    : `本格研究まで ${Math.max(0, 100 - state.prestigeCount)}転生`;
  panelContent.innerHTML = [
    panelHead("研究ツリー", unlockText),
    `<div class="section-stack">
      <div class="summary-band">
        <div><span>研究ポイント</span><strong>${formatNumber(state.research)}</strong></div>
        <div><span>研究Lv合計</span><strong>${sumValues(state.researchTree)}</strong></div>
      </div>
      <div class="list">
      ${researchDefs.map((def) => {
        const level = state.researchTree[def.id] || 0;
        const cost = upgradeCost(def, level);
        return rowItem({
          title: `${def.name} Lv${level}`,
          desc: def.effect(level),
          meta: [`次 ${def.effect(level + 1)}`, `${formatNumber(cost)} LAB`],
          action: "buyResearch",
          id: def.id,
          disabled: state.research < cost,
          label: "研究"
        });
      }).join("")}
      </div>
    </div>`
  ].join("");
}

function panelHead(title, meta) {
  return `<div class="panel-head"><div><h2>${title}</h2><p>${meta}</p></div></div>`;
}

function rowItem({ title, desc, meta = [], action, id, disabled = false, label = "購入", progress = null }) {
  const progressHtml = progress === null ? "" : `<div class="progress"><i style="width:${Math.max(0, Math.min(1, progress)) * 100}%"></i></div>`;
  return `<div class="row-item">
    <div>
      <h3>${title}</h3>
      <p>${desc}</p>
      ${progressHtml}
      <div class="meta">${meta.map((entry) => `<span class="pill">${entry}</span>`).join("")}</div>
    </div>
    ${action ? `<button class="buy-button" data-action="${action}" data-id="${id}" ${disabled ? "disabled" : ""}>${label}</button>` : ""}
  </div>`;
}

function updateHud() {
  const stats = getStats();
  const area = currentArea();
  document.getElementById("coinsStat").textContent = formatNumber(state.coins);
  document.getElementById("gemsStat").textContent = formatNumber(state.gems, 1);
  document.getElementById("researchStat").textContent = formatNumber(state.research, 1);
  document.getElementById("prestigeStat").textContent = formatNumber(state.prestigePoints);
  document.getElementById("distanceStat").textContent = `${formatNumber(run.distance)}m`;
  document.getElementById("bestStat").textContent = `${formatNumber(state.bestDistance)}m`;
  document.getElementById("hpStat").textContent = `${Math.max(0, run.hp)}/${stats.maxHp}`;
  document.getElementById("comboStat").textContent = `x${(1 + Math.min(stats.maxCombo - 1, run.combo * 0.012)).toFixed(2)}`;
  document.getElementById("levelStat").textContent = state.level;
  document.getElementById("areaName").textContent = `${area.name} / ${area.line}`;
  const dashButton = document.getElementById("dashBtn");
  dashButton.disabled = run.dashCooldown > 0 || run.gameOver;
  dashButton.textContent = run.dashCooldown > 0 ? `${Math.ceil(run.dashCooldown)}s` : "ダッシュ";
}

function logEvent(message) {
  eventLog.textContent = message;
  messageTimer = 3;
}

function flashButton(id) {
  const button = document.getElementById(id);
  if (!button) return;
  button.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], {
    duration: 220,
    easing: "ease-out"
  });
}

function draw() {
  const area = currentArea();
  drawBackground(area);
  drawObjects();
  drawPlayer();
  drawParticles();
  drawForeground(area);
}

function drawBackground(area) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, area.sky[0]);
  gradient.addColorStop(0.62, area.sky[1]);
  gradient.addColorStop(1, "#1a1d23");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const parallax = (run.distance * 0.35) % 180;
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = area.accent;
  for (let i = -1; i < 8; i++) {
    const x = i * 180 - parallax;
    ctx.beginPath();
    ctx.moveTo(x, groundY - 20);
    ctx.lineTo(x + 90, groundY - 130 - (i % 3) * 22);
    ctx.lineTo(x + 180, groundY - 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = area.ground;
  ctx.fillRect(0, groundY, canvasWidth, canvasHeight - groundY);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  for (let x = -((run.distance * 10) % 46); x < canvasWidth; x += 46) {
    ctx.fillRect(x, groundY + 16, 24, 4);
  }
}

function drawForeground(area) {
  ctx.fillStyle = "rgba(5,8,12,0.34)";
  ctx.fillRect(0, 0, canvasWidth, 28);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 13px Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`${area.name}  ${formatNumber(run.distance)}m`, 14, 14);
  if (run.event) {
    ctx.fillStyle = area.accent;
    ctx.fillText(`${eventName(run.event)} ${Math.ceil(run.eventTimer)}s`, canvasWidth - 190, 14);
  }
}

function drawPlayer() {
  const rect = getPlayerRect();
  const blink = player.invulnerable > 0 && Math.floor(performance.now() / 80) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.55;
  const accent = run.dashTimer > 0 ? "#f2b84b" : run.skillShield > 0 ? "#48bde7" : "#e8edf5";

  ctx.fillStyle = "#343b48";
  roundRect(rect.x, rect.y, rect.w, rect.h, 7);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(rect.x + 8, rect.y + 8, rect.w - 16, 10, 3);
  ctx.fill();
  ctx.fillStyle = "#101217";
  ctx.fillRect(rect.x + 12, rect.y + 11, 5, 4);
  ctx.fillRect(rect.x + rect.w - 17, rect.y + 11, 5, 4);
  ctx.fillStyle = "#7f8b9c";
  ctx.fillRect(rect.x + 6, rect.y + rect.h - 5, 8, 8);
  ctx.fillRect(rect.x + rect.w - 14, rect.y + rect.h - 5, 8, 8);
  if (run.dashTimer > 0) {
    ctx.fillStyle = "rgba(242,184,75,0.42)";
    ctx.fillRect(rect.x - 46, rect.y + rect.h * 0.35, 42, 8);
  }
  if (run.skillShield > 0) {
    ctx.strokeStyle = "rgba(72,189,231,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.78, rect.h * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawObjects() {
  for (const obj of objects) {
    if (obj.type === "coin") drawCoin(obj);
    else if (obj.type === "rare") drawRare(obj);
    else if (obj.type === "chest") drawChest(obj);
    else if (obj.type === "item") drawItem(obj);
    else if (obj.type === "enemy") drawEnemy(obj);
    else if (obj.type === "boss") drawBoss(obj);
    else drawObstacle(obj);
  }
}

function drawCoin(obj) {
  ctx.fillStyle = obj.value >= 50 ? "#ffd96a" : "#f2b84b";
  ctx.beginPath();
  ctx.ellipse(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2, obj.h / 2, Math.sin(performance.now() / 160) * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.font = "700 9px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(obj.value), obj.x + obj.w / 2, obj.y + obj.h / 2 + 0.5);
  ctx.textAlign = "start";
}

function drawRare(obj) {
  ctx.fillStyle = obj.kind === "diamond" ? "#7cf1ff" : obj.kind === "gem" ? "#4cc38a" : "#b98cff";
  ctx.beginPath();
  ctx.moveTo(obj.x + obj.w / 2, obj.y);
  ctx.lineTo(obj.x + obj.w, obj.y + obj.h / 2);
  ctx.lineTo(obj.x + obj.w / 2, obj.y + obj.h);
  ctx.lineTo(obj.x, obj.y + obj.h / 2);
  ctx.closePath();
  ctx.fill();
}

function drawChest(obj) {
  const def = chestDefs[obj.chestType] || chestDefs.wood;
  ctx.fillStyle = def.color;
  roundRect(obj.x, obj.y, obj.w, obj.h, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(obj.x, obj.y + 12, obj.w, 5);
  ctx.fillStyle = "#f8e7a8";
  ctx.fillRect(obj.x + obj.w / 2 - 4, obj.y + 10, 8, 9);
}

function drawItem(obj) {
  const color = {
    dash: "#f2b84b",
    shield: "#48bde7",
    giant: "#ef6b65",
    magnet: "#4cc38a",
    time: "#b98cff",
    doubleJump: "#eef3f7"
  }[obj.kind] || "#ffffff";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.font = "700 11px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(obj.kind.slice(0, 1).toUpperCase(), obj.x + obj.w / 2, obj.y + obj.h / 2);
  ctx.textAlign = "start";
}

function drawObstacle(obj) {
  if (obj.kind === "spike") {
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y + obj.h);
    ctx.lineTo(obj.x + obj.w / 2, obj.y);
    ctx.lineTo(obj.x + obj.w, obj.y + obj.h);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (obj.kind === "laser") {
    ctx.fillStyle = "rgba(239,107,101,0.28)";
    ctx.fillRect(obj.x - 7, obj.y, obj.w + 14, obj.h);
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x + 9, obj.y, 8, obj.h);
    return;
  }
  ctx.fillStyle = obj.color || "#8a6a45";
  roundRect(obj.x, obj.y, obj.w, obj.h, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(obj.x + 6, obj.y + 9, obj.w - 12, 5);
}

function drawEnemy(obj) {
  ctx.fillStyle = obj.color;
  if (obj.kind === "bird") {
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y + obj.h / 2);
    ctx.lineTo(obj.x + obj.w / 2, obj.y);
    ctx.lineTo(obj.x + obj.w, obj.y + obj.h / 2);
    ctx.lineTo(obj.x + obj.w / 2, obj.y + obj.h);
    ctx.closePath();
    ctx.fill();
  } else {
    roundRect(obj.x, obj.y, obj.w, obj.h, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(obj.x + 11, obj.y + 12, 5, 5);
    ctx.fillRect(obj.x + obj.w - 16, obj.y + 12, 5, 5);
  }
}

function drawBoss(obj) {
  ctx.fillStyle = obj.color;
  roundRect(obj.x, obj.y, obj.w, obj.h, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(obj.x + 18, obj.y + 26, 10, 10);
  ctx.fillRect(obj.x + obj.w - 28, obj.y + 26, 10, 10);
  ctx.fillStyle = "#101217";
  ctx.fillRect(obj.x, obj.y - 12, obj.w, 6);
  ctx.fillStyle = "#ef6b65";
  ctx.fillRect(obj.x, obj.y - 12, obj.w * Math.max(0, obj.hp / obj.maxHp), 6);
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: random(-160, 160),
      vy: random(-220, -40),
      size: random(3, 7),
      life: random(0.35, 0.9),
      color
    });
  }
}

function roundRect(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

function formatNumber(value, decimals = 0) {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return Number(value).toFixed(decimals);
}

function formatCurrency(amount, currency) {
  const label = {
    coins: "COIN",
    gems: "GEM",
    research: "LAB"
  }[currency] || currency.toUpperCase();
  return `${formatNumber(amount)} ${label}`;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function rewardText(reward) {
  return [
    reward.coins ? `${formatNumber(reward.coins)} COIN` : "",
    reward.gems ? `${formatNumber(reward.gems)} GEM` : "",
    reward.research ? `${formatNumber(reward.research)} LAB` : ""
  ].filter(Boolean).join(" / ");
}

function sumValues(object) {
  return Object.values(object).reduce((sum, value) => sum + Number(value || 0), 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
