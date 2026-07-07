"use strict";

const STORAGE_KEY = "infinite_runner_factory_save_v1";
const SAVE_VERSION = 1;
const ASSET_ROOT = "asset/";
const MUSIC_ROOT = `${ASSET_ROOT}music/loop/`;
const REWARD_AD_URL = "https://omg10.com/4/11245499";
const LANGUAGE_STORAGE_KEY = "irf_language_v1";
const LANGUAGE_MODE = document.documentElement.dataset.languageMode || "auto";
const ADS_ENABLED = (document.documentElement.dataset.adMode || "reward") !== "none";
const MAX_JUMP_HOLD_SECONDS = 1;
const MIN_JUMP_HOLD_SECONDS = 0.1;
const BASE_JUMP_VELOCITY = 380;
const JUMP_UPGRADE_VELOCITY = 34;
const BASE_UPGRADE_CAP = 5;

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

const factoryAreaTiers = [
  { key: "grass", name: "草原", cost: 1, output: 1, color: "#7edc91" },
  { key: "desert", name: "砂漠", cost: 8, output: 5.2, color: "#f2b84b" },
  { key: "snow", name: "雪山", cost: 45, output: 24, color: "#9fd9ff" },
  { key: "volcano", name: "火山", cost: 260, output: 120, color: "#ef6b65" },
  { key: "future", name: "未来都市", cost: 1600, output: 680, color: "#48bde7" },
  { key: "space", name: "宇宙", cost: 9800, output: 3900, color: "#f1efff" },
  { key: "void", name: "ブラックホール", cost: 65000, output: 24000, color: "#b98cff" },
  { key: "aether", name: "神界", cost: 430000, output: 150000, color: "#fff1a5" },
  { key: "infinite", name: "無限空間", cost: 3000000, output: 980000, color: "#4cc38a" }
];

const factoryTemplates = [
  { id: "coinFactory", name: "コイン工場", base: 500, growth: 1.18, currency: "coins", category: "coins", outputType: "coins", description: "コインを毎秒生産する基本施設。", outputBase: 1.1, outputGrowth: 1.045 },
  { id: "coinPress", name: "高速コインプレス", base: 25000, growth: 1.2, currency: "coins", category: "coins", outputType: "coins", description: "コイン工場より高効率でコインを生産する上位施設。", outputBase: 15, outputGrowth: 1.05 },
  { id: "coinMint", name: "量子造幣所", base: 1000000, growth: 1.22, currency: "coins", category: "coins", outputType: "coins", description: "大量のコインを生産する終盤向け施設。", outputBase: 220, outputGrowth: 1.055 },
  { id: "mine", name: "鉱山", base: 2500, growth: 1.22, currency: "coins", category: "gems", outputType: "gems", description: "宝石を少量ずつ採掘する基本施設。", outputBase: 0.008, outputGrowth: 1.035 },
  { id: "deepMine", name: "深層鉱山", base: 85000, growth: 1.23, currency: "coins", category: "gems", outputType: "gems", description: "鉱山より効率よく宝石を採掘する上位施設。", outputBase: 0.06, outputGrowth: 1.04 },
  { id: "crystalForge", name: "結晶炉", base: 600000, growth: 1.25, currency: "coins", category: "gems", outputType: "gems", description: "宝石を人工生成する高出力施設。", outputBase: 0.22, outputGrowth: 1.045 },
  { id: "lab", name: "研究所", base: 4, growth: 1.2, currency: "gems", category: "research", outputType: "research", description: "研究ポイントを少しずつ生産する基本施設。", outputBase: 0.0012, outputGrowth: 1.018 },
  { id: "quantumLab", name: "量子研究所", base: 40, growth: 1.22, currency: "gems", category: "research", outputType: "research", description: "研究所より多くの研究ポイントを生産する上位施設。", outputBase: 0.006, outputGrowth: 1.022 },
  { id: "robotFactory", name: "ロボット工場", base: 7000, growth: 1.24, currency: "coins", category: "runner", description: "超小型ロボットを製造し、直接獲得コイン倍率を増やす施設。", directCoinBonus: 0.012 },
  { id: "eliteRunnerFactory", name: "エリートランナー工場", base: 240000, growth: 1.25, currency: "coins", category: "runner", description: "高性能な超小型ロボットで、直接獲得コイン倍率をさらに伸ばす施設。", directCoinBonus: 0.025 }
];

const factoryDefs = buildFactoryDefs();

const permanentDefs = [
  { id: "coin", name: "獲得コイン", base: 1, growth: 1.35, effect: (lv) => `+${lv * 5}%` },
  { id: "speed", name: "速度", base: 1, growth: 1.45, effect: (lv) => `+${lv * 2}%` },
  { id: "ad", name: "広告倍率", base: 2, growth: 1.5, effect: (lv) => `+${lv * 20}%` },
  { id: "rarity", name: "レア率", base: 2, growth: 1.55, effect: (lv) => `+${lv}%` },
  { id: "chest", name: "宝箱速度", base: 2, growth: 1.5, effect: (lv) => `+${lv * 5}%` }
];

const researchDefs = [
  { id: "sandBreaker", name: "砂王対策", base: 120, growth: 1.55, description: "草原ボスの粘液核解析から、砂漠ボスの砂装甲を少しだけ崩しやすくします。Lv5でも時々1枚余分に削れる程度です。", effect: (lv) => `砂装甲対策 +${lv * 2}%` },
  { id: "frostInsulation", name: "凍結対策", base: 160, growth: 1.58, description: "砂漠ボスの発熱器官を応用し、雪山ボスの凍結オーラの持続をわずかに短くします。", effect: (lv) => `凍結時間 -${lv * 2}%` },
  { id: "heatPlating", name: "灼熱対策", base: 220, growth: 1.6, description: "雪山ボスの冷却コアから耐熱装甲を作り、火山ボスの追加ダメージを低確率で抑えます。", effect: (lv) => `灼熱軽減 ${lv * 2}%` },
  { id: "shieldPiercer", name: "シールド解析", base: 300, growth: 1.62, description: "火山ボスの硬質外殻解析から、未来都市ボスのエネルギー盾を少しだけ貫通しやすくします。", effect: (lv) => `盾対策 +${lv * 2}%` },
  { id: "gravityAnchor", name: "重力アンカー", base: 420, growth: 1.65, description: "未来都市ボスの制御回路を応用し、宇宙ボスの重力反転波をまれに受け流します。", effect: (lv) => `重力波耐性 +${lv * 2}%` },
  { id: "voidTether", name: "虚空テザー", base: 580, growth: 1.68, description: "宇宙ボスの軌道データから、ブラックホールボスの吸引をほんの少し弱めます。", effect: (lv) => `吸引軽減 +${lv * 2}%` },
  { id: "aetherSeal", name: "神気封印", base: 820, growth: 1.7, description: "ブラックホールボスの特異点残滓で、神界ボスの再生間隔をわずかに遅らせます。", effect: (lv) => `再生遅延 +${(lv * 0.12).toFixed(2)}s` },
  { id: "phaseAnchor", name: "位相アンカー", base: 1150, growth: 1.72, description: "神界ボスの神気波形から、無限空間ボスの位相化時間を少しだけ短くします。", effect: (lv) => `位相短縮 +${lv}%` }
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

const areaEnemyTraits = [
  { id: "plain", name: "標準" },
  { id: "sandArmor", name: "砂装甲" },
  { id: "frostAura", name: "凍結オーラ" },
  { id: "burning", name: "灼熱" },
  { id: "energyShield", name: "エネルギー盾" },
  { id: "gravityPulse", name: "重力波" },
  { id: "voidPull", name: "吸引" },
  { id: "regen", name: "再生" },
  { id: "phase", name: "位相化" }
];

const bossGimmicks = [
  { id: "slimeSplit", name: "分裂スライム" },
  { id: "sandBurrow", name: "砂潜り" },
  { id: "frostPrison", name: "凍結監獄" },
  { id: "lavaMeteor", name: "溶岩隕石" },
  { id: "laserGrid", name: "レーザー格子" },
  { id: "gravitySurge", name: "重力反転波" },
  { id: "singularity", name: "特異点吸引" },
  { id: "aetherRegen", name: "神気再生" },
  { id: "infinitePhase", name: "無限位相" }
];

const areaMusicFiles = [
  "草原エリアBGM.ogg",
  "砂漠エリアBGM.ogg",
  "雪山エリアBGM.ogg",
  "火山エリアBGM.ogg",
  "未来都市エリアBGM.ogg",
  "宇宙エリアBGM.ogg",
  "ブラックホールエリアBGM.ogg",
  "神界エリアBGM.ogg",
  "神界エリアBGM.ogg"
];

const sceneMusicFiles = {
  title: "タイトル画面BGM.ogg",
  menu: "メインメニューBGM.ogg",
  upgrades: "強化画面BGM.ogg",
  factory: "工場放置施設画面BGM.ogg",
  equipment: "装備宝箱画面BGM.ogg",
  missions: "ミッション実績画面BGM.ogg",
  research: "研究ツリー画面BGM.ogg",
  prestige: "転生画面BGM.ogg",
  result: "リザルト画面BGM.ogg"
};

const PLAYER_SPRITE_FRAME_HEIGHT = 145;
const PLAYER_SPRITE_ANCHOR_X = 640 / 1280;
const PLAYER_SPRITE_ANCHOR_Y = 1010 / 1280;

const defaultRobotFrames = {
  running: [
    { name: "kogatarobotto running0000", x: 0, y: 809, w: 336, h: 749, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 },
    { name: "kogatarobotto running0001", x: 672, y: 0, w: 337, h: 759, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 },
    { name: "kogatarobotto running0002", x: 336, y: 809, w: 411, h: 749, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 }
  ],
  jump: [
    { name: "kogatarobotto jump0000", x: 0, y: 809, w: 336, h: 749, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 },
    { name: "kogatarobotto jump0001", x: 336, y: 0, w: 336, h: 779, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 },
    { name: "kogatarobotto jump0002", x: 0, y: 0, w: 336, h: 809, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 }
  ],
  sliding: [
    { name: "kogatarobotto sliding0000", x: 2048, y: 0, w: 530, h: 627, frameX: -469, frameY: -383, frameW: 1280, frameH: 1280 }
  ],
  dash: [
    { name: "kogatarobotto dash0000", x: 0, y: 809, w: 336, h: 749, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 },
    { name: "kogatarobotto dash0001", x: 1009, y: 0, w: 336, h: 749, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 },
    { name: "kogatarobotto dash0002", x: 1625, y: 0, w: 423, h: 709, frameX: -404, frameY: -291, frameW: 1280, frameH: 1280 },
    { name: "kogatarobotto dash0003", x: 747, y: 809, w: 750, h: 726, frameX: -269, frameY: -287, frameW: 1280, frameH: 1280 }
  ],
  damage: [
    { name: "kogatarobotto damage0000", x: 1345, y: 0, w: 280, h: 749, frameX: -468, frameY: -261, frameW: 1280, frameH: 1280 }
  ]
};

const playerAnimationDefs = {
  running: { fps: 9, loop: true },
  jump: { fps: 7, loop: false },
  sliding: { fps: 1, loop: false },
  dash: { fps: 13, loop: false },
  damage: { fps: 1, loop: false }
};

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

const staticI18n = {
  distance: { ja: "距離", en: "Distance" },
  best: { ja: "最高", en: "Best" },
  multiplier: { ja: "倍率", en: "Mult" },
  jump: { ja: "ジャンプ", en: "Jump" },
  slide: { ja: "スライド", en: "Slide" },
  dash: { ja: "ダッシュ", en: "Dash" },
  restart: { ja: "再走", en: "Restart" },
  save: { ja: "保存", en: "Save" },
  upgrades: { ja: "強化", en: "Upgrades" },
  factory: { ja: "工場", en: "Factory" },
  prestige: { ja: "転生", en: "Prestige" },
  equipment: { ja: "装備", en: "Equipment" },
  missions: { ja: "任務", en: "Missions" },
  research: { ja: "研究", en: "Research" }
};

const englishAreaNames = {
  草原: "Grassland",
  砂漠: "Desert",
  雪山: "Snow Mountain",
  火山: "Volcano",
  未来都市: "Future City",
  宇宙: "Space",
  ブラックホール: "Black Hole",
  神界: "Aether Realm",
  無限空間: "Infinite Space"
};

const englishTextPairs = [
  ["ラン中の宝箱、ボス報酬、リワードから入手できます。", "Get chests from runs, boss rewards, and rewards."],
  ["コイン、通常強化、装備、宝箱、宝石、研究ポイントをリセットし、永続強化用のPRを得ます。転生ごとに通常強化・放置施設・研究上限が+1されます。", "Reset coins, normal upgrades, equipment, chests, gems, and research points to gain PR for permanent upgrades. Each prestige raises upgrade, facility, and research caps by +1."],
  ["コインと通常強化をリセットし、永続強化用のPRを得ます。", "Reset coins and normal upgrades to gain PR for permanent upgrades."],
  ["5分間、獲得と放置のコインが2倍になります。", "Earned and idle coins are doubled for 5 minutes."],
  ["待機中の宝箱を1個だけ準備完了にします。", "Finish one waiting chest instantly."],
  ["銀宝箱相当の装備を1つ獲得します。", "Get one equipment item equal to a Silver Chest."],
  ["コインを毎秒生産する基本施設。", "Basic facility that produces coins every second."],
  ["コイン工場より高効率でコインを生産する上位施設。", "Advanced facility that produces coins more efficiently than a Coin Factory."],
  ["大量のコインを生産する終盤向け施設。", "Late-game facility that produces a large amount of coins."],
  ["宝石を少量ずつ採掘する基本施設。", "Basic facility that mines gems gradually."],
  ["鉱山より効率よく宝石を採掘する上位施設。", "Advanced facility that mines gems more efficiently than a Mine."],
  ["宝石を人工生成する高出力施設。", "High-output facility that synthesizes gems."],
  ["研究ポイントを少しずつ生産する基本施設。", "Basic facility that slowly produces research points."],
  ["研究所より多くの研究ポイントを生産する上位施設。", "Advanced facility that produces more research points than a Lab."],
  ["自動ランナーが走行し、コインを持ち帰る施設。", "Auto runners travel and bring back coins."],
  ["長距離用の自動ランナーで、ロボット工場より高収入。", "Long-distance auto runners that earn more than the Robot Factory."],
  ["超小型ロボットを製造し、直接獲得コイン倍率を増やす施設。", "Build micro robots that follow the player and increase direct coin gains."],
  ["高性能な超小型ロボットで、直接獲得コイン倍率をさらに伸ばす施設。", "Build advanced micro robots that further increase direct coin gains."],
  ["草原ボスの粘液核解析から、砂漠ボスの砂装甲を少しだけ崩しやすくします。Lv5でも時々1枚余分に削れる程度です。", "Analyze the Grassland boss core to slightly improve Sand Armor breaks against the Desert boss. Even Lv5 only sometimes removes one extra layer."],
  ["砂漠ボスの発熱器官を応用し、雪山ボスの凍結オーラの持続をわずかに短くします。", "Apply the Desert boss heat organ to slightly shorten the Snow Mountain boss freeze aura."],
  ["雪山ボスの冷却コアから耐熱装甲を作り、火山ボスの追加ダメージを低確率で抑えます。", "Build heat plating from the Snow Mountain boss cooling core to rarely reduce Volcano boss bonus damage."],
  ["火山ボスの硬質外殻解析から、未来都市ボスのエネルギー盾を少しだけ貫通しやすくします。", "Analyze the Volcano boss shell to slightly improve pierce chance against Future City energy shields."],
  ["未来都市ボスの制御回路を応用し、宇宙ボスの重力反転波をまれに受け流します。", "Apply the Future City boss control circuit to rarely deflect Space boss gravity waves."],
  ["宇宙ボスの軌道データから、ブラックホールボスの吸引をほんの少し弱めます。", "Use Space boss orbital data to slightly reduce Black Hole boss pull."],
  ["ブラックホールボスの特異点残滓で、神界ボスの再生間隔をわずかに遅らせます。", "Use Black Hole singularity residue to slightly delay Aether boss regeneration."],
  ["神界ボスの神気波形から、無限空間ボスの位相化時間を少しだけ短くします。", "Use Aether boss wave data to slightly shorten Infinite Space boss phasing."],
  ["宝箱から装備を獲得できます。", "Open chests to get equipment."],
  ["待機時間が終わった宝箱", "Ready chests"],
  ["開封可能な宝箱を全開封", "Open All Ready Chests"],
  ["100万コインで転生", "Prestige at 1,000,000 coins"],
  ["リワード: 宝箱即開封", "Reward: Instant Chest"],
  ["リワード: コイン2倍", "Reward: Coin x2"],
  ["リワード: 無料ガチャ", "Reward: Free Gacha"],
  ["高速コインプレス", "High-Speed Coin Press"],
  ["エリートランナー工場", "Elite Runner Factory"],
  ["量子造幣所", "Quantum Mint"],
  ["深層鉱山", "Deep Mine"],
  ["結晶炉", "Crystal Forge"],
  ["量子研究所", "Quantum Lab"],
  ["転生で上限 +1", "Prestige raises cap +1"],
  ["現在上限", "Current Cap"],
  ["転生後", "After Prestige"],
  ["装備なし", "No Equipment"],
  ["全装備", "All Gear"],
  ["最大HP", "Max HP"],
  ["アイテム出現率", "Item Rate"],
  ["コンボ倍率", "Combo Multiplier"],
  ["ロボット工場", "Robot Factory"],
  ["コイン工場", "Coin Factory"],
  ["スピード", "Speed"],
  ["ジャンプ", "Jump"],
  ["コイン倍率", "Coin Multiplier"],
  ["自動回復", "Auto Heal"],
  ["宝箱速度", "Chest Speed"],
  ["宝箱率", "Chest Rate"],
  ["広告倍率", "Ad Multiplier"],
  ["獲得コイン", "Coin Gain"],
  ["レア率", "Rare Rate"],
  ["砂王対策", "Sand King Counter"],
  ["凍結対策", "Freeze Counter"],
  ["灼熱対策", "Heat Counter"],
  ["シールド解析", "Shield Analysis"],
  ["重力アンカー", "Gravity Anchor"],
  ["虚空テザー", "Void Tether"],
  ["神気封印", "Aether Seal"],
  ["位相アンカー", "Phase Anchor"],
  ["研究ツリー", "Research Tree"],
  ["通常強化", "Upgrades"],
  ["放置施設", "Idle Facilities"],
  ["放置倍率", "Idle Multiplier"],
  ["研究ポイント", "Research Points"],
  ["研究/秒", "LAB/s"],
  ["宝石/秒", "GEM/s"],
  ["コイン/秒", "COIN/s"],
  ["研究Lv合計", "Total Research Lv"],
  ["Lv合計", "Total Lv"],
  ["所持PR", "Owned PR"],
  ["直接コイン倍率", "Direct Coin Mult"],
  ["直接コイン", "Direct Coin"],
  ["ロボット工場系", "Robot Factories"],
  ["コイン工場系", "Coin Factories"],
  ["研究所系", "Labs"],
  ["鉱山系", "Mines"],
  ["開封可能", "Ready"],
  ["獲得予定", "Expected Gain"],
  ["木宝箱", "Wood Chest"],
  ["銀宝箱", "Silver Chest"],
  ["金宝箱", "Gold Chest"],
  ["虹宝箱", "Rainbow Chest"],
  ["神宝箱", "God Chest"],
  ["宝箱なし", "No Chests"],
  ["開封できます。", "Ready to open."],
  ["開封", "Open"],
  ["全開封", "Open All"],
  ["装備中", "Equipped"],
  ["未装備", "Not Equipped"],
  ["現在:", "Current:"],
  ["任務と実績", "Missions & Achievements"],
  ["達成済み", "Completed"],
  ["未達成", "Not Completed"],
  ["受取済", "Claimed"],
  ["受取", "Claim"],
  ["本格研究まで", "Research core in"],
  ["砂装甲対策", "Sand Armor Counter"],
  ["凍結時間", "Freeze Time"],
  ["灼熱軽減", "Heat Reduction"],
  ["盾対策", "Shield Counter"],
  ["重力波耐性", "Gravity Wave Resist"],
  ["吸引軽減", "Pull Reduction"],
  ["再生遅延", "Regen Delay"],
  ["位相短縮", "Phase Shorten"],
  ["初ジャンプ", "First Jump"],
  ["500m走る", "Run 500m"],
  ["コイン1000枚", "Collect 1,000 coins"],
  ["宝箱1個", "Open 1 chest"],
  ["敵20体", "Defeat 20 enemies"],
  ["100000m走る", "Run 100,000m"],
  ["ボス20体", "Defeat 20 bosses"],
  ["転生1回", "Prestige once"],
  ["アンテナ", "Antenna"],
  ["ブーツ", "Boots"],
  ["コア", "Core"],
  ["チャーム", "Charm"],
  ["アクセサリー", "Accessory"],
  ["研究所", "Lab"],
  ["鉱山", "Mine"],
  ["磁石", "Magnet"],
  ["ダッシュ", "Dash"],
  ["速度", "Speed"],
  ["跳躍", "Jump"],
  ["獲得", "Gain"],
  ["コイン", "Coin"],
  ["宝石", "Gem"],
  ["宝箱", "Chest"],
  ["広告", "Ad"],
  ["リワード", "Reward"],
  ["放置", "Idle"],
  ["吸収範囲", "Range"],
  ["持続", "Duration"],
  ["秒ごと", "s interval"],
  ["未開放", "Locked"],
  ["上限", "Cap"],
  ["出現", "Spawn"],
  ["級", " class"],
  ["日替", "Daily"],
  ["毎日", "Daily"],
  ["週間", "Weekly"],
  ["残り", "Left"],
  ["所持", "Owned"],
  ["次", "Next"],
  ["転生 /", " prestiges /"],
  ["回", " times"],
  ["強化", "Upgrade"],
  ["建設", "Build"],
  ["永続Lv", "Permanent Lv"],
  ["永続", "Permanent"],
  ["広告を見る", "Watch Ad"],
  ["転生", "Prestige"],
  ["装備", "Equipment"],
  ["任務", "Mission"],
  ["研究", "Research"],
  ["購入", "Buy"],
  ["生産", "Produces"],
  ["役割", "Role"],
  ["捨てる", "Discard"],
  ["草原", "Grassland"],
  ["砂漠", "Desert"],
  ["雪山", "Snow Mountain"],
  ["火山", "Volcano"],
  ["未来都市", "Future City"],
  ["宇宙", "Space"],
  ["ブラックホール", "Black Hole"],
  ["神界", "Aether Realm"],
  ["無限空間", "Infinite Space"],
  ["木", "Wood"],
  ["銀", "Silver"],
  ["金", "Gold"],
  ["虹", "Rainbow"],
  ["神", "God"],
  ["頭", "Head"],
  ["靴", "Boots"],
  ["胴", "Body"],
  ["秒", "s"],
  ["個", ""],
  ["回", " times"]
].sort((a, b) => b[0].length - a[0].length);

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
let factoryView = "coins";
let equipmentView = "chests";
let canvasWidth = 960;
let canvasHeight = 420;
let groundY = 340;
let lastFrame = performance.now();
let autosaveTimer = 0;
let uiTimer = 0;
let messageTimer = 0;
let musicScene = "run";

const player = {
  x: 112,
  y: 0,
  w: 36,
  h: 48,
  vy: 0,
  jumpsUsed: 0,
  slideTimer: 0,
  invulnerable: 0,
  regenTimer: 0,
  damageTimer: 0,
  animationKey: "running",
  animationStartedAt: performance.now()
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
  giantTimer: 0,
  timeStop: 0,
  chillTimer: 0,
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

const inputState = {
  jumpHolding: false,
  jumpStartedAt: 0,
  jumpActive: false,
  jumpMaxVelocity: 0,
  jumpAppliedVelocity: 0,
  slideHolding: false,
  pointerStartX: 0,
  pointerStartY: 0,
  pointerStartedAt: 0,
  pointerSlideActive: false,
  pointerJumpActive: false
};

const robotSprite = {
  image: new Image(),
  loaded: false,
  frames: defaultRobotFrames
};

const music = {
  unlocked: false,
  currentKey: "",
  current: null
};

let currentLanguage = "ja";

init();

function init() {
  initLanguage();
  loadSpriteAssets();
  applyOfflineProgress();
  ensureMissions();
  enforceEquipmentLimits();
  resetRun();
  bindEvents();
  resizeCanvas();
  renderPanel();
  updateHud();
  logEvent("RUN START");
  requestAnimationFrame(loop);
}

function initLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const hasSavedLanguage = savedLanguage === "ja" || savedLanguage === "en";
  const initialLanguage = LANGUAGE_MODE === "en" ? "en" : hasSavedLanguage ? savedLanguage : "ja";
  setLanguage(initialLanguage, { persist: false, refresh: false });
  if (LANGUAGE_MODE !== "en" && !hasSavedLanguage) {
    document.getElementById("languageOverlay")?.classList.remove("hidden");
  }
}

function setLanguage(language, options = {}) {
  const { persist = true, refresh = true } = options;
  const nextLanguage = LANGUAGE_MODE === "en" ? "en" : language;
  if (nextLanguage !== "ja" && nextLanguage !== "en") return;
  currentLanguage = nextLanguage;
  document.documentElement.lang = currentLanguage;
  document.documentElement.dataset.currentLanguage = currentLanguage;
  if (persist && LANGUAGE_MODE !== "en") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  }
  if (currentLanguage === "en") {
    document.title = "Infinite Runner Factory";
  }
  applyStaticLanguage();
  document.getElementById("languageOverlay")?.classList.add("hidden");
  if (refresh) {
    renderPanel();
    updateHud();
    logEvent("RUN START");
  }
}

function applyStaticLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const entry = staticI18n[element.dataset.i18n];
    if (entry) element.textContent = entry[currentLanguage] || entry.ja;
  });
}

function translateText(value) {
  if (currentLanguage !== "en") return value;
  let output = String(value);
  for (const [source, target] of englishTextPairs) {
    output = output.split(source).join(target);
  }
  return output;
}

function localizeElement(root) {
  if (currentLanguage !== "en" || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    node.nodeValue = translateText(node.nodeValue);
  }
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
    currentPrestigeDistance: 0,
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
    settings: {
      bgmEnabled: true
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

function buildFactoryDefs() {
  return factoryAreaTiers.flatMap((tier, tierIndex) => (
    factoryTemplates.map((template, templateIndex) => {
      const id = tierIndex === 0 ? template.id : `${tier.key}_${template.id}`;
      const currencyScale = template.currency === "gems"
        ? Math.max(1, Math.pow(tier.cost, 0.55))
        : tier.cost;
      const def = {
        ...template,
        id,
        name: tierIndex === 0 ? template.name : `${tier.name}${template.name}`,
        base: Math.ceil(template.base * currencyScale),
        growth: Number((template.growth + tierIndex * 0.004).toFixed(3)),
        areaIndex: tierIndex,
        areaName: tier.name,
        areaKey: tier.key,
        color: template.category === "runner" ? runnerColor(tier, templateIndex) : tier.color,
        unlockOrder: tierIndex * 100 + templateIndex
      };
      if (template.outputType) {
        def.output = (lv) => lv * Math.pow(template.outputGrowth + tierIndex * 0.0015, lv) * template.outputBase * tier.output;
      }
      if (template.category === "runner") {
        def.directCoinBonus = (lv) => lv * template.directCoinBonus * (1 + tierIndex * 0.28);
      }
      return def;
    })
  ));
}

function runnerColor(tier, templateIndex) {
  const tierIndex = factoryAreaTiers.indexOf(tier);
  const hue = (tierIndex * 37 + templateIndex * 149) % 360;
  return `hsl(${hue} 82% 62%)`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const merged = mergeDefaults(parsed, defaultState());
    if (parsed.currentPrestigeDistance === undefined) {
      merged.currentPrestigeDistance = merged.bestDistance || 0;
    }
    normalizeResearchTree(merged);
    enforceLevelCaps(merged);
    return merged;
  } catch (error) {
    console.warn(error);
    return defaultState();
  }
}

function normalizeResearchTree(targetState = state) {
  const allowed = new Set(researchDefs.map((def) => def.id));
  targetState.researchTree = targetState.researchTree || {};
  for (const key of Object.keys(targetState.researchTree)) {
    if (!allowed.has(key)) delete targetState.researchTree[key];
  }
  for (const def of researchDefs) {
    if (targetState.researchTree[def.id] === undefined) {
      targetState.researchTree[def.id] = 0;
    }
  }
}

function enforceLevelCaps(targetState = state) {
  const cap = BASE_UPGRADE_CAP + Number(targetState.prestigeCount || 0);
  clampLevelGroup(targetState.upgrades, upgradeDefs, cap);
  clampLevelGroup(targetState.factories, factoryDefs, cap);
  clampLevelGroup(targetState.researchTree, researchDefs, cap);
}

function clampLevelGroup(group, defs, cap) {
  if (!group) return;
  for (const def of defs) {
    if (Number(group[def.id] || 0) > cap) {
      group[def.id] = cap;
    }
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

function loadSpriteAssets() {
  robotSprite.image.onload = () => {
    robotSprite.loaded = true;
  };
  robotSprite.image.onerror = () => {
    robotSprite.loaded = false;
  };
  robotSprite.image.src = `${ASSET_ROOT}image/kogatarobotto.png`;

  fetch(`${ASSET_ROOT}image/kogatarobotto.xml`)
    .then((response) => {
      if (!response.ok) throw new Error("sprite xml not found");
      return response.text();
    })
    .then((xmlText) => {
      const frames = parseRobotAtlas(xmlText);
      if (Object.keys(frames).length > 0) {
        robotSprite.frames = mergeDefaults(frames, defaultRobotFrames);
      }
    })
    .catch(() => {
      robotSprite.frames = defaultRobotFrames;
    });
}

function parseRobotAtlas(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const frames = {};
  doc.querySelectorAll("SubTexture").forEach((node) => {
    const name = node.getAttribute("name") || "";
    const match = name.match(/kogatarobotto\s+([a-z]+)\d+/i);
    if (!match) return;
    const key = match[1];
    if (!frames[key]) frames[key] = [];
    frames[key].push({
      name,
      x: Number(node.getAttribute("x") || 0),
      y: Number(node.getAttribute("y") || 0),
      w: Number(node.getAttribute("width") || 1),
      h: Number(node.getAttribute("height") || 1),
      frameX: Number(node.getAttribute("frameX") || 0),
      frameY: Number(node.getAttribute("frameY") || 0),
      frameW: Number(node.getAttribute("frameWidth") || node.getAttribute("width") || 1),
      frameH: Number(node.getAttribute("frameHeight") || node.getAttribute("height") || 1)
    });
  });
  for (const list of Object.values(frames)) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return frames;
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      startJumpHold();
    }
    if (event.code === "ArrowDown") {
      event.preventDefault();
      startSlideHold();
    }
    if (event.code === "KeyD") {
      event.preventDefault();
      dash();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      releaseJumpHold();
    }
    if (event.code === "ArrowDown") {
      event.preventDefault();
      cancelSlideHold();
    }
  });

  bindHoldButton(document.getElementById("jumpBtn"), startJumpHold, releaseJumpHold);
  bindHoldButton(document.getElementById("slideBtn"), startSlideHold, cancelSlideHold);
  document.getElementById("dashBtn").addEventListener("click", dash);
  document.getElementById("restartBtn").addEventListener("click", restartFromButton);
  document.getElementById("overlayRestart").addEventListener("click", restartFromButton);
  document.getElementById("saveBtn").addEventListener("click", saveState);
  document.getElementById("bgmBtn").addEventListener("click", toggleBgm);
  document.querySelectorAll("[data-language-choice]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.languageChoice));
  });

  canvas.addEventListener("pointerdown", (event) => {
    inputState.pointerStartX = event.clientX;
    inputState.pointerStartY = event.clientY;
    inputState.pointerStartedAt = performance.now();
    inputState.pointerSlideActive = false;
    inputState.pointerJumpActive = false;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    const dx = event.clientX - inputState.pointerStartX;
    const dy = event.clientY - inputState.pointerStartY;
    if (!inputState.pointerJumpActive && !inputState.pointerSlideActive && dy < -22 && Math.abs(dy) > Math.abs(dx)) {
      inputState.pointerJumpActive = true;
      startJumpHold(inputState.pointerStartedAt);
    }
    if (!inputState.pointerSlideActive && dy > 22 && Math.abs(dy) > Math.abs(dx)) {
      inputState.pointerSlideActive = true;
      startSlideHold();
    }
  });
  canvas.addEventListener("pointerup", (event) => {
    const dx = event.clientX - inputState.pointerStartX;
    const dy = event.clientY - inputState.pointerStartY;
    const holdSeconds = (performance.now() - inputState.pointerStartedAt) / 1000;
    if (inputState.pointerSlideActive) {
      cancelSlideHold();
      inputState.pointerSlideActive = false;
      return;
    }
    if (inputState.pointerJumpActive) {
      releaseJumpHold();
      inputState.pointerJumpActive = false;
      return;
    }
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 22) {
      if (dy < 0) performJump(holdSeconds);
      else startSlideHold();
    } else {
      performJump(holdSeconds);
    }
  });
  canvas.addEventListener("pointercancel", () => {
    if (inputState.pointerSlideActive) cancelSlideHold();
    if (inputState.pointerJumpActive) releaseJumpHold();
    inputState.pointerSlideActive = false;
    inputState.pointerJumpActive = false;
  });

  document.querySelector(".tab-bar").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (!button) return;
    activeTab = button.dataset.tab;
    musicScene = activeTab;
    syncBgm();
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
    if (action === "factoryFilter") factoryView = id || "coins";
    if (action === "buyPermanent") buyPermanent(id);
    if (action === "buyResearch") buyResearch(id);
    if (action === "prestige") prestige();
    if (action === "openChest") openChest(id);
    if (action === "openAllChests") openAllChests();
    if (action === "equip") equipItem(id);
    if (action === "discardEquipment") discardEquipment(id);
    if (action === "equipmentFilter") equipmentView = id || "chests";
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

function bindHoldButton(button, onDown, onUp) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    onDown();
  });
  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    onUp();
  });
  button.addEventListener("pointercancel", onUp);
  button.addEventListener("pointerleave", () => {
    if (document.pointerLockElement) return;
    onUp();
  });
}

function unlockAudio() {
  if (music.unlocked) return;
  music.unlocked = true;
  syncBgm();
}

function toggleBgm() {
  state.settings.bgmEnabled = !state.settings.bgmEnabled;
  if (!state.settings.bgmEnabled) {
    stopBgm();
    logEvent("BGM OFF");
  } else {
    unlockAudio();
    syncBgm();
    logEvent("BGM ON");
  }
  updateHud();
}

function syncBgm() {
  if (!state.settings.bgmEnabled || !music.unlocked) return;
  const key = currentMusicKey();
  if (key === music.currentKey) return;
  playBgm(key);
}

function currentMusicKey() {
  if (run.gameOver || musicScene === "result") return "result";
  if (sceneMusicFiles[musicScene]) return musicScene;
  return `area:${areaIndex()}`;
}

function musicUrlForKey(key) {
  if (key.startsWith("area:")) {
    const index = Number(key.split(":")[1] || 0);
    return `${MUSIC_ROOT}${areaMusicFiles[index] || areaMusicFiles[0]}`;
  }
  const file = sceneMusicFiles[key] || sceneMusicFiles.menu;
  return `${MUSIC_ROOT}${file}`;
}

function playBgm(key) {
  stopBgm();
  const audio = new Audio(musicUrlForKey(key));
  audio.loop = true;
  audio.volume = 0.42;
  music.current = audio;
  music.currentKey = key;
  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch(() => {
      music.currentKey = "";
    });
  }
}

function stopBgm() {
  if (music.current) {
    music.current.pause();
    music.current.currentTime = 0;
  }
  music.current = null;
  music.currentKey = "";
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
  updateInputHolds();
  tickIdle(dt);
  tickChestTimers(dt);
  tickBoosts(dt);
  checkAchievements();

  if (messageTimer > 0) messageTimer -= dt;

  if (!run.gameOver) {
    updateRun(dt);
  }
  syncBgm();

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

function updateInputHolds() {
  if (!inputState.jumpHolding) return;
  const heldSeconds = (performance.now() - inputState.jumpStartedAt) / 1000;
  if (heldSeconds >= MAX_JUMP_HOLD_SECONDS) {
    releaseJumpHold();
  }
}

function updateRun(dt) {
  const stats = getStats();
  const dashMult = run.dashTimer > 0 ? 1.9 : 1;
  const eventSpeed = run.event === "fever" ? 1.25 : 1;
  const chillMult = run.chillTimer > 0 ? 0.78 : 1;
  const stopped = run.timeStop > 0;
  const speedMeters = stats.speed * dashMult * eventSpeed * chillMult;
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
  if (run.giantTimer > 0) run.giantTimer -= dt;
  if (run.timeStop > 0) run.timeStop -= dt;
  if (run.chillTimer > 0) run.chillTimer -= dt;
  if (player.invulnerable > 0) player.invulnerable -= dt;
  if (player.damageTimer > 0) player.damageTimer -= dt;

  if (stats.regenEvery > 0) {
    player.regenTimer += dt;
    if (player.regenTimer >= stats.regenEvery && run.hp < stats.maxHp) {
      player.regenTimer = 0;
      run.hp += 1;
      logEvent("HP RECOVERED");
    }
  }

  state.bestDistance = Math.max(state.bestDistance, run.distance);
  state.currentPrestigeDistance = Math.max(state.currentPrestigeDistance || 0, run.distance);
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

  if (player.jumpsUsed > 0) {
    player.vy += (run.gravityFlip ? -1 : 1) * 12 * stats.jumpPower * dt;
  }
}

function updateObjects(dt, scrollSpeed, stats) {
  const magnetRadius = stats.magnetRadius * (run.event === "coinRain" ? 1.35 : 1);
  const playerRect = getPlayerRect();
  const removed = new Set();

  for (const obj of objects) {
    obj.x -= scrollSpeed * dt;
    if (obj.hitCooldown > 0) obj.hitCooldown -= dt;
    if (obj.type === "enemy" || obj.type === "boss") {
      updateEnemyTrait(obj, dt, playerRect);
    }

    if (obj.type === "boss" && obj.x + obj.w < 0) {
      damagePlayer({ force: true });
      if (run.gameOver) continue;
      obj.x = canvasWidth + 120;
      obj.y = groundY - obj.h;
      player.invulnerable = Math.max(player.invulnerable, 0.8);
      logEvent("BOSS ESCAPED");
      continue;
    }

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
      if ((obj.type === "enemy" || obj.type === "boss") && obj.phased) continue;
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
          if (damageEnemy(obj, isInvincible() ? 2 : 1)) {
            defeatEnemy(obj);
            removed.add(obj);
          }
        } else {
          damagePlayer({ source: obj });
          obj.x -= 85;
        }
      } else if (obj.type === "boss") {
        if (run.dashTimer > 0) {
          if (obj.hitCooldown <= 0 && damageEnemy(obj, 1)) {
            defeatBoss(obj);
            removed.add(obj);
          }
          obj.hitCooldown = Math.max(obj.hitCooldown, 0.72);
          player.vy = run.gravityFlip ? 360 : -360;
          burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#f2b84b", 10);
        } else if (canStomp(obj) || run.skillShield > 0 || player.invulnerable > 0.05) {
          if (damageEnemy(obj, run.skillShield > 0 ? 2 : 1)) {
            defeatBoss(obj);
            removed.add(obj);
          }
          player.vy = run.gravityFlip ? 480 : -480;
          burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#ef6b65", 14);
          gainCombo(3);
        } else {
          damagePlayer({ source: obj });
          obj.x -= 90;
        }
      }
    }
  }

  objects = objects.filter((obj) => obj.x > -220 && !removed.has(obj));
}

function damageEnemy(obj, amount = 1) {
  if (obj.hitCooldown > 0) return false;
  const armorPierced = obj.trait === "sandArmor" && researchChance("sandBreaker");
  if (obj.armor > 0 && !armorPierced) {
    obj.armor -= 1;
    obj.hitCooldown = 0.28;
    burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#d7b878", 8);
    return false;
  }
  if (obj.armor > 0) {
    obj.armor -= 1;
    burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#f2b84b", 10);
  }
  const shieldPierced = obj.trait === "energyShield" && researchChance("shieldPiercer");
  if (obj.shield > 0 && !shieldPierced) {
    obj.shield -= 1;
    obj.hitCooldown = 0.38;
    burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#48bde7", 10);
    return false;
  }
  if (obj.shield > 0) {
    obj.shield -= 1;
    burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#9fd9ff", 10);
  }
  obj.hp = (obj.hp || 1) - amount;
  obj.hitCooldown = 0.22;
  return obj.hp <= 0;
}

function updateEnemyTrait(obj, dt, playerRect) {
  const dx = (playerRect.x + playerRect.w / 2) - (obj.x + obj.w / 2);
  const dy = (playerRect.y + playerRect.h / 2) - (obj.y + obj.h / 2);
  const distance = Math.hypot(dx, dy);

  if (obj.trait === "frostAura" && distance < 135) {
    const duration = (obj.type === "boss" ? 1.6 : 0.85) * researchReduction("frostInsulation");
    run.chillTimer = Math.max(run.chillTimer, duration);
  }
  if (obj.trait === "voidPull" && distance < 190) {
    const pullScale = researchReduction("voidTether");
    obj.x -= 34 * pullScale * dt;
    player.vy += Math.sign(dy || 1) * 70 * pullScale * dt;
  }
  if (obj.trait === "gravityPulse") {
    obj.pulseTimer = (obj.pulseTimer || 1.6) - dt;
    if (distance < 120 && obj.pulseTimer <= 0) {
      if (!researchChance("gravityAnchor")) {
        run.gravityFlip = !run.gravityFlip;
        player.vy *= -0.25;
      }
      obj.pulseTimer = obj.type === "boss" ? 4.5 : 3.2;
      logEvent("GRAVITY PULSE");
    }
  }
  if (obj.trait === "regen" && obj.hp && obj.maxHp && obj.hp < obj.maxHp) {
    obj.regenTimer = (obj.regenTimer || (1.5 + researchLevel("aetherSeal") * 0.12)) - dt;
    if (obj.regenTimer <= 0) {
      obj.hp = Math.min(obj.maxHp, obj.hp + 1);
      obj.regenTimer = (obj.type === "boss" ? 2.4 : 3.5) + researchLevel("aetherSeal") * 0.12;
    }
  }
  if (obj.trait === "phase") {
    obj.phaseTimer = (obj.phaseTimer || 0) + dt;
    obj.phased = Math.sin(obj.phaseTimer * 2.4) > 0.62 + researchLevel("phaseAnchor") * 0.01;
  }
  if (obj.type === "boss") {
    updateBossGimmick(obj, dt, distance);
  }
}

function updateBossGimmick(obj, dt, distance) {
  obj.bossTimer = (obj.bossTimer || 2) - dt;
  if (obj.bossGimmick === "sandBurrow") {
    obj.y = groundY - obj.h - Math.abs(Math.sin(performance.now() / 620)) * 22;
    if (obj.bossTimer <= 0) {
      obj.phased = true;
      obj.hitCooldown = Math.max(obj.hitCooldown, 0.75);
      obj.bossTimer = 4.4;
    } else if (obj.bossTimer < 3.4) {
      obj.phased = false;
    }
  }
  if (obj.bossGimmick === "frostPrison" && distance < 210) {
    run.chillTimer = Math.max(run.chillTimer, 1.2 * researchReduction("frostInsulation"));
  }
  if (obj.bossGimmick === "lavaMeteor" && obj.bossTimer <= 0) {
    objects.push({ type: "obstacle", kind: "meteor", x: obj.x - 90, y: groundY - random(130, 250), w: 34, h: 34, color: "#ef6b65" });
    obj.bossTimer = 3.1;
  }
  if (obj.bossGimmick === "laserGrid" && obj.bossTimer <= 0) {
    objects.push({ type: "obstacle", kind: "laser", x: obj.x - 80, y: groundY - 128, w: 24, h: 88, color: "#ef6b65" });
    obj.bossTimer = 3.6;
  }
  if (obj.bossGimmick === "gravitySurge" && obj.bossTimer <= 0) {
    if (!researchChance("gravityAnchor")) {
      run.gravityFlip = !run.gravityFlip;
      player.vy *= -0.35;
    }
    obj.bossTimer = 5.2;
    logEvent("BOSS GRAVITY SURGE");
  }
  if (obj.bossGimmick === "singularity" && distance < 250) {
    player.vy += (run.gravityFlip ? -1 : 1) * 95 * researchReduction("voidTether") * dt;
  }
  if (obj.bossGimmick === "aetherRegen" && obj.hp < obj.maxHp) {
    obj.regenTimer = (obj.regenTimer || (1.6 + researchLevel("aetherSeal") * 0.12)) - dt;
    if (obj.regenTimer <= 0) {
      obj.hp = Math.min(obj.maxHp, obj.hp + 1);
      obj.regenTimer = 1.8 + researchLevel("aetherSeal") * 0.12;
    }
  }
  if (obj.bossGimmick === "infinitePhase") {
    obj.phaseTimer = (obj.phaseTimer || 0) + dt;
    obj.phased = Math.sin(obj.phaseTimer * 3) > 0.45 + researchLevel("phaseAnchor") * 0.01;
  }
  if (obj.bossGimmick === "slimeSplit" && obj.bossTimer <= 0 && (obj.spawnedMinions || 0) < 2) {
    objects.push(applyEnemyTraits({
      type: "enemy",
      kind: "slime",
      x: obj.x - 48,
      y: groundY - 30,
      w: 30,
      h: 30,
      color: "#75d05e"
    }, obj.areaIndex || 0));
    obj.spawnedMinions = (obj.spawnedMinions || 0) + 1;
    obj.bossTimer = 4.2;
  }
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
    objects.push(applyEnemyTraits({
      type: "enemy",
      kind,
      x,
      y: airborne ? groundY - 150 : groundY - 38,
      w: airborne ? 42 : 40,
      h: airborne ? 28 : 38,
      color: kind === "bird" ? area.accent : kind === "bomb" ? "#30333c" : "#75d05e"
    }, areaIndex()));
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

function applyEnemyTraits(obj, index) {
  const trait = areaEnemyTraits[index]?.id || "plain";
  obj.areaIndex = index;
  obj.trait = trait;
  obj.hitCooldown = obj.hitCooldown || 0;
  if (trait === "sandArmor") obj.armor = obj.type === "boss" ? 2 : 1;
  if (trait === "energyShield") obj.shield = obj.type === "boss" ? 2 : 1;
  if (trait === "gravityPulse") obj.pulseTimer = random(1.2, 2.8);
  if (trait === "regen") {
    obj.hp = obj.hp || (obj.type === "boss" ? obj.maxHp : 2);
    obj.maxHp = Math.max(obj.maxHp || obj.hp, obj.hp);
    obj.regenTimer = 1.5;
  }
  if (trait === "phase") {
    obj.phaseTimer = Math.random() * Math.PI * 2;
    obj.phased = false;
  }
  return obj;
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
  const index = areaIndex();
  const hp = 3 + index + Math.floor(run.distance / 10000);
  objects.push(applyEnemyTraits({
    type: "boss",
    kind: bossName(index),
    x: canvasWidth + 160,
    y: groundY - 100,
    w: 92,
    h: 100,
    hp,
    maxHp: hp,
    color: area.accent,
    areaIndex: index,
    bossGimmick: bossGimmicks[index]?.id || "slimeSplit",
    bossTimer: 1.8,
    hitCooldown: 0
  }, index));
  logEvent(`BOSS ${bossName(index).toUpperCase()}`);
}

function collectCoin(value, x, y) {
  const stats = getStats();
  const comboBoost = 1 + Math.min(stats.maxCombo - 1, run.combo * 0.012);
  const eventBoost = run.event === "coin3" ? 3 : run.event === "fever" ? 2 : 1;
  const adBoost = state.boosts.coinDouble > 0 ? 2 : 1;
  const gained = Math.ceil(value * stats.coinMultiplier * stats.directCoinMultiplier * comboBoost * eventBoost * adBoost);
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
    run.giantTimer = Math.max(run.giantTimer, 4);
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
  const coinReward = directCoinAmount(600 + areaIndex() * 350 + obj.maxHp * 90);
  const researchReward = Math.max(1, Math.ceil(0.5 + areaIndex() * 0.25));
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

function damagePlayer(options = {}) {
  if (!options.force && (player.invulnerable > 0 || run.skillShield > 0 || run.dashTimer > 0)) return;
  const damage = incomingDamageAmount(options);
  run.hp -= damage;
  run.combo = 0;
  player.invulnerable = 1.25;
  player.damageTimer = 0.45;
  restartPlayerAnimation("damage");
  burst(player.x + player.w / 2, player.y + player.h / 2, "#ef6b65", 12);
  if (run.hp <= 0) endRun();
  else logEvent(`DAMAGE -${damage} HP ${run.hp}`);
}

function incomingDamageAmount(options = {}) {
  const areaDamage = 1 + Math.floor(areaIndexForDistance(run.distance || 0) / 3);
  let traitBonus = options.source?.trait === "burning" ? 1 : 0;
  if (traitBonus > 0 && researchChance("heatPlating")) {
    traitBonus = 0;
  }
  return Math.max(1, Math.ceil(options.amount || areaDamage) + traitBonus);
}

function clearTemporaryEffects() {
  run.dashTimer = 0;
  run.skillShield = 0;
  run.giantTimer = 0;
  run.timeStop = 0;
  run.chillTimer = 0;
  run.gravityFlip = false;
  player.jumpsUsed = 0;
  player.slideTimer = 0;
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.jumpMaxVelocity = 0;
  inputState.jumpAppliedVelocity = 0;
  inputState.slideHolding = false;
  inputState.pointerSlideActive = false;
  inputState.pointerJumpActive = false;
}

function endRun() {
  run.gameOver = true;
  run.active = false;
  clearTemporaryEffects();
  musicScene = "result";
  syncBgm();
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
  musicScene = "run";
  syncBgm();
  logEvent("RUN START");
  updateHud();
}

function resetRun() {
  const stats = getStats();
  const startDistance = runStartDistance();
  run.active = true;
  run.gameOver = false;
  run.distance = startDistance;
  run.hp = stats.maxHp;
  run.combo = 0;
  run.dashTimer = 0;
  run.dashCooldown = 0;
  run.skillShield = 0;
  run.giantTimer = 0;
  run.timeStop = 0;
  run.chillTimer = 0;
  run.nextSpawn = 0.4;
  run.nextBossMark = Math.floor(startDistance / 1000) * 1000 + 1000;
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
  player.damageTimer = 0;
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.jumpMaxVelocity = 0;
  inputState.jumpAppliedVelocity = 0;
  inputState.slideHolding = false;
  inputState.pointerSlideActive = false;
  inputState.pointerJumpActive = false;
  restartPlayerAnimation("running");
  runOverlay.classList.add("hidden");
}

function startJumpHold(startedAt = performance.now()) {
  musicScene = "run";
  unlockAudio();
  if (run.gameOver) {
    resetRun();
    return;
  }
  if (inputState.jumpHolding) return;
  if (!beginJump()) return;
  inputState.jumpHolding = true;
  inputState.jumpStartedAt = startedAt;
}

function releaseJumpHold() {
  if (!inputState.jumpHolding) return;
  const heldSeconds = (performance.now() - inputState.jumpStartedAt) / 1000;
  finishHeldJump(heldSeconds);
  inputState.jumpHolding = false;
}

function performJump(heldSeconds = MAX_JUMP_HOLD_SECONDS) {
  musicScene = "run";
  unlockAudio();
  if (run.gameOver) {
    resetRun();
    return;
  }
  if (!beginJump()) return;
  finishHeldJump(heldSeconds);
}

function beginJump() {
  const stats = getStats();
  const maxJumps = 1 + (state.upgrades.jump >= 8 ? 1 : 0);
  if (player.jumpsUsed >= maxJumps) return false;
  const jumpVelocity = jumpVelocityCap(stats);
  if (jumpVelocity <= 0) return false;
  inputState.jumpActive = true;
  inputState.jumpMaxVelocity = jumpVelocity;
  inputState.jumpAppliedVelocity = jumpVelocity;
  player.vy = (run.gravityFlip ? 1 : -1) * jumpVelocity;
  player.jumpsUsed += 1;
  player.slideTimer = 0;
  inputState.slideHolding = false;
  restartPlayerAnimation("jump");
  state.stats.jumps += 1;
  gainCombo(0.2);
  return true;
}

function jumpVelocityCap(stats) {
  const upgradeVelocity = state.upgrades.jump * JUMP_UPGRADE_VELOCITY + (stats.equipmentJump || 0);
  return BASE_JUMP_VELOCITY + upgradeVelocity;
}

function finishHeldJump(heldSeconds) {
  if (!inputState.jumpActive) return;
  const effectiveSeconds = Math.max(
    MIN_JUMP_HOLD_SECONDS,
    Math.min(MAX_JUMP_HOLD_SECONDS, heldSeconds)
  );
  const holdRatio = effectiveSeconds / MAX_JUMP_HOLD_SECONDS;
  const targetVelocity = inputState.jumpMaxVelocity * holdRatio;
  const direction = run.gravityFlip ? 1 : -1;
  const currentUpwardVelocity = player.vy * direction;
  if (currentUpwardVelocity > targetVelocity) {
    player.vy = direction * targetVelocity;
  }
  inputState.jumpActive = false;
  inputState.jumpAppliedVelocity = targetVelocity;
}

function startSlideHold() {
  musicScene = "run";
  unlockAudio();
  if (run.gameOver) return;
  inputState.slideHolding = true;
  player.slideTimer = 0.55;
  restartPlayerAnimation("sliding");
  if (Math.abs(player.vy) < 1) {
    player.vy = run.gravityFlip ? -110 : 110;
  }
}

function cancelSlideHold() {
  inputState.slideHolding = false;
  player.slideTimer = 0;
}

function dash() {
  musicScene = "run";
  unlockAudio();
  if (run.gameOver || run.dashCooldown > 0) return;
  const duration = 1.2 + state.upgrades.dash * 0.18;
  run.dashTimer = duration;
  run.dashCooldown = Math.max(7, 16 - state.upgrades.dash * 0.25);
  restartPlayerAnimation("dash");
  logEvent("DASH");
}

function restartPlayerAnimation(key) {
  player.animationKey = key;
  player.animationStartedAt = performance.now();
}

function getStats() {
  const eq = equipmentBonuses();
  const idleMultiplier = 1 + (eq.idle || 0);
  return {
    speed: (5 * (1 + state.upgrades.speed * 0.02) * (1 + state.permanent.speed * 0.02) * (1 + (eq.speed || 0))),
    jumpPower: (1 + state.upgrades.jump * 0.04 + (eq.jump || 0)),
    equipmentJump: (eq.jump || 0) * BASE_JUMP_VELOCITY,
    maxHp: 1 + state.upgrades.hp + Math.floor(eq.hp || 0),
    coinMultiplier: (1 + state.upgrades.coin * 0.15) * (1 + state.permanent.coin * 0.05) * (1 + (eq.coin || 0)),
    directCoinMultiplier: 1 + runnerDirectCoinBonus(),
    magnetRadius: 44 + state.upgrades.magnet * 14,
    maxCombo: 2 + state.upgrades.combo * 0.15,
    regenEvery: state.upgrades.regen > 0 ? Math.max(10, 32 - state.upgrades.regen * 2) : 0,
    idleMultiplier
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
  const anchorRect = getPlayerAnchorRect();
  if (player.slideTimer > 0) return anchorRect;
  const visualRect = getPlayerSpriteVisualRect(anchorRect);
  if (!visualRect) {
    return {
      x: anchorRect.x - 3,
      y: run.gravityFlip ? anchorRect.y : anchorRect.y - 38,
      w: anchorRect.w + 6,
      h: anchorRect.h + 38
    };
  }
  return insetRect(visualRect, Math.min(7, visualRect.w * 0.14), Math.min(9, visualRect.h * 0.1));
}

function getPlayerAnchorRect() {
  const h = getPlayerHeight();
  const y = run.gravityFlip ? player.y : player.y + (48 - h);
  return { x: player.x + 4, y: y + 3, w: player.w - 8, h: h - 6 };
}

function getPlayerSpriteVisualRect(anchorRect) {
  if (!robotSprite.loaded) return null;
  const animation = playerAnimationKey();
  const frames = robotSprite.frames[animation] || robotSprite.frames.running;
  if (!frames || frames.length === 0) return null;
  const frame = currentPlayerFrame(animation, frames);
  const metrics = playerSpriteMetrics(anchorRect, frame);
  if (!metrics) return null;
  return {
    x: metrics.x,
    y: metrics.y,
    w: metrics.w,
    h: metrics.h
  };
}

function insetRect(rect, insetX, insetY) {
  const x = Math.min(insetX, rect.w / 2 - 1);
  const y = Math.min(insetY, rect.h / 2 - 1);
  return {
    x: rect.x + x,
    y: rect.y + y,
    w: Math.max(2, rect.w - x * 2),
    h: Math.max(2, rect.h - y * 2)
  };
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
  const cps = factoryOutputPerSecond("coins") * stats.idleMultiplier * adBoost;
  const gps = factoryOutputPerSecond("gems") * stats.idleMultiplier;
  const rps = factoryOutputPerSecond("research") * stats.idleMultiplier;
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

function normalUpgradeCap() {
  return BASE_UPGRADE_CAP + state.prestigeCount;
}

function factoryLevelCap() {
  return BASE_UPGRADE_CAP + state.prestigeCount;
}

function researchLevelCap() {
  return BASE_UPGRADE_CAP + state.prestigeCount;
}

function researchLevel(id) {
  return Number(state.researchTree[id] || 0);
}

function researchChance(id, perLevel = 0.02) {
  return Math.random() < researchLevel(id) * perLevel;
}

function researchReduction(id, perLevel = 0.02) {
  return Math.max(0.75, 1 - researchLevel(id) * perLevel);
}

function factoryOutput(def, level) {
  if (!def || !level) return 0;
  if (!def.outputType) return 0;
  return def.output ? def.output(level) : 0;
}

function factoryOutputPerSecond(outputType) {
  return factoryDefs.reduce((sum, def) => {
    if (def.outputType !== outputType) return sum;
    return sum + factoryOutput(def, state.factories[def.id] || 0);
  }, 0);
}

function runnerDirectCoinBonus() {
  return factoryDefs.reduce((sum, def) => {
    if (def.category !== "runner") return sum;
    const level = state.factories[def.id] || 0;
    return sum + (typeof def.directCoinBonus === "function" ? def.directCoinBonus(level) : 0);
  }, 0);
}

function directCoinAmount(amount) {
  return Math.ceil(amount * getStats().directCoinMultiplier);
}

function factoryEffect(def, level) {
  if (def.category === "runner") {
    const bonus = typeof def.directCoinBonus === "function" ? def.directCoinBonus(level) : 0;
    return `直接コイン x${(1 + bonus).toFixed(3)}`;
  }
  const value = factoryOutput(def, level);
  const unit = {
    coins: "COIN/秒",
    gems: "GEM/秒",
    research: "LAB/秒"
  }[def.outputType] || "/秒";
  const detail = def.detail && level > 0 ? ` / ${def.detail(level)}` : "";
  const decimals = def.outputType === "coins"
    ? value > 0 && value < 10 ? 1 : 0
    : 2;
  return `${formatNumber(value, decimals)} ${unit}${detail}`;
}

function factoryOutputLabel(outputType) {
  return {
    coins: "コイン",
    gems: "宝石",
    research: "研究ポイント",
    runner: "直接コイン倍率"
  }[outputType] || outputType;
}

function visibleFactoryDefs(category = factoryView) {
  const visible = new Set();
  const categoryDefs = factoryDefs
    .filter((def) => def.category === category)
    .sort((a, b) => a.unlockOrder - b.unlockOrder);
  for (const def of categoryDefs) {
    const level = state.factories[def.id] || 0;
    const cost = upgradeCost(def, level);
    if (level > 0 || (isFactoryVisibleCandidate(def, categoryDefs) && (state[def.currency] || 0) >= cost)) {
      visible.add(def.id);
    }
  }
  const next = categoryDefs.find((def) => !visible.has(def.id) && isFactoryVisibleCandidate(def, categoryDefs));
  if (next) visible.add(next.id);
  return categoryDefs
    .filter((def) => visible.has(def.id))
    .sort((a, b) => a.unlockOrder - b.unlockOrder);
}

function isFactoryVisibleCandidate(def, categoryDefs) {
  if (def.areaIndex > areaIndexForDistance(state.currentPrestigeDistance || 0)) return false;
  const index = categoryDefs.findIndex((entry) => entry.id === def.id);
  if (index <= 0) return true;
  const previous = categoryDefs[index - 1];
  return (state.factories[previous.id] || 0) >= 1;
}

function upgradeCost(def, level) {
  return Math.ceil(def.base * Math.pow(def.growth, level));
}

function buyUpgrade(id) {
  const def = upgradeDefs.find((entry) => entry.id === id);
  if (!def) return;
  const level = state.upgrades[id] || 0;
  const cap = normalUpgradeCap();
  if (level >= cap) {
    logEvent(`UPGRADE CAP Lv${cap}`);
    return;
  }
  const cost = upgradeCost(def, level);
  if (!spend(def.currency, cost)) return;
  state.upgrades[id] = level + 1;
  logEvent(`${def.name} Lv${level + 1}`);
}

function buyFactory(id) {
  const def = factoryDefs.find((entry) => entry.id === id);
  if (!def) return;
  const level = state.factories[id] || 0;
  const cap = factoryLevelCap();
  if (level >= cap) {
    logEvent(`FACTORY CAP Lv${cap}`);
    return;
  }
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
  const cap = researchLevelCap();
  if (level >= cap) {
    logEvent(`RESEARCH CAP Lv${cap}`);
    return;
  }
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
  state.gems = 0;
  state.research = 0;
  state.currentPrestigeDistance = 0;
  state.upgrades = objectFromDefs(upgradeDefs);
  state.equipment = [];
  state.equipped = {};
  state.chests = [];
  addMissionProgress("weeklyPrestige", 1);
  logEvent(`PRESTIGE +${gain} PR`);
  resetRun();
  musicScene = "run";
  syncBgm();
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
  openChestReward(chest);
}

function openChestReward(chest) {
  const index = state.chests.indexOf(chest);
  if (index >= 0) state.chests.splice(index, 1);
  const item = generateEquipment(chest.type);
  const coinReward = directCoinAmount(chestCoinReward(chest.type));
  state.coins += coinReward;
  state.lifetimeCoins += coinReward;
  addEquipment(item);
  state.stats.chestsOpened += 1;
  logEvent(`${item.rarity}${item.slot} GET`);
}

function openAllChests() {
  const readyChests = state.chests.filter((chest) => chest.remaining <= 0);
  if (readyChests.length === 0) return;
  let coinReward = 0;
  const items = [];
  for (const chest of readyChests) {
    const index = state.chests.indexOf(chest);
    if (index >= 0) state.chests.splice(index, 1);
    const item = generateEquipment(chest.type);
    coinReward += directCoinAmount(chestCoinReward(chest.type));
    items.push(item);
  }
  state.coins += coinReward;
  state.lifetimeCoins += coinReward;
  for (const item of items) addEquipment(item);
  state.stats.chestsOpened += readyChests.length;
  logEvent(`CHESTS OPENED x${readyChests.length}`);
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

function addEquipment(item) {
  state.equipment.push(item);
  enforceEquipmentSlotLimit(item.slot);
}

function enforceEquipmentLimits() {
  for (const slot of slots) {
    enforceEquipmentSlotLimit(slot);
  }
}

function enforceEquipmentSlotLimit(slot) {
  const slotItems = state.equipment.filter((item) => item.slot === slot);
  if (slotItems.length <= 10) return;
  const equippedId = state.equipped[slot];
  const removable = slotItems
    .filter((item) => item.id !== equippedId)
    .sort((a, b) => {
      const rarityDiff = rarityRank(a.rarity) - rarityRank(b.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      return Number(a.value || 0) - Number(b.value || 0);
    });
  const removeCount = slotItems.length - 10;
  const removeIds = new Set(removable.slice(0, removeCount).map((item) => item.id));
  if (removeIds.size === 0) return;
  state.equipment = state.equipment.filter((item) => !removeIds.has(item.id));
  logEvent(`${slot} AUTO DISCARD ${removeIds.size}`);
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

function discardEquipment(itemId) {
  const item = state.equipment.find((entry) => entry.id === itemId);
  if (!item) return;
  const refund = directCoinAmount(equipmentDiscardValue(item));
  state.coins += refund;
  state.lifetimeCoins += refund;
  state.equipment = state.equipment.filter((entry) => entry.id !== itemId);
  if (state.equipped[item.slot] === itemId) {
    delete state.equipped[item.slot];
  }
  logEvent(`${item.name} DISCARDED +${formatNumber(refund)} COIN`);
}

function equipmentDiscardValue(item) {
  const rarity = rarityRank(item.rarity);
  return Math.max(10, Math.ceil(18 * rarity * rarity + Number(item.value || 0) * 120));
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
  state.coins += reward.coins ? directCoinAmount(reward.coins) : 0;
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
  if (!ADS_ENABLED) return;
  openRewardAd();
  const adBoost = 1 + state.permanent.ad * 0.2;
  state.boosts.coinDouble = Math.max(state.boosts.coinDouble, 300 * adBoost);
  state.stats.adsWatched += 1;
  logEvent("REWARD BOOST 5m");
}

function finishFirstChest() {
  if (!ADS_ENABLED) return;
  const chest = state.chests.find((entry) => entry.remaining > 0);
  if (!chest) return;
  openRewardAd();
  chest.remaining = 0;
  state.stats.adsWatched += 1;
  logEvent("CHEST READY");
}

function freeGacha() {
  if (!ADS_ENABLED) return;
  openRewardAd();
  addEquipment(generateEquipment("silver"));
  state.stats.adsWatched += 1;
  logEvent("FREE GACHA");
}

function openRewardAd() {
  if (!ADS_ENABLED) return;
  window.open(REWARD_AD_URL, "_blank", "noopener,noreferrer");
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
  return areaIndexForDistance(Math.max(state.currentPrestigeDistance || 0, run.distance || 0));
}

function areaIndexForDistance(distance) {
  let index = 0;
  for (let i = 0; i < areas.length; i++) {
    if (distance >= areas[i].start) index = i;
  }
  return index;
}

function runStartDistance() {
  return areas[areaIndexForDistance(state.currentPrestigeDistance || 0)]?.start || 0;
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
  localizeElement(panelContent);
}

function renderUpgrades() {
  const cap = normalUpgradeCap();
  const html = [
    panelHead("通常強化", `Lv合計 ${sumValues(state.upgrades)} / 上限 Lv${cap}`),
    `<div class="list">`,
    ...upgradeDefs.map((def) => {
      const level = state.upgrades[def.id] || 0;
      const capped = level >= cap;
      const cost = upgradeCost(def, level);
      return rowItem({
        title: `${def.name} Lv${level}`,
        desc: def.effect(level),
        meta: capped
          ? [`上限 Lv${cap}`, `転生で上限 +1`]
          : [`次 ${def.effect(level + 1)}`, `${formatCurrency(cost, def.currency)}`, `上限 Lv${cap}`],
        action: "buyUpgrade",
        id: def.id,
        disabled: capped || (state[def.currency] || 0) < cost,
        label: capped ? "上限" : "強化"
      });
    }),
    `</div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderFactory() {
  const stats = getStats();
  const cap = factoryLevelCap();
  const coinPs = factoryOutputPerSecond("coins") * stats.idleMultiplier;
  const gemPs = factoryOutputPerSecond("gems") * stats.idleMultiplier;
  const researchPs = factoryOutputPerSecond("research") * stats.idleMultiplier;
  const visibleFactories = visibleFactoryDefs();
  const factoryFilters = [
    { id: "coins", label: "コイン工場系" },
    { id: "gems", label: "鉱山系" },
    { id: "research", label: "研究所系" },
    { id: "runner", label: "ロボット工場系" }
  ].map((filter) => (
    `<button class="${factoryView === filter.id ? "active" : ""}" data-action="factoryFilter" data-id="${filter.id}" type="button">${filter.label}</button>`
  )).join("");
  const html = [
    panelHead("放置施設", `放置倍率 x${stats.idleMultiplier.toFixed(2)} / 直接コイン x${stats.directCoinMultiplier.toFixed(3)} / 上限 Lv${cap}`),
    `<div class="summary-band">
      <div><span>コイン/秒</span><strong>${formatNumber(coinPs)}</strong></div>
      <div><span>宝石/秒</span><strong>${formatNumber(gemPs, 2)}</strong></div>
      <div><span>研究/秒</span><strong>${formatNumber(researchPs, 2)}</strong></div>
      <div><span>直接コイン倍率</span><strong>x${stats.directCoinMultiplier.toFixed(3)}</strong></div>
    </div>`,
    `<div class="filter-row">${factoryFilters}</div>`,
    `<div class="list">`,
    ...visibleFactories.map((def) => {
      const level = state.factories[def.id] || 0;
      const capped = level >= cap;
      const cost = upgradeCost(def, level);
      return rowItem({
        title: `${def.name} Lv${level}`,
        desc: `${def.description} 現在: ${factoryEffect(def, level)}`,
        meta: capped
          ? [`役割 ${factoryOutputLabel(def.outputType || def.category)}`, `上限 Lv${cap}`, `転生で上限 +1`]
          : [`役割 ${factoryOutputLabel(def.outputType || def.category)}`, `次 ${factoryEffect(def, level + 1)}`, `${formatCurrency(cost, def.currency)}`, `上限 Lv${cap}`],
        action: "buyFactory",
        id: def.id,
        disabled: capped || (state[def.currency] || 0) < cost,
        label: capped ? "上限" : "建設"
      });
    }),
    `</div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderPrestige() {
  const gain = prestigeGain();
  const progress = Math.min(1, state.coins / 1000000);
  const permanentList = permanentDefs.filter((def) => ADS_ENABLED || def.id !== "ad");
  const html = [
    panelHead("Prestige", `転生 ${state.prestigeCount}回`),
    `<div class="section-stack">
      ${ADS_ENABLED ? `<div class="list">${renderAdRewards()}</div>` : ""}
      <div class="summary-band">
        <div><span>所持PR</span><strong>${formatNumber(state.prestigePoints)}</strong></div>
        <div><span>獲得予定</span><strong>${formatNumber(gain)}</strong></div>
      </div>
      <div class="row-item">
        <div>
          <h3>100万コインで転生</h3>
          <p>コイン、通常強化、装備、宝箱、宝石、研究ポイントをリセットし、永続強化用のPRを得ます。転生ごとに通常強化・放置施設・研究上限が+1されます。</p>
          <div class="meta"><span class="pill">現在上限 Lv${normalUpgradeCap()}</span><span class="pill">転生後 Lv${normalUpgradeCap() + 1}</span></div>
          <div class="progress"><i style="width:${progress * 100}%"></i></div>
        </div>
        <button class="buy-button" data-action="prestige" ${gain <= 0 ? "disabled" : ""}>転生</button>
      </div>
      <div class="list">
        ${permanentList.map((def) => {
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
    </div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderAdRewards() {
  if (!ADS_ENABLED) return "";
  return [
    rowItem({
      title: "リワード: コイン2倍",
      desc: state.boosts.coinDouble > 0 ? `残り ${formatTime(state.boosts.coinDouble)}` : "5分間、獲得と放置のコインが2倍になります。",
      meta: [`広告倍率 ${permanentDefs.find((d) => d.id === "ad").effect(state.permanent.ad)}`],
      action: "adCoin",
      id: "coinAd",
      label: "広告を見る"
    }),
    rowItem({
      title: "リワード: 宝箱即開封",
      desc: "待機中の宝箱を1個だけ準備完了にします。",
      meta: [`宝箱 ${state.chests.length}`],
      action: "adChest",
      id: "chestAd",
      disabled: !state.chests.some((chest) => chest.remaining > 0),
      label: "広告を見る"
    }),
    rowItem({
      title: "リワード: 無料ガチャ",
      desc: "銀宝箱相当の装備を1つ獲得します。",
      meta: [`装備 ${state.equipment.length}`],
      action: "adGacha",
      id: "gachaAd",
      label: "広告を見る"
    })
  ].join("");
}

function renderEquipment() {
  const chests = state.chests.slice().sort((a, b) => a.remaining - b.remaining);
  const equippedNames = slots.map((slot) => {
    const item = state.equipment.find((entry) => entry.id === state.equipped[slot]);
    return `<div><span>${slot}</span><strong>${item ? escapeHtml(item.name) : "-"}</strong></div>`;
  }).join("");
  const filterButtons = [
    { id: "chests", label: "宝箱" },
    { id: "all", label: "全装備" },
    ...slots.map((slot) => ({ id: slot, label: slot }))
  ].map((filter) => (
    `<button class="${equipmentView === filter.id ? "active" : ""}" data-action="equipmentFilter" data-id="${filter.id}" type="button">${filter.label}</button>`
  )).join("");
  const sortedEquipment = state.equipment
    .slice()
    .filter((item) => equipmentView === "all" || slots.includes(equipmentView) ? item.slot === equipmentView || equipmentView === "all" : false)
    .sort(compareEquipment);
  const bodyHtml = equipmentView === "chests"
    ? renderChestList(chests)
    : renderEquipmentList(sortedEquipment);
  const html = [
    panelHead("装備", `所持 ${state.equipment.length}`),
    `<div class="section-stack">
      <div class="summary-band">${equippedNames}</div>
      <div class="filter-row">${filterButtons}</div>
      ${bodyHtml}
    </div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderChestList(chests) {
  const readyCount = chests.filter((chest) => chest.remaining <= 0).length;
  const openAll = `<div class="row-item">
    <div>
      <h3>開封可能な宝箱を全開封</h3>
      <p>待機時間が終わった宝箱 ${readyCount}個をまとめて開封します。</p>
      <div class="meta"><span class="pill">宝箱 ${chests.length}</span><span class="pill">開封可能 ${readyCount}</span></div>
    </div>
    <button class="buy-button" data-action="openAllChests" data-id="all" ${readyCount <= 0 ? "disabled" : ""}>全開封</button>
  </div>`;
  return `<div class="list">
    ${chests.length ? openAll : ""}
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
  </div>`;
}

function renderEquipmentList(items) {
  return `<div class="list">
    ${items.length ? items.map((item) => {
      const equipped = state.equipped[item.slot] === item.id;
      const valueText = item.stat === "hp" ? `+${item.value}` : `+${Math.round(item.value * 100)}%`;
      return `<div class="row-item">
        <div>
          <h3><span class="${item.rarityClass}">${escapeHtml(item.name)}</span></h3>
          <p>${item.slot} / ${statNames[item.stat]} ${valueText}</p>
          <div class="meta">
            <span class="pill">${item.rarity}</span>
            <span class="pill">${equipped ? "装備中" : "未装備"}</span>
          </div>
        </div>
        <div class="row-actions">
          <button class="buy-button" data-action="equip" data-id="${item.id}" ${equipped ? "disabled" : ""}>${equipped ? "装備中" : "装備"}</button>
          <button class="buy-button danger" data-action="discardEquipment" data-id="${item.id}">捨てる</button>
        </div>
      </div>`;
    }).join("") : `<div class="row-item"><div><h3>装備なし</h3><p>宝箱から装備を獲得できます。</p></div></div>`}
  </div>`;
}

function compareEquipment(a, b) {
  const rarityDiff = rarityRank(b.rarity) - rarityRank(a.rarity);
  if (rarityDiff !== 0) return rarityDiff;
  const valueDiff = Number(b.value || 0) - Number(a.value || 0);
  if (valueDiff !== 0) return valueDiff;
  return String(b.id).localeCompare(String(a.id));
}

function rarityRank(rarity) {
  return rarityDefs.find((def) => def.id === rarity)?.rank || 0;
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
  const cap = researchLevelCap();
  const unlockText = state.prestigeCount >= 100
    ? "ENDGAME ONLINE"
    : `本格研究まで ${Math.max(0, 100 - state.prestigeCount)}転生 / 上限 Lv${cap}`;
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
        const capped = level >= cap;
        const cost = upgradeCost(def, level);
        return rowItem({
          title: `${def.name} Lv${level}`,
          desc: `${def.description} 現在: ${def.effect(level)}`,
          meta: capped
            ? [`上限 Lv${cap}`, `転生で上限 +1`]
            : [`次 ${def.effect(level + 1)}`, `${formatNumber(cost)} LAB`, `上限 Lv${cap}`],
          action: "buyResearch",
          id: def.id,
          disabled: capped || state.research < cost,
          label: capped ? "上限" : "研究"
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
  document.getElementById("areaName").textContent = `${localizedAreaName(area)} / ${area.line}`;
  const dashButton = document.getElementById("dashBtn");
  dashButton.disabled = run.dashCooldown > 0 || run.gameOver;
  dashButton.textContent = run.dashCooldown > 0 ? `${Math.ceil(run.dashCooldown)}s` : staticI18n.dash[currentLanguage];
  const bgmButton = document.getElementById("bgmBtn");
  bgmButton.textContent = state.settings.bgmEnabled ? "BGM ON" : "BGM OFF";
}

function logEvent(message) {
  eventLog.textContent = translateText(message);
  messageTimer = 3;
}

function localizedAreaName(area) {
  return currentLanguage === "en"
    ? englishAreaNames[area.name] || translateText(area.name)
    : area.name;
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
  drawMiniRobots();
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
  ctx.fillText(`${localizedAreaName(area)}  ${formatNumber(run.distance)}m`, 14, 14);
  if (run.event) {
    ctx.fillStyle = area.accent;
    ctx.fillText(`${eventName(run.event)} ${Math.ceil(run.eventTimer)}s`, canvasWidth - 190, 14);
  }
}

function drawPlayer() {
  const rect = getPlayerAnchorRect();
  const blink = player.invulnerable > 0 && Math.floor(performance.now() / 80) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.55;
  const accent = run.dashTimer > 0 ? "#f2b84b" : run.skillShield > 0 ? "#48bde7" : "#e8edf5";

  if (drawPlayerSprite(rect, accent)) {
    ctx.globalAlpha = 1;
    return;
  }

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

function drawMiniRobots() {
  const activeRunnerFactories = factoryDefs
    .filter((def) => def.category === "runner" && (state.factories[def.id] || 0) > 0)
    .sort((a, b) => a.unlockOrder - b.unlockOrder);
  if (activeRunnerFactories.length === 0) return;

  const rect = getPlayerAnchorRect();
  const bobTime = performance.now() / 220;
  activeRunnerFactories.slice(0, 24).forEach((def, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const x = rect.x - 24 - col * 18;
    const yOffset = Math.sin(bobTime + index * 0.7) * 3;
    const y = run.gravityFlip
      ? rect.y + rect.h + 14 + row * 16 + yOffset
      : rect.y + rect.h - 16 - row * 16 + yOffset;
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x - 2, y + 12, 16, 4);
    ctx.fillStyle = def.color || "#48bde7";
    roundRect(x, y, 13, 11, 3);
    ctx.fill();
    ctx.fillStyle = "#101217";
    ctx.fillRect(x + 3, y + 4, 2, 2);
    ctx.fillRect(x + 8, y + 4, 2, 2);
    ctx.fillStyle = "#dfefff";
    ctx.fillRect(x + 5, y - 4, 3, 4);
  });
}

function drawPlayerSprite(rect, accent) {
  if (!robotSprite.loaded) return false;
  const animation = playerAnimationKey();
  const frames = robotSprite.frames[animation] || robotSprite.frames.running;
  if (!frames || frames.length === 0) return false;

  if (player.animationKey !== animation) {
    restartPlayerAnimation(animation);
  }

  const frame = currentPlayerFrame(animation, frames);
  const metrics = playerSpriteMetrics(rect, frame);
  if (!metrics) return false;

  if (run.dashTimer > 0) {
    ctx.fillStyle = "rgba(242,184,75,0.38)";
    ctx.fillRect(rect.x - 48, rect.y + rect.h * 0.36, 44, 8);
  }

  if (run.gravityFlip) {
    ctx.save();
    ctx.translate(metrics.centerX, metrics.centerY);
    ctx.scale(1, -1);
    ctx.drawImage(
      robotSprite.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      metrics.x - metrics.centerX,
      metrics.drawY - metrics.centerY,
      metrics.w,
      metrics.h
    );
    ctx.restore();
  } else {
    ctx.drawImage(
      robotSprite.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      metrics.x,
      metrics.y,
      metrics.w,
      metrics.h
    );
  }

  if (run.skillShield > 0) {
    ctx.strokeStyle = "rgba(72,189,231,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.9, rect.h * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.invulnerable > 0 || run.dashTimer > 0) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = Math.min(1, ctx.globalAlpha + 0.12);
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.72, rect.h * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  return true;
}

function playerSpriteMetrics(rect, frame) {
  const frameW = frame.frameW || frame.w;
  const frameH = frame.frameH || frame.h;
  const giantScale = run.giantTimer > 0 ? 1.55 : 1;
  const scale = (PLAYER_SPRITE_FRAME_HEIGHT * giantScale) / frameH;
  const virtualW = frameW * scale;
  const virtualH = frameH * scale;
  const anchorX = frameW * PLAYER_SPRITE_ANCHOR_X * scale;
  const anchorY = frameH * PLAYER_SPRITE_ANCHOR_Y * scale;
  const frameOriginX = rect.x + rect.w / 2 - anchorX;
  const frameOriginY = run.gravityFlip
    ? rect.y + rect.h / 2 - virtualH / 2
    : rect.y + rect.h - anchorY;
  const sourceDrawX = frameOriginX + (-frame.frameX) * scale;
  const sourceDrawY = frameOriginY + (-frame.frameY) * scale;
  const sourceDrawW = frame.w * scale;
  const sourceDrawH = frame.h * scale;
  const centerX = frameOriginX + virtualW / 2;
  const centerY = frameOriginY + virtualH / 2;
  const y = run.gravityFlip
    ? centerY * 2 - sourceDrawY - sourceDrawH
    : sourceDrawY;
  return {
    x: sourceDrawX,
    y,
    drawY: sourceDrawY,
    w: sourceDrawW,
    h: sourceDrawH,
    centerX,
    centerY
  };
}

function currentPlayerFrame(animation, frames) {
  const def = playerAnimationDefs[animation] || playerAnimationDefs.running;
  const elapsed = Math.max(0, (performance.now() - player.animationStartedAt) / 1000);
  const rawIndex = Math.floor(elapsed * def.fps);
  const index = def.loop ? rawIndex % frames.length : Math.min(frames.length - 1, rawIndex);
  return frames[index] || frames[frames.length - 1];
}

function playerAnimationKey() {
  if (player.damageTimer > 0 && run.hp > 0 && run.dashTimer <= 0) return "damage";
  if (run.dashTimer > 0) return "dash";
  if (player.slideTimer > 0) return "sliding";
  if (player.jumpsUsed > 0 || Math.abs(player.vy) > 20) return "jump";
  return "running";
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
  ctx.save();
  if (obj.phased) ctx.globalAlpha = 0.38;
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
  if (obj.armor > 0 || obj.shield > 0) {
    ctx.strokeStyle = obj.shield > 0 ? "#48bde7" : "#d7b878";
    ctx.lineWidth = 2;
    ctx.strokeRect(obj.x - 2, obj.y - 2, obj.w + 4, obj.h + 4);
  }
  ctx.restore();
}

function drawBoss(obj) {
  ctx.save();
  if (obj.phased) ctx.globalAlpha = 0.42;
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
  if (obj.armor > 0 || obj.shield > 0) {
    ctx.strokeStyle = obj.shield > 0 ? "#48bde7" : "#d7b878";
    ctx.lineWidth = 3;
    ctx.strokeRect(obj.x - 3, obj.y - 3, obj.w + 6, obj.h + 6);
  }
  ctx.restore();
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
