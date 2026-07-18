"use strict";

const STORAGE_KEY = "infinite_runner_factory_save_v1";
const SAVE_VERSION = 2;
const ASSET_ROOT = "asset/";
const MUSIC_ROOT = `${ASSET_ROOT}music/loop/`;
const REWARD_AD_URL = "https://omg10.com/4/11245499";
const LANGUAGE_STORAGE_KEY = "irf_language_v1";
const DEBUG_SETTINGS_KEY = "irf_debug_settings_v1";
const TAS_SITE_SAVE_KEY = "irf_tas_site_saves_v1";
const TAS_AUTO_INPUT_BANK_KEY = "irf_tas_auto_input_bank_v1";
const TAS_SITE_SAVE_LIMIT = 30;
const LANGUAGE_MODE = document.documentElement.dataset.languageMode || "auto";
const ADS_ENABLED = (document.documentElement.dataset.adMode || "reward") !== "none";
const DEBUG_MODE = document.documentElement.dataset.debugMode === "true";
const GAME_WIDTH = 790;
const GAME_HEIGHT = 424;
const MAX_JUMP_HOLD_SECONDS = 1;
const MIN_JUMP_HOLD_SECONDS = 0.1;
const SLIDE_DURATION_FRAMES = 14;
const BASE_JUMP_VELOCITY = 380;
const JUMP_UPGRADE_VELOCITY = 26;
const BASE_UPGRADE_CAP = 5;
const ACTIVE_SKILL_COOLDOWN_MAX_REDUCTION = 0.5;
const ACTIVE_SKILL_COOLDOWN_CURVE = 20;
const PRESTIGE_COIN_REQUIREMENT = 10000000;
const CHEST_DISTANCE_INTERVAL = 500;
const HAZARD_MIN_GAP = 190;
const ITEM_MIN_GAP = 960;
const PLAYER_GRAVITY = 1200;
const PLAYER_CEILING_Y = 34;
const GRAVITY_LANDING_SAFE_RADIUS = 160;
const FINAL_BOSS_OFFSET = 100;
const FINAL_BOSS_ATTACK_PATTERNS = 3;
const AREA_TARGET_RUN_SECONDS = 300;
const FINAL_BOSS_TARGET_SECONDS = 300;
const FINAL_BOSS_HIT_POINT_TARGETS = [37, 33, 30, 43, 34, 39, 86, 41, 35];
const RESEARCH_TRIAL_GATE_WIDTH = 34;
const RESEARCH_TRIAL_GATE_SPEED = 224;
const LEGACY_AREA_STARTS = [0, 1000, 3000, 7000, 15000, 30000, 60000, 100000, 160000];
const RUN_PATTERN_LENGTH_METERS = 30;
const RUN_PATTERN_WIDTH = RUN_PATTERN_LENGTH_METERS * 48;
const TAS_DEFAULT_SCENARIO_ID = "a0_run_arc_gate";

const upgradeDefs = [
  { id: "speed", name: "スピード", base: 10, growth: 2, currency: "coins", effect: (lv) => `速度 +${(lv * 1.2).toFixed(1)}%` },
  { id: "jump", name: "ジャンプ", base: 15, growth: 1.85, currency: "coins", effect: (lv) => `跳躍 +${Math.round(lv * 3)}%` },
  { id: "hp", name: "HP", base: 50, growth: 2.1, currency: "coins", effect: (lv) => `最大HP ${1 + lv}` },
  { id: "coin", name: "コイン倍率", base: 25, growth: 2, currency: "coins", effect: (lv) => `獲得 +${Math.round(lv * 8)}%` },
  { id: "magnet", name: "磁石", base: 80, growth: 1.95, currency: "coins", effect: (lv) => `吸収範囲 +${lv * 8}` },
  { id: "skillCooldown", name: "アクティブスキル冷却", base: 120, growth: 2.05, currency: "coins", effect: (lv) => `クールタイム -${(activeSkillCooldownReduction(lv) * 100).toFixed(1)}%` },
  { id: "regen", name: "自動回復", base: 200, growth: 2.15, currency: "coins", effect: (lv) => lv ? `${Math.max(10, 32 - lv * 0.5).toFixed(1)}秒ごと` : "未開放" },
  { id: "combo", name: "コンボ倍率", base: 160, growth: 2, currency: "coins", effect: (lv) => `上限 x${(2 + lv * 0.08).toFixed(2)}` },
  { id: "item", name: "アイテム出現率", base: 250, growth: 2.05, currency: "coins", effect: (lv) => `出現 +${(lv * 2).toFixed(1)}%` }
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
  { id: "sandBreaker", sourceAreaIndex: 0, name: "粘液コアブレイク", base: 120, growth: 1.55, active: true, cooldown: 20, description: "草原ボスの粘液核を圧縮した近距離破砕スキルです。砂漠ボスの砂装甲に特攻し、発動時は範囲内の敵すべてに衝撃を与えます。通常敵には1ダメージ、ボスには装甲や盾削りを与え、Lv5でようやく1ダメージ分の追撃が入り、Lv6以降は威力が少しずつ上がります。", effect: (lv) => lv ? `範囲 ${sandBreakerRange(lv)}px / 対ボス ${sandBreakerBossDamage(lv)} ダメージ` : "未解放" },
  { id: "frostInsulation", sourceAreaIndex: 1, name: "凍結対策", base: 160, growth: 1.58, description: "砂漠ボスの発熱器官を応用し、雪山ボスの凍結オーラの持続をわずかに短くします。", effect: (lv) => `凍結時間 -${lv * 2}%` },
  { id: "heatPlating", sourceAreaIndex: 2, name: "灼熱対策", base: 220, growth: 1.6, description: "雪山ボスの冷却コアから耐熱装甲を作り、火山ボスの追加ダメージを低確率で抑えます。", effect: (lv) => `灼熱軽減 ${lv * 2}%` },
  { id: "shieldPiercer", sourceAreaIndex: 3, name: "シールド解析", base: 300, growth: 1.62, description: "火山ボスの硬質外殻解析から、未来都市ボスのエネルギー盾を少しだけ貫通しやすくします。", effect: (lv) => `盾対策 +${lv * 2}%` },
  { id: "gravityAnchor", sourceAreaIndex: 4, name: "巨兵アンカー", base: 420, growth: 1.65, active: true, cooldown: 22, description: "未来都市ボスの脚部固定杭を再現します。発動中だけ重力反転波を受け流しますが、Lv5でも持続は短めです。", effect: (lv) => lv ? `重力固定 ${(0.35 + lv * 0.09).toFixed(2)}s` : "未解放" },
  { id: "voidTether", sourceAreaIndex: 5, name: "虚空テザー", base: 580, growth: 1.68, description: "宇宙ボスの軌道データから、ブラックホールボスの吸引をほんの少し弱めます。", effect: (lv) => `吸引軽減 +${lv * 2}%` },
  { id: "aetherSeal", sourceAreaIndex: 6, name: "神気封印", base: 820, growth: 1.7, description: "ブラックホールボスの特異点残滓で、神界ボスの再生間隔をわずかに遅らせます。", effect: (lv) => `再生遅延 +${(lv * 0.12).toFixed(2)}s` },
  { id: "phaseAnchor", sourceAreaIndex: 7, name: "位相ピン", base: 1150, growth: 1.72, active: true, cooldown: 24, description: "神界ボスの光杭を模した位相固定スキルです。発動中だけ位相化を短く止め、Lv5でも一瞬の攻撃機会を作る程度です。", effect: (lv) => lv ? `位相固定 ${(0.3 + lv * 0.08).toFixed(2)}s` : "未解放" }
];

const areas = [
  { name: "草原", line: "Grassland Line", start: 0, runDistance: 1590, sky: ["#81c7e8", "#d6f3ff"], ground: "#61a64f", accent: "#f2cf5a", obstacle: "#8a6a45" },
  { name: "砂漠", line: "Dune Engine", start: 1690, runDistance: 1610, sky: ["#f1c274", "#ffe7a8"], ground: "#c78942", accent: "#5cb8b2", obstacle: "#9c6a32" },
  { name: "雪山", line: "Frost Conveyor", start: 3400, runDistance: 1630, sky: ["#9bbbe0", "#f4fbff"], ground: "#d9ecf7", accent: "#48bde7", obstacle: "#60798d" },
  { name: "火山", line: "Lava Belt", start: 5130, runDistance: 1640, sky: ["#4a2530", "#d45d43"], ground: "#53312d", accent: "#ffb238", obstacle: "#2d2527" },
  { name: "未来都市", line: "Neon Loop", start: 6870, runDistance: 1660, sky: ["#17213b", "#246c9d"], ground: "#2c3948", accent: "#7af0d2", obstacle: "#5461b9" },
  { name: "宇宙", line: "Orbital Track", start: 8630, runDistance: 1680, sky: ["#080b1a", "#1c2750"], ground: "#29314a", accent: "#f1efff", obstacle: "#7a7fa4" },
  { name: "ブラックホール", line: "Singularity Rail", start: 10410, runDistance: 1700, sky: ["#050508", "#30214f"], ground: "#171320", accent: "#b98cff", obstacle: "#4c3b72" },
  { name: "神界", line: "Aether Road", start: 12210, runDistance: 1720, sky: ["#e5d9ff", "#9fd9ff"], ground: "#e8e1b8", accent: "#f4cc5f", obstacle: "#b99067" },
  { name: "無限空間", line: "Infinite Span", start: 14030, runDistance: 1730, sky: ["#11151d", "#2e465b"], ground: "#24313a", accent: "#4cc38a", obstacle: "#394859" }
];

const areaEnemyTraits = [
  { id: "plain", name: "標準", complexity: 0 },
  { id: "sandArmor", name: "砂装甲", complexity: 1 },
  { id: "frostAura", name: "凍結オーラ", complexity: 2 },
  { id: "burning", name: "灼熱", complexity: 3 },
  { id: "energyShield", name: "エネルギー盾", complexity: 4 },
  { id: "gravityPulse", name: "重力波", complexity: 5 },
  { id: "voidPull", name: "吸引", complexity: 6 },
  { id: "regen", name: "再生", complexity: 7 },
  { id: "phase", name: "位相化", complexity: 8 }
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

const bossSoulModes = [
  { id: "red", name: "Red Core", color: "#ef5f6b", rule: "通常操作と警告攻撃" },
  { id: "cyan", name: "Patience Field", color: "#65d6ff", rule: "水色攻撃は動かず耐える" },
  { id: "orange", name: "Bravery Drive", color: "#ff9f3d", rule: "橙攻撃は動いて突破する" },
  { id: "blue", name: "Integrity Gravity", color: "#4f8cff", rule: "重力方向が切り替わる" },
  { id: "purple", name: "Perseverance Rails", color: "#b98cff", rule: "上下レーンだけを移動する" },
  { id: "green", name: "Kindness Shield", color: "#60d878", rule: "方向入力で攻撃を受け止める" },
  { id: "yellow", name: "Justice Shot", color: "#f2d24b", rule: "Dキーで弾を撃つ" },
  { id: "dual", name: "Split Core", color: "#65d6ff", rule: "本体と反転残像を同時に守る" },
  { id: "rainbow", name: "Rainbow Cycle", color: "#ffffff", rule: "攻撃ごとにルールが変わる" }
];

const bossGuideDefs = [
  {
    title: { ja: "最終ボス: Slime King", en: "Final Boss: Slime King" },
    text: {
      ja: "工場排液から生まれた増殖ゲルの王です。攻撃のたびに粘液片を分裂させ、踏める位置へ近づく前にも小さな分裂体で足場を乱します。赤い核は通常操作のまま警告攻撃を読む力を試します。核が固まりきらないため、体の一部が勝手に走り出します。",
      en: "A king born from runaway factory gel. It sheds split bodies between attack phases before moving close. Its red core keeps normal controls and tests how well you read warning attacks. Its core never fully stabilizes, so pieces of it keep running on their own."
    }
  },
  {
    title: { ja: "最終ボス: Sand Wyrm", en: "Final Boss: Sand Wyrm" },
    text: {
      ja: "砂漠の地下搬送ドリルが野生化した機械竜です。攻撃中は砂の下へ潜って位置をずらし、砂柱や埋設物を押し出します。水色の砂紋は、動かず待つ判断を要求します。熱を逃がすために地中を循環する構造が、そのまま戦闘行動になっています。",
      en: "A feral transport drill from beneath the dunes. During attacks it burrows, shifts position, and pushes sand spikes and buried debris forward. Its cyan sand rings demand moments of patience. Its cooling route became its combat pattern."
    }
  },
  {
    title: { ja: "最終ボス: Frost Core", en: "Final Boss: Frost Core" },
    text: {
      ja: "雪山基地の冷却炉心が自律防衛化した存在です。攻撃中は冷気で動きを鈍らせ、氷塊を生成して進路を狭めます。橙の冷却壁は、止まらず動いて突破する勇気を要求します。炉心保護用の冷媒が過剰循環し、周囲を監獄のように凍らせます。",
      en: "An autonomous cooling core from a mountain base. It slows the field and forms ice blocks that narrow the route. Its orange coolant walls reward active movement through danger. Its overcirculating coolant turns defense into a frozen prison."
    }
  },
  {
    title: { ja: "最終ボス: Lava Golem", en: "Final Boss: Lava Golem" },
    text: {
      ja: "火山の精錬炉に残った鉱石が歩き出した巨体です。攻撃中は溶岩弾と焼けた岩を連続で吐き出し、地面近くの圧力も上げます。青い炉心は重力方向を切り替え、足場感覚そのものを崩します。炉内の余熱が逃げ場を失い、噴石としてあふれます。",
      en: "A giant mass of ore awakened inside a volcanic smelter. It spits lava shots and heated rock in chains while pressure builds near the ground. Its blue furnace core shifts gravity and breaks your footing. Trapped furnace heat erupts as projectiles."
    }
  },
  {
    title: { ja: "最終ボス: Giant Robot", en: "Final Boss: Giant Robot" },
    text: {
      ja: "未来都市を守る旧式警備機です。攻撃中はレーザー格子とシールドを交互に展開し、近づく瞬間だけ装甲姿勢を崩します。紫の保安レールは、自由なジャンプではなく上下レーン移動へ操作を変えます。都市封鎖用の防犯網が壊れたまま、自分自身を区画の一部として守っています。",
      en: "An old security machine guarding the future city. It alternates laser grids and shields, dropping its stance only when it advances. Its purple security rails replace free jumping with lane switching. The broken lockdown network treats the machine as part of the city wall."
    }
  },
  {
    title: { ja: "最終ボス: Star Dragon", en: "Final Boss: Star Dragon" },
    text: {
      ja: "宇宙航路の重力帆から生まれた竜型AIです。攻撃中は軌道上の敵影と隕石を組み合わせ、重力方向を揺さぶります。緑の防衛帆は、入力方向で攻撃を受け止める盾操作を要求します。星間風を読む帆が乱れ、周囲の上下感覚まで航路補正しようとします。",
      en: "A dragon-shaped AI grown from orbital gravity sails. It mixes orbital enemies with meteor paths and shakes local gravity. Its green defense sails demand directional shielding. Its star-wind sails try to correct even your sense of up and down."
    }
  },
  {
    title: { ja: "最終ボス: Void Engine", en: "Final Boss: Void Engine" },
    text: {
      ja: "ブラックホール縁辺で稼働し続ける古い推進炉です。攻撃中は特異点の吸引で位置を乱し、引き寄せた破片を弾幕に変えます。黄色い照準核の間は、Dキーで弾を撃ち、飛来物や本体へ反撃できます。失われた航路を探し続けるため、空間そのものを燃料のように吸い込みます。",
      en: "An ancient engine still running at a black-hole rim. It pulls at your position and turns captured fragments into barrages. Its yellow targeting core lets D fire shots at debris and the engine. Searching for a lost route, it burns space itself like fuel."
    }
  },
  {
    title: { ja: "最終ボス: Aether Lord", en: "Final Boss: Aether Lord" },
    text: {
      ja: "神界の保守プログラムが人格を得た管理者です。攻撃中は光杭と再生処理を重ね、傷ついた自分を神気で巻き戻します。青赤分割核は、プレイヤー本体と上下反転した残像の両方を守る戦いに変えます。壊れた世界を修復する使命が、自身の損傷も修理対象として扱っています。",
      en: "A maintenance program from the aether realm that gained a will. It layers light pillars with regeneration, rewinding damage with aether. Its split core makes you protect both the player and a vertically mirrored echo. Its repair mandate treats itself as part of the world to fix."
    }
  },
  {
    title: { ja: "最終ボス: Infinity Gate", en: "Final Boss: Infinity Gate" },
    text: {
      ja: "無限空間を折りたたむ門そのものです。攻撃中は位相を点滅させ、複数の座標から異なる弾幕を重ねます。虹色の中核は、攻撃パターンごとに過去のソウルルールを切り替えます。無限の距離を短く畳む機構が暴走し、同じ瞬間を何度も重ねます。",
      en: "The gate that folds infinite space. It flickers through phases and stacks barrages from several coordinates. Its rainbow core switches between earlier soul rules on each attack pattern. Its mechanism for folding infinite distance has begun layering the same moment repeatedly."
    }
  }
];

const introGuideSteps = [
  {
    target: ".canvas-frame",
    title: { ja: "ラン画面", en: "Run Field" },
    text: {
      ja: "ロボットは自動で前へ走ります。コインを集め、障害物を避けながら距離を伸ばしましょう。",
      en: "Your robot runs forward automatically. Collect coins, avoid hazards, and push the distance farther."
    }
  },
  {
    target: ".command-row",
    title: { ja: "操作", en: "Controls" },
    text: {
      ja: "ジャンプはSpace/↑長押しで飛距離が伸びます。スライドは↓で最大14フレーム続き、キーやボタンを離すと途中で解除できます。スキルはDで使い、Qで解放順に切り替えます。拾った特殊アイテムは1個だけストックされ、Eで使えます。",
      en: "Hold Space/↑ to jump farther. Down starts a slide lasting up to 14 frames; release it to cancel early. Use the selected skill with D and cycle unlocked skills with Q. Picked special items stock one at a time and can be used with E."
    }
  },
  {
    target: ".hud-grid",
    title: { ja: "ラン情報", en: "Run Stats" },
    text: {
      ja: "距離、HP、倍率を見ながら走ります。HPが0になるとラン終了です。",
      en: "Watch distance, HP, and multiplier while running. The run ends when HP reaches 0."
    }
  },
  {
    target: ".resource-strip",
    title: { ja: "資源", en: "Resources" },
    text: {
      ja: "コインは強化に、宝石と研究ポイントは後半の育成に使います。少しずつできることが増えます。",
      en: "Coins buy upgrades. Gems and research points support later growth. More systems unlock over time."
    }
  },
  {
    target: ".side-panel",
    title: { ja: "育成メニュー", en: "Growth Menus" },
    text: {
      ja: "右側で強化、工場、装備、任務、研究を管理します。短いランを重ねるほど成長します。",
      en: "Manage upgrades, factories, equipment, missions, and research here. Short runs steadily build long-term power."
    }
  },
  {
    target: ".tab-bar",
    title: { ja: "最初の目標", en: "First Goal" },
    text: {
      ja: "まずはコインで通常強化を進め、100mより先を目指しましょう。新しい説明は初見の時だけ止まって表示されます。",
      en: "Start by spending coins on upgrades and aim beyond 100m. New explanations pause the game only the first time they appear."
    }
  }
];

const hazardGuideDefs = {
  crate: {
    title: { ja: "箱型障害物", en: "Crate Hazard" },
    text: { ja: "低めの障害物です。ジャンプで越えましょう。無敵中なら壊せることもあります。", en: "A low obstacle. Jump over it; invincible effects can sometimes smash through." }
  },
  spike: {
    title: { ja: "トゲ", en: "Spikes" },
    text: { ja: "触れるとダメージを受けます。早めのジャンプで越えるのが基本です。", en: "Touching these hurts. A clean early jump is the safest answer." }
  },
  laser: {
    title: { ja: "レーザー", en: "Laser" },
    text: { ja: "高い位置まで伸びる障害物です。スライドでくぐるタイミングを覚えましょう。", en: "A tall hazard. Learn the timing and slide under it." }
  },
  slime: {
    title: { ja: "スライム", en: "Slime" },
    text: { ja: "小さな敵です。上から踏むと倒せますが、横から触れるとダメージになります。", en: "A small enemy. Stomp from above to defeat it; side contact hurts." }
  },
  bird: {
    title: { ja: "空中の敵", en: "Flying Enemy" },
    text: { ja: "空中を飛ぶ敵です。高さを見てジャンプするか、くぐって避けましょう。", en: "A flying enemy. Read its height, then jump or duck underneath." }
  },
  bomb: {
    title: { ja: "爆弾", en: "Bomb" },
    text: { ja: "接触が危険な敵です。無理に踏まず、余裕を持って避ける判断も大切です。", en: "A risky enemy. Do not force a stomp; giving it space is often wiser." }
  },
  meteor: {
    title: { ja: "落下物", en: "Falling Hazard" },
    text: { ja: "上から落ちてくる攻撃です。足元だけでなく、上方向の動きも見て避けましょう。", en: "This attack drops from above. Watch vertical motion, not just the ground line." }
  }
};

const itemGuideDefs = {
  dash: {
    title: { ja: "特殊アイテム: ダッシュ", en: "Special Item: Dash" },
    text: { ja: "拾うと1個だけストックされ、Eキーまたはアイテムボタンで使えます。一定時間だけ高速で走り、接触にも強くなります。", en: "Picking this stores one item. Use it with E or the item button. It temporarily boosts speed and contact strength." }
  },
  shield: {
    title: { ja: "特殊アイテム: 無敵", en: "Special Item: Invincible" },
    text: { ja: "拾うと1個だけストックされ、Eキーまたはアイテムボタンで使えます。短い間ダメージを受けにくくなります。", en: "Picking this stores one item. Use it with E or the item button. It briefly protects you from damage." }
  },
  giant: {
    title: { ja: "特殊アイテム: 巨大化", en: "Special Item: Giant" },
    text: { ja: "拾うと1個だけストックされ、Eキーまたはアイテムボタンで使えます。ロボットが大きくなり、当たりも強くなります。", en: "Picking this stores one item. Use it with E or the item button. Your robot grows larger and stronger." }
  },
  magnet: {
    title: { ja: "特殊アイテム: 磁石", en: "Special Item: Magnet" },
    text: { ja: "拾うと1個だけストックされ、Eキーまたはアイテムボタンで使えます。近くのコインや報酬を一気に引き寄せます。", en: "Picking this stores one item. Use it with E or the item button. It pulls nearby coins and rewards toward you." }
  },
  time: {
    title: { ja: "特殊アイテム: 時間停止", en: "Special Item: Time Stop" },
    text: { ja: "拾うと1個だけストックされ、Eキーまたはアイテムボタンで使えます。一部の敵や障害物の動きを止めます。", en: "Picking this stores one item. Use it with E or the item button. It briefly stops some enemies and hazards." }
  },
  doubleJump: {
    title: { ja: "特殊アイテム: 2段ジャンプ", en: "Special Item: Double Jump" },
    text: { ja: "拾うと1個だけストックされ、Eキーまたはアイテムボタンで使えます。空中で使えるジャンプ回数を少し戻します。", en: "Picking this stores one item. Use it with E or the item button. It restores a bit of jump control in midair." }
  }
};

const traitGuideDefs = {
  sandArmor: {
    title: { ja: "このエリアの敵: 砂装甲", en: "Area Trait: Sand Armor" },
    text: { ja: "この先の敵は最初の一撃を砂装甲で受け止め、破壊後に時間を空けると一度だけ装甲を再形成します。踏む・スキルで削った後は間を空けずに本体を狙いましょう。", en: "Enemies absorb the first hit with sand armor and can rebuild it once if left alone. After breaking it, keep pressure on the exposed body." }
  },
  frostAura: {
    title: { ja: "このエリアの敵: 凍結オーラ", en: "Area Trait: Frost Aura" },
    text: { ja: "近づくと動きが鈍り、さらに予兆の輪の後で広い凍結パルスが発生します。距離を取り、パルス前にジャンプを早めに入力しましょう。", en: "Nearby enemies slow you and release a wider frost pulse after a warning ring. Keep distance and jump before the pulse." }
  },
  burning: {
    title: { ja: "このエリアの敵: 灼熱", en: "Area Trait: Burning" },
    text: { ja: "接触ダメージが増えるうえ、予兆の後に地面を流れる灼熱弾を放ちます。敵本体と灼熱弾を別々の障害物として読みましょう。", en: "Contact hurts more, and enemies launch ground-skimming embers after a warning. Read the enemy and its ember as separate hazards." }
  },
  energyShield: {
    title: { ja: "このエリアの敵: エネルギー盾", en: "Area Trait: Energy Shield" },
    text: { ja: "盾で攻撃を受け流し、破壊後に時間を空けると再充電して放電します。連続攻撃するか、再充電の予兆を見て放電も避けましょう。", en: "Enemies deflect hits, then recharge and discharge if pressure stops. Continue attacking or read the recharge warning and avoid the discharge." }
  },
  gravityPulse: {
    title: { ja: "このエリアの敵: 重力波", en: "Area Trait: Gravity Pulse" },
    text: { ja: "近距離では予兆の輪が縮んだ後に重力が反転します。敵ごとに周期が少し違うため、現在の向きと次の着地点を同時に見て動きましょう。", en: "At close range, a shrinking warning ring precedes a gravity reversal. Each enemy has a slightly different cycle, so track both orientation and landing." }
  },
  voidPull: {
    title: { ja: "このエリアの敵: 吸引", en: "Area Trait: Pull" },
    text: { ja: "近くの敵は吸引と反発の極性を周期的に切り替えます。輪の色が変わるタイミングを見て、次に上下どちらへ速度が加わるか判断しましょう。", en: "Nearby enemies alternate between pull and repulsion. Read the ring change to judge which vertical direction will gain momentum next." }
  },
  regen: {
    title: { ja: "このエリアの敵: 再生", en: "Area Trait: Regeneration" },
    text: { ja: "時間をかけると回復し、回復が成立するたびに反撃弾を放ちます。短い間隔で削るか、回復直後の弾まで含めて回避しましょう。", en: "Enemies regenerate and fire a counter-shot whenever healing succeeds. Keep pressure on them or prepare to avoid the shot after each heal." }
  },
  phase: {
    title: { ja: "このエリアの敵: 位相化", en: "Area Trait: Phasing" },
    text: { ja: "周期的に攻撃が通らない位相へ入り、実体へ戻る瞬間に同じ高さへ残像弾を残します。透け方を見て攻撃機会と残像の回避を続けて判断しましょう。", en: "Enemies periodically phase out, then leave an echo shot at their height when returning. Read transparency for both the attack opening and the echo dodge." }
  }
};

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
  wood: { name: "木", seconds: 30, color: "#a97942", weight: 76 },
  silver: { name: "銀", seconds: 300, color: "#aeb7c2", weight: 20 },
  gold: { name: "金", seconds: 1800, color: "#e7b84d", weight: 3.3 },
  rainbow: { name: "虹", seconds: 28800, color: "#b98cff", weight: 0.6 },
  god: { name: "神", seconds: 28800, color: "#fff1a5", weight: 0.1 }
};

const rarityDefs = [
  { id: "N", rank: 1, colorClass: "rarity-n", weight: 62 },
  { id: "R", rank: 2, colorClass: "rarity-r", weight: 25 },
  { id: "SR", rank: 3, colorClass: "rarity-sr", weight: 9 },
  { id: "SSR", rank: 4, colorClass: "rarity-ssr", weight: 3 },
  { id: "UR", rank: 5, colorClass: "rarity-ur", weight: 0.8 },
  { id: "LR", rank: 6, colorClass: "rarity-lr", weight: 0.2 }
];

const activeSkillDefs = [
  ...researchDefs.filter((def) => def.active)
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
  jump: { ja: "ジャンプ\nSpace / ↑", en: "Jump\nSpace / ↑" },
  slide: { ja: "スライド\n↓", en: "Slide\n↓" },
  dash: { ja: "スキル\nD", en: "Skill\nD" },
  cycleSkill: { ja: "切替\nQ", en: "Cycle\nQ" },
  stockItem: { ja: "アイテム\nE", en: "Item\nE" },
  restart: { ja: "再走", en: "Restart" },
  save: { ja: "保存", en: "Save" },
  home: { ja: "トップページへ", en: "Back to Home" },
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
  ["草原ボスの粘液核を圧縮した近距離破砕スキルです。砂漠ボスの砂装甲に特攻し、発動時は範囲内の敵すべてに衝撃を与えます。通常敵には1ダメージ、ボスには装甲や盾削りを与え、Lv5でようやく1ダメージ分の追撃が入り、Lv6以降は威力が少しずつ上がります。", "A short-range breaking skill made from compressed Grassland boss slime core. It is specialized against the Desert boss sand armor and shocks every enemy in range. Normal enemies take 1 damage; bosses only lose armor or shields until Lv5 adds 1 damage, then Lv6+ gradually increases damage."],
  ["対ボス", "vs Boss"],
  ["砂漠ボスの発熱器官を応用し、雪山ボスの凍結オーラの持続をわずかに短くします。", "Apply the Desert boss heat organ to slightly shorten the Snow Mountain boss freeze aura."],
  ["雪山ボスの冷却コアから耐熱装甲を作り、火山ボスの追加ダメージを低確率で抑えます。", "Build heat plating from the Snow Mountain boss cooling core to rarely reduce Volcano boss bonus damage."],
  ["火山ボスの硬質外殻解析から、未来都市ボスのエネルギー盾を少しだけ貫通しやすくします。", "Analyze the Volcano boss shell to slightly improve pierce chance against Future City energy shields."],
  ["未来都市ボスの脚部固定杭を再現します。発動中だけ重力反転波を受け流しますが、Lv5でも持続は短めです。", "Recreates the Future City boss leg anchor. It deflects gravity waves only while active, and even Lv5 lasts briefly."],
  ["宇宙ボスの軌道データから、ブラックホールボスの吸引をほんの少し弱めます。", "Use Space boss orbital data to slightly reduce Black Hole boss pull."],
  ["ブラックホールボスの特異点残滓で、神界ボスの再生間隔をわずかに遅らせます。", "Use Black Hole singularity residue to slightly delay Aether boss regeneration."],
  ["神界ボスの光杭を模した位相固定スキルです。発動中だけ位相化を短く止め、Lv5でも一瞬の攻撃機会を作る程度です。", "A phase-lock skill modeled after the Aether boss light pin. It briefly stops phasing only while active, and Lv5 merely creates a short opening."],
  ["宝箱から装備を獲得できます。", "Open chests to get equipment."],
  ["待機時間が終わった宝箱", "Ready chests"],
  ["開封可能な宝箱を全開封", "Open All Ready Chests"],
  ["1000万コインで転生", "Prestige at 10,000,000 coins"],
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
  ["粘液コアブレイク", "Slime Core Break"],
  ["凍結対策", "Freeze Counter"],
  ["灼熱対策", "Heat Counter"],
  ["シールド解析", "Shield Analysis"],
  ["巨兵アンカー", "Giant Anchor"],
  ["虚空テザー", "Void Tether"],
  ["神気封印", "Aether Seal"],
  ["位相ピン", "Phase Pin"],
  ["研究ツリー", "Research Tree"],
  ["研究アクティブ", "Research Active"],
  ["アクティブスキル冷却", "Active Skill Cooldown"],
  ["研究で解放したボス由来スキルを画面下のスキルボタンにセットします。", "Set a boss-derived skill unlocked by research to the skill button below."],
  ["スキルなし", "No Skill"],
  ["未解放", "Locked"],
  ["解放", "Unlocked"],
  ["アクティブ", "Active"],
  ["パッシブ", "Passive"],
  ["現在:", "Current:"],
  ["クールダウン", "Cooldown"],
  ["クールタイム", "Cooldown"],
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
  ["なし", "None"],
  ["開封できます。", "Ready to open."],
  ["開封", "Open"],
  ["全開封", "Open All"],
  ["装備中", "Equipped"],
  ["未装備", "Not Equipped"],
  ["任務と実績", "Missions & Achievements"],
  ["達成済み", "Completed"],
  ["未達成", "Not Completed"],
  ["受取済", "Claimed"],
  ["受取", "Claim"],
  ["本格研究まで", "Research core in"],
  ["粘液破砕", "Slime Break"],
  ["研究候補なし", "No Research Candidates"],
  ["エリア最終ボスを撃破すると、そのボスをもとにした次エリア攻略用の研究が見つかります。", "Defeat an area final boss to discover research based on that boss for the next area."],
  ["凍結時間", "Freeze Time"],
  ["灼熱軽減", "Heat Reduction"],
  ["盾対策", "Shield Counter"],
  ["重力固定", "Gravity Lock"],
  ["吸引軽減", "Pull Reduction"],
  ["再生遅延", "Regen Delay"],
  ["位相固定", "Phase Lock"],
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
  ["範囲", "Range"],
  ["ダメージ", "Damage"],
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
const guideOverlay = document.getElementById("guideOverlay");
const guideSpotlight = document.getElementById("guideSpotlight");
const guideCard = document.getElementById("guideCard");
const guideStep = document.getElementById("guideStep");
const guideTitle = document.getElementById("guideTitle");
const guideText = document.getElementById("guideText");
const guideNext = document.getElementById("guideNext");
const debugPanel = document.getElementById("debugPanel");
const debugResetSave = document.getElementById("debugResetSave");
const debugMaxUpgrades = document.getElementById("debugMaxUpgrades");
const debugSkipGuides = document.getElementById("debugSkipGuides");
const debugTasControls = document.getElementById("debugTasControls");
const debugEventButtons = document.getElementById("debugEventButtons");
const debugAssetSceneControls = document.getElementById("debugAssetSceneControls");
const debugAssetSceneSelect = document.getElementById("debugAssetSceneSelect");
const debugAssetScenePrevious = document.getElementById("debugAssetScenePrevious");
const debugAssetSceneShow = document.getElementById("debugAssetSceneShow");
const debugAssetSceneNext = document.getElementById("debugAssetSceneNext");
const debugAssetSceneClose = document.getElementById("debugAssetSceneClose");
const debugAssetSceneInfo = document.getElementById("debugAssetSceneInfo");
const debugStatus = document.getElementById("debugStatus");
const debugHudFields = {
  coinsStat: "coins",
  gemsStat: "gems",
  researchStat: "research",
  prestigeStat: "prestigePoints",
  distanceStat: "distance",
  bestStat: "bestDistance",
  hpStat: "hp",
  comboStat: "combo",
  levelStat: "level"
};

const RANDOM_EVENT_DEFS = [
  { value: "coinRain", weight: 18 },
  { value: "meteor", weight: 12 },
  { value: "fever", weight: 16 },
  { value: "gravity", weight: 11 },
  { value: "clearPath", weight: 15 },
  { value: "coin3", weight: 16 }
];

const TAS_STEP_SECONDS = 1 / 60;
const TAS_SPEEDS = [4, 2, 1, 0.5, 0.25, 0.1];
const TAS_DEFAULT_SPEED_INDEX = 2;
const TAS_MAX_STEPS_PER_DRAW = 240;
const GAMEPLAY_KEY_CODES = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyD", "KeyQ", "KeyE"]);
const TAS_ALLOWED_GAMEPLAY_KEY_CODES = new Set(["ArrowUp", "ArrowDown", "KeyD", "KeyQ"]);

let state = loadState();
let activeTab = "upgrades";
let factoryView = "coins";
let equipmentView = "chests";
let canvasWidth = GAME_WIDTH;
let canvasHeight = GAME_HEIGHT;
let groundY = GAME_HEIGHT - 62;
let lastFrame = performance.now();
let lastAnimationFrameAt = lastFrame;
let gameClockMs = lastFrame;
let tasStepAccumulator = 0;
let tasBatchAdvancing = false;
let autosaveTimer = 0;
let uiTimer = 0;
let messageTimer = 0;
let musicScene = "run";
let languageSelectionActive = false;
let debugSettings = loadDebugSettings();
const tasState = {
  paused: false,
  queuedSteps: 0,
  frame: 0,
  saveSlot: null,
  rewind: [],
  recording: false,
  recordingStartFrame: 0,
  playing: false,
  playbackFrame: 0,
  inputFrames: [],
  pendingActions: {},
  scenarioId: "",
  siteSaveName: "",
  autoEnabled: false,
  autoCurrentScenarioId: "",
  autoTracks: [],
  autoStartedAtMs: 0,
  autoStartDistance: 0,
  autoLoadedCount: 0,
  autoMissCount: 0,
  pauseAtFrame: null,
  rngCalls: 0,
  rngLast: 0,
  rngState: ((Date.now() ^ 0x9e3779b9) >>> 0) || 0x12345678
};

const assetSceneState = {
  active: false,
  catalog: [],
  selectedIndex: 0,
  snapshot: null,
  originalEventLogText: "",
  entry: null,
  description: "",
  focusElement: null,
  musicAvailable: false
};

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
  animationStartedAt: gameClockMs
};

const run = {
  active: true,
  gameOver: false,
  distance: 0,
  hp: 1,
  combo: 0,
  dashTimer: 0,
  dashCooldown: 0,
  activeSkillCooldowns: {},
  skillShield: 0,
  giantTimer: 0,
  timeStop: 0,
  gravityGuardTimer: 0,
  phasePinTimer: 0,
  chillTimer: 0,
  nextSpawn: 0.4,
  nextBossMark: 1000,
  nextChestMark: CHEST_DISTANCE_INTERVAL,
  bossBattle: false,
  bossAreaIndex: -1,
  bossAttackTimer: 0,
  bossChargeTimer: 0,
  bossRetreating: false,
  bossPhase: "attack",
  bossPatternIndex: 0,
  bossVolley: 0,
  bossSoulMode: "red",
  bossModeTimer: 0,
  bossModePulse: 0,
  bossResearchCounters: {},
  bossResearchRequired: [],
  bossResearchScheduled: {},
  bossResearchPassed: {},
  bossResearchUsage: {},
  lastBossResearchAudit: null,
  tasAreaIndex: null,
  tasDisabledResearchIds: [],
  webLane: 1,
  justiceCooldown: 0,
  echoActive: false,
  event: null,
  eventTimer: 0,
  eventCooldown: 50,
  gravityFlip: false,
  gravityLandingGuard: false,
  stockedItem: null,
  lastPatternKey: "",
  sessionCoins: 0,
  sessionEnemies: 0,
  sessionBosses: 0,
  sessionChests: 0
};

let objects = [];
let particles = [];

const guideState = {
  active: false,
  steps: [],
  index: 0,
  queue: [],
  onComplete: null,
  targetElement: null,
  currentTarget: null
};

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
  pointerJumpActive: false,
  tasWantsJump: false,
  tasJumpRetry: false,
  blockDirection: "mid"
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
  initDebugMode();
  logEvent("RUN START");
  maybeStartIntroGuide();
  if (DEBUG_MODE) window.setInterval(runTasAnimationFallback, 50);
  requestAnimationFrame(loop);
}

function initLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const hasSavedLanguage = savedLanguage === "ja" || savedLanguage === "en";
  const initialLanguage = LANGUAGE_MODE === "en" ? "en" : hasSavedLanguage ? savedLanguage : "ja";
  languageSelectionActive = false;
  setLanguage(initialLanguage, { persist: false, refresh: false });
  if (LANGUAGE_MODE !== "en" && !hasSavedLanguage) {
    languageSelectionActive = true;
    document.getElementById("languageOverlay")?.classList.remove("hidden");
  }
}

function setLanguage(language, options = {}) {
  const { persist = true, refresh = true } = options;
  const nextLanguage = LANGUAGE_MODE === "en" ? "en" : language;
  if (nextLanguage !== "ja" && nextLanguage !== "en") return;
  const shouldStartIntro = languageSelectionActive && persist;
  languageSelectionActive = false;
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
    maybeStartIntroGuide({ force: shouldStartIntro });
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

function persistStateQuiet() {
  if (isAssetSceneActive()) return;
  state.lastSavedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initDebugMode() {
  if (!DEBUG_MODE) return;
  debugPanel?.classList.remove("hidden");
  tasState.paused = isTasEnabled();
  tasState.queuedSteps = 0;
  debugResetSave?.addEventListener("click", resetDebugSave);
  debugMaxUpgrades?.addEventListener("click", setDebugUpgradesToCap);
  debugSkipGuides?.addEventListener("click", toggleDebugSkipGuides);
  renderDebugTasControls();
  window.setTimeout(renderDebugTasControls, 0);
  renderDebugEventButtons();
  initDebugAssetSceneViewer();
  updateDebugSkipGuidesButton();
  configureDebugHudInputs();
  exposeTasDeterminismTools();
}

function exposeTasDeterminismTools() {
  if (!DEBUG_MODE) return;
  window.__irfTasDeterminism = Object.freeze({
    prepareScenario(scenarioId, speedIndex, targetFrame, inputFrames = []) {
      if (!isTasEnabled()) return false;
      const option = tasScenarioOptionById(scenarioId);
      if (!option) return false;
      debugSettings.tasSpeedIndex = normalizeTasSpeedIndex(speedIndex);
      applyTasScenario(option);
      tasState.inputFrames = normalizeTasInputFrames(inputFrames);
      tasState.playbackFrame = 0;
      tasState.playing = tasState.inputFrames.length > 0;
      tasState.pauseAtFrame = Math.max(0, Math.floor(Number(targetFrame) || 0));
      tasState.paused = tasState.pauseAtFrame === 0;
      resetTasScheduler();
      return true;
    },
    advanceFrames(maxFrames, stopAtBossPhaseChange = false) {
      if (!isTasEnabled()) return captureTasDeterminismState();
      const limit = Math.max(0, Math.floor(Number(maxFrames) || 0));
      const initialPhase = run.bossPhase;
      tasState.paused = false;
      let advanced = 0;
      tasBatchAdvancing = true;
      try {
        while (advanced < limit && !run.gameOver && !window.__irfLastDamage) {
          advanceTasSimulationFrame();
          advanced += 1;
          if (stopAtBossPhaseChange && run.bossPhase !== initialPhase) break;
          if (tasState.paused) break;
        }
      } finally {
        tasBatchAdvancing = false;
      }
      tasState.paused = true;
      tasStepAccumulator = 0;
      return captureTasDeterminismState();
    },
    advanceUntil(maxFrames, stopMode) {
      if (!isTasEnabled()) return captureTasDeterminismState();
      const limit = Math.max(0, Math.floor(Number(maxFrames) || 0));
      const initialBossBattle = run.bossBattle;
      tasState.paused = false;
      tasState.pauseAtFrame = null;
      tasBatchAdvancing = true;
      let advanced = 0;
      try {
        while (advanced < limit && !run.gameOver && !window.__irfLastDamage) {
          advanceTasSimulationFrame();
          advanced += 1;
          if (stopMode === "boss-start" && run.bossBattle) break;
          if (stopMode === "boss-clear" && initialBossBattle && !run.bossBattle) break;
        }
      } finally {
        tasBatchAdvancing = false;
      }
      tasState.paused = true;
      tasStepAccumulator = 0;
      return captureTasDeterminismState();
    },
    traceBossBattle(maxFrames) {
      if (!isTasEnabled()) return { snapshot: captureTasDeterminismState(), trace: [] };
      const limit = Math.max(0, Math.floor(Number(maxFrames) || 0));
      const trace = [];
      let lastKey = "";
      tasState.paused = false;
      tasState.pauseAtFrame = null;
      tasBatchAdvancing = true;
      let advanced = 0;
      try {
        while (advanced < limit && run.bossBattle && !run.gameOver && !window.__irfLastDamage) {
          advanceTasSimulationFrame();
          advanced += 1;
          const boss = objects.find((obj) => obj.type === "boss" && obj.finalBoss);
          const key = boss
            ? `${run.bossPhase}:${run.bossPatternIndex}:${boss.hp}:${boss.armor || 0}:${boss.shield || 0}`
            : "cleared";
          if (key !== lastKey) {
            lastKey = key;
            trace.push({
              frame: tasState.frame,
              phase: run.bossPhase,
              pattern: run.bossPatternIndex,
              hp: boss?.hp ?? 0,
              armor: Number(boss?.armor || 0),
              shield: Number(boss?.shield || 0),
              scenarioId: tasState.autoCurrentScenarioId || ""
            });
          }
        }
      } finally {
        tasBatchAdvancing = false;
      }
      tasState.paused = true;
      tasStepAccumulator = 0;
      return { snapshot: captureTasDeterminismState(), trace };
    },
    setAutoInput(scenarioId, inputFrames) {
      const bank = loadTasAutoInputBank();
      if (!bank[scenarioId]) return false;
      const inputs = normalizeTasInputFrames(inputFrames);
      bank[scenarioId] = { ...bank[scenarioId], frameCount: inputs.length, inputs };
      tasAutoInputBankCache = bank;
      return true;
    },
    state: captureTasDeterminismState
  });
}

function captureTasDeterminismState() {
  const cleanObject = (entry) => {
    const copy = clonePlain(entry);
    delete copy.id;
    return copy;
  };
  return {
    frame: tasState.frame,
    gameClockMs,
    rngState: tasState.rngState,
    rngCalls: tasState.rngCalls,
    run: clonePlain(run),
    player: clonePlain(player),
    inputState: clonePlain(inputState),
    objects: objects.map(cleanObject),
    particles: particles.map(cleanObject)
  };
}

function resetDebugSave() {
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  normalizeTutorialState(state);
  ensureMissions();
  resetRun();
  renderPanel();
  updateHud();
  maybeStartIntroGuide({ force: true });
  debugMessage("セーブを初期化しました");
  persistStateQuiet();
}

function setDebugUpgradesToCap() {
  if (!DEBUG_MODE) return;
  const cap = normalUpgradeCap();
  for (const def of upgradeDefs) {
    state.upgrades[def.id] = cap;
  }
  renderPanel();
  updateHud();
  debugMessage(`通常強化を上限 Lv${cap} にしました`);
  persistStateQuiet();
}

function renderDebugEventButtons() {
  if (!DEBUG_MODE || !debugEventButtons) return;
  debugEventButtons.textContent = "";
  for (const def of RANDOM_EVENT_DEFS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = eventName(def.value);
    button.dataset.debugEvent = def.value;
    button.addEventListener("click", () => forceDebugEvent(def.value));
    debugEventButtons.appendChild(button);
  }
}

function forceDebugEvent(event) {
  if (!DEBUG_MODE) return;
  startEvent(event, { resetCooldown: true });
  debugMessage(`EVENT: ${eventName(event)}`);
}

async function initDebugAssetSceneViewer() {
  if (!DEBUG_MODE || !debugAssetSceneControls) return;
  debugAssetSceneSelect?.addEventListener("change", () => {
    showDebugAssetScene(Number(debugAssetSceneSelect.value || 0));
  });
  debugAssetSceneShow?.addEventListener("click", () => {
    showDebugAssetScene(Number(debugAssetSceneSelect?.value || assetSceneState.selectedIndex || 0));
  });
  debugAssetScenePrevious?.addEventListener("click", () => stepDebugAssetScene(-1));
  debugAssetSceneNext?.addEventListener("click", () => stepDebugAssetScene(1));
  debugAssetSceneClose?.addEventListener("click", closeDebugAssetScene);
  exposeDebugAssetSceneTools();

  try {
    const response = await fetch("ASSET_LIST.md", { cache: "no-store" });
    if (!response.ok) throw new Error(`ASSET_LIST.md ${response.status}`);
    assetSceneState.catalog = parseAssetSceneCatalog(await response.text());
    renderDebugAssetSceneCatalog();
    debugMessage(`ASSET SCENE ${assetSceneState.catalog.length}項目 READY`);
  } catch (error) {
    console.warn(error);
    if (debugAssetSceneInfo) debugAssetSceneInfo.textContent = `ASSET_LIST.md 読込失敗: ${error.message}`;
  }
}

function parseAssetSceneCatalog(markdown) {
  const entries = [];
  let section = "";
  for (const rawLine of String(markdown || "").split(/\r?\n/)) {
    const heading = rawLine.match(/^#{2,3}\s+(.+?)\s*$/);
    if (heading) {
      section = heading[1];
      continue;
    }
    const bullet = rawLine.match(/^\s*-\s+(.+?)\s*$/);
    if (!bullet || !section) continue;
    entries.push({
      id: `asset_${entries.length}`,
      index: entries.length,
      section,
      item: bullet[1]
    });
  }
  return entries;
}

function renderDebugAssetSceneCatalog() {
  if (!debugAssetSceneSelect) return;
  debugAssetSceneSelect.textContent = "";
  const groups = new Map();
  for (const entry of assetSceneState.catalog) {
    if (!groups.has(entry.section)) {
      const group = document.createElement("optgroup");
      group.label = entry.section;
      groups.set(entry.section, group);
      debugAssetSceneSelect.appendChild(group);
    }
    const option = document.createElement("option");
    option.value = String(entry.index);
    option.textContent = entry.item;
    groups.get(entry.section).appendChild(option);
  }
  const ready = assetSceneState.catalog.length > 0;
  debugAssetSceneSelect.disabled = !ready;
  for (const button of [debugAssetScenePrevious, debugAssetSceneShow, debugAssetSceneNext]) {
    if (button) button.disabled = !ready;
  }
  if (debugAssetSceneClose) debugAssetSceneClose.disabled = true;
  if (debugAssetSceneInfo) {
    debugAssetSceneInfo.textContent = ready
      ? `${assetSceneState.catalog.length}項目 READY / 項目名を選ぶと実ゲーム場面を静止表示します`
      : "ASSET_LIST.md に項目がありません";
  }
}

function exposeDebugAssetSceneTools() {
  if (!DEBUG_MODE) return;
  window.__irfAssetSceneDebug = Object.freeze({
    catalog: () => clonePlain(assetSceneState.catalog),
    show: (indexOrName) => {
      const index = typeof indexOrName === "number"
        ? indexOrName
        : assetSceneState.catalog.findIndex((entry) => entry.item === indexOrName);
      return showDebugAssetScene(index);
    },
    close: closeDebugAssetScene,
    state: () => ({
      active: assetSceneState.active,
      selectedIndex: assetSceneState.selectedIndex,
      entry: clonePlain(assetSceneState.entry),
      description: assetSceneState.description,
      musicAvailable: assetSceneState.musicAvailable,
      frozenGameClockMs: gameClockMs,
      objectCount: objects.length
    })
  });
}

function stepDebugAssetScene(direction) {
  const count = assetSceneState.catalog.length;
  if (!count) return false;
  const current = Number(debugAssetSceneSelect?.value || assetSceneState.selectedIndex || 0);
  const next = (current + direction + count) % count;
  if (debugAssetSceneSelect) debugAssetSceneSelect.value = String(next);
  return showDebugAssetScene(next);
}

function showDebugAssetScene(index) {
  if (!DEBUG_MODE || !assetSceneState.catalog.length) return false;
  const normalizedIndex = Math.max(0, Math.min(assetSceneState.catalog.length - 1, Math.floor(Number(index) || 0)));
  const entry = assetSceneState.catalog[normalizedIndex];
  if (!assetSceneState.snapshot) {
    assetSceneState.snapshot = captureTasSnapshot();
    assetSceneState.originalEventLogText = eventLog?.textContent || "";
  }
  else restoreTasSnapshot(assetSceneState.snapshot);

  assetSceneState.active = true;
  assetSceneState.selectedIndex = normalizedIndex;
  assetSceneState.entry = entry;
  assetSceneState.description = "";
  assetSceneState.musicAvailable = false;
  assetSceneState.musicKeyOverride = "";
  document.body.classList.add("asset-scene-active");
  if (debugAssetSceneSelect) debugAssetSceneSelect.value = String(normalizedIndex);
  if (debugAssetSceneClose) debugAssetSceneClose.disabled = false;

  prepareAssetSceneBase(assetSceneAreaIndex(entry));
  prepareAssetSceneEntry(entry);
  if (eventLog) eventLog.textContent = `ASSET SCENE: ${entry.item}`;
  updateHud();
  renderPanel();
  syncAssetSceneTabState();
  applyAssetSceneFocus();
  syncBgm();
  draw();
  updateDebugAssetSceneInfo();
  debugMessage(`ASSET ${normalizedIndex + 1}/${assetSceneState.catalog.length}: ${entry.item}`);
  return true;
}

function closeDebugAssetScene() {
  if (!assetSceneState.active && !assetSceneState.snapshot) return false;
  const snapshot = assetSceneState.snapshot;
  const originalEventLogText = assetSceneState.originalEventLogText;
  clearAssetSceneFocus();
  assetSceneState.active = false;
  assetSceneState.snapshot = null;
  assetSceneState.originalEventLogText = "";
  assetSceneState.entry = null;
  assetSceneState.description = "";
  assetSceneState.musicAvailable = false;
  assetSceneState.musicKeyOverride = "";
  document.body.classList.remove("asset-scene-active");
  if (snapshot) restoreTasSnapshot(snapshot);
  if (eventLog) eventLog.textContent = originalEventLogText;
  if (debugAssetSceneClose) debugAssetSceneClose.disabled = true;
  if (debugAssetSceneInfo) {
    debugAssetSceneInfo.textContent = `${assetSceneState.catalog.length}項目 READY / 元のゲーム状態へ戻りました`;
  }
  debugMessage("ASSET SCENE CLOSED");
  return true;
}

function isAssetSceneActive() {
  return DEBUG_MODE && assetSceneState.active;
}

function prepareAssetSceneBase(index = 0) {
  const areaIndexValue = Math.max(0, Math.min(areas.length - 1, index));
  const area = areas[areaIndexValue];
  state.currentPrestigeDistance = area.start;
  state.coins = Math.max(12345, Number(state.coins || 0));
  state.gems = Math.max(67, Number(state.gems || 0));
  state.research = Math.max(89, Number(state.research || 0));
  state.prestigePoints = Math.max(12, Number(state.prestigePoints || 0));
  Object.assign(run, {
    active: true,
    gameOver: false,
    distance: area.start + Math.min(240, area.runDistance * 0.25),
    hp: Math.max(1, getStats().maxHp),
    combo: 3,
    dashTimer: 0,
    dashCooldown: 0,
    skillShield: 0,
    giantTimer: 0,
    timeStop: 0,
    gravityGuardTimer: 0,
    phasePinTimer: 0,
    chillTimer: 0,
    bossBattle: false,
    bossAreaIndex: -1,
    bossPhase: "attack",
    bossPatternIndex: 0,
    bossVolley: 0,
    bossSoulMode: "red",
    bossModeTimer: 0,
    bossModePulse: 0,
    event: null,
    eventTimer: 0,
    gravityFlip: false,
    gravityLandingGuard: false,
    stockedItem: null,
    tasAreaIndex: isTasEnabled() ? areaIndexValue : null
  });
  objects = [];
  particles = [];
  Object.assign(player, {
    x: 112,
    y: groundY - 48,
    w: 36,
    h: 48,
    vy: 0,
    jumpsUsed: 0,
    slideTimer: 0,
    invulnerable: 0,
    regenTimer: 0,
    damageTimer: 0
  });
  Object.assign(inputState, {
    jumpHolding: false,
    jumpActive: false,
    slideHolding: false,
    pointerSlideActive: false,
    pointerJumpActive: false,
    blockDirection: "mid"
  });
  restartPlayerAnimation("running");
  runOverlay.classList.add("hidden");
  setAssetSceneTab("upgrades");
  assetSceneState.focusSelector = ".canvas-frame";
}

function prepareAssetSceneEntry(entry) {
  if (entry.section === "プレイヤー") prepareAssetPlayerScene(entry.item);
  else if (entry.section === "コイン・報酬") prepareAssetRewardScene(entry.item);
  else if (entry.section === "アイテム・スキル") prepareAssetItemScene(entry.item);
  else if (entry.section === "障害物") prepareAssetObstacleScene(entry.item);
  else if (entry.section === "敵") prepareAssetEnemyScene(entry.item);
  else if (entry.section === "ボス") prepareAssetBossScene(assetSceneBossIndex(entry.item));
  else if (entry.section === "宝箱") prepareAssetChestScene(entry.item);
  else if (entry.section === "装備") prepareAssetEquipmentScene(entry.item);
  else if (entry.section === "エリア背景") prepareAssetBackgroundScene(assetSceneAreaIndex(entry));
  else if (entry.section === "UI") prepareAssetUiScene(entry.item);
  else if (entry.section === "エフェクト") prepareAssetEffectScene(entry.item);
  else prepareAssetAudioScene(entry);
}

function prepareAssetPlayerScene(item) {
  if (item.includes("ジャンプ")) {
    player.y = groundY - player.h - 128;
    player.vy = -90;
    player.jumpsUsed = 1;
    restartPlayerAnimation("jump");
    player.animationStartedAt = gameNow() - 1000;
    assetSceneState.description = "障害物を跳び越えている最中の、ジャンプ最終フレームです。";
  } else if (item.includes("スライディング")) {
    player.slideTimer = 0.2;
    player.y = groundY - getPlayerHeight();
    restartPlayerAnimation("sliding");
    assetPushObstacle("laser", 390, { y: groundY - 118, w: 26, h: 78 });
    assetSceneState.description = "レーザー柱の下を14フレームのスライドで通過する場面です。";
  } else if (item.includes("ダッシュ")) {
    run.dashTimer = 2.5;
    player.invulnerable = 2.5;
    restartPlayerAnimation("dash");
    player.animationStartedAt = gameNow() - 1000;
    assetPushEnemy("slime", 0, 430);
    assetSceneState.description = "ダッシュを発動し、無敵エフェクトをまとって敵へ接近する場面です。";
  } else if (item.includes("ダメージ")) {
    player.damageTimer = 0.5;
    player.invulnerable = 0.8;
    restartPlayerAnimation("damage");
    burst(player.x + player.w / 2, player.y + player.h / 2, "#ef6b65", 18);
    assetSceneState.description = "障害物へ接触した直後の、ダメージスプライトとヒット粒子です。";
  } else {
    restartPlayerAnimation("running");
    player.animationStartedAt = gameNow() - 240;
    assetPushCoin(5, 370, groundY - 108);
    assetSceneState.description = "草原の通常ランでコイン列へ向かって走る場面です。";
  }
}

function prepareAssetRewardScene(item) {
  const coinMatch = item.match(/通常コイン\s+(\d+)/);
  if (coinMatch) {
    const value = Number(coinMatch[1]);
    assetPushCoin(value, 430, groundY - 112);
    assetPushObstacle("crate", 610);
    assetSceneState.description = `${value}コインが通常ランの回避ルート上へ出現した場面です。`;
    return;
  }
  if (item === "虹コイン") assetPushRare("rainbow", 430);
  if (item === "ダイヤ") assetPushRare("diamond", 430);
  if (item === "宝石") assetPushRare("gem", 430);
  if (["虹コイン", "ダイヤ", "宝石"].includes(item)) {
    assetSceneState.description = `通常コイン列の先へ${item}がレア報酬として出現した場面です。`;
    return;
  }
  if (item.includes("研究ポイント")) {
    state.research = 89;
    setAssetSceneTab("research");
    assetSceneState.focusSelector = "#researchStat";
    assetSceneState.description = "ボス報酬や施設生産で得た研究ポイントがHUDへ反映された場面です。";
  } else {
    state.prestigePoints = 12;
    setAssetSceneTab("prestige");
    assetSceneState.focusSelector = "#prestigeStat";
    assetSceneState.description = "転生後、永続強化に使える転生ポイントがHUDへ加算された場面です。";
  }
}

function prepareAssetItemScene(item) {
  const kind = item.includes("ダッシュ") ? "dash"
    : item.includes("無敵") ? "shield"
      : item.includes("巨大化") ? "giant"
        : item.includes("磁石") ? "magnet"
          : item.includes("時間停止") ? "time"
            : item.includes("2段ジャンプ") ? "doubleJump"
              : item.includes("壁走り") ? "wallRun"
                : "clone";
  assetPushItem(kind, 430);
  if (kind === "wallRun") assetPushObstacle("crate", 610, { h: 112 });
  if (kind === "clone") run.echoActive = true;
  assetSceneState.description = `${item}が走行ルート中央へ出現し、取得可能になった場面です。`;
}

function prepareAssetObstacleScene(item) {
  const areaIndexValue = item.includes("エリア別") ? 4 : item.includes("隕石") ? 1 : 0;
  prepareAssetSceneBase(areaIndexValue);
  const kind = item.includes("トゲ") ? "spike"
    : item.includes("レーザー") ? "laser"
      : item.includes("爆弾") ? "bomb"
        : item.includes("隕石") ? "meteor"
          : "crate";
  assetPushObstacle(kind, 455, item.includes("エリア別") ? { color: currentArea().accent, destructible: true } : {});
  assetPushCoin(10, 560, groundY - 150);
  assetSceneState.description = `${item}が通常ランの進行方向に現れ、回避か破壊を判断する場面です。`;
}

function prepareAssetEnemyScene(item) {
  const config = item.includes("鳥") ? { kind: "bird", area: 0 }
    : item.includes("爆弾") ? { kind: "bomb", area: 1 }
      : item.includes("レーザー") ? { kind: "laserEnemy", area: 4 }
        : item.includes("巨大ロボ") ? { kind: "giantRobot", area: 4 }
          : item.includes("ドラゴン") ? { kind: "dragon", area: 5 }
            : { kind: "slime", area: 0 };
  prepareAssetSceneBase(config.area);
  assetPushEnemy(config.kind, config.area, 470);
  if (config.kind === "laserEnemy") assetPushObstacle("laser", 610, { y: groundY - 122 });
  assetSceneState.description = `${item}がエリア固有能力をまとい、プレイヤーの進路を塞ぐ場面です。`;
}

function prepareAssetBossScene(index) {
  prepareAssetSceneBase(index);
  run.distance = nextAreaBossDistance(index);
  run.bossBattle = true;
  run.bossAreaIndex = index;
  run.bossPhase = "attack";
  run.bossSoulMode = bossSoulModeForArea(index);
  const boss = spawnBoss(index, { x: 555, finalBoss: true, hp: FINAL_BOSS_HIT_POINT_TARGETS[index] || 20 });
  boss.vulnerable = false;
  assetPushBossAttackPreview(index);
  assetSceneState.description = `${bossName(index)}が固有ギミックの攻撃フェーズを開始した場面です。`;
}

function prepareAssetChestScene(item) {
  const type = item.startsWith("銀") ? "silver"
    : item.startsWith("金") ? "gold"
      : item.startsWith("虹") ? "rainbow"
        : item.startsWith("神") ? "god"
          : "wood";
  assetPushChest(type, 445);
  if (item.includes("開封エフェクト")) {
    burst(465, groundY - 42, chestDefs.gold.color, 28);
    assetPushRare("gem", 515);
    assetSceneState.description = "宝箱を開封し、装備・コイン報酬が飛び出す瞬間です。";
  } else {
    assetSceneState.description = `${item}が500mごとの走行報酬として出現した場面です。`;
  }
}

function prepareAssetEquipmentScene(item) {
  const slot = item.startsWith("頭") ? "頭"
    : item.startsWith("靴") ? "靴"
      : item.startsWith("胴") ? "胴"
        : "アクセサリー";
  state.equipment = rarityDefs.map((rarity, index) => ({
    id: `asset_${slot}_${rarity.id}`,
    name: equipmentName(slot, rarity.id),
    slot,
    rarity: rarity.id,
    rarityClass: rarity.colorClass,
    stat: slot === "胴" ? "hp" : slot === "靴" ? "jump" : slot === "頭" ? "idle" : "coin",
    value: slot === "胴" ? rarity.rank : Number((0.02 * rarity.rank).toFixed(3)),
    assetOrder: index
  }));
  state.equipped = { [slot]: state.equipment[state.equipment.length - 1].id };
  equipmentView = slot;
  setAssetSceneTab("equipment");
  assetSceneState.focusSelector = "#panelContent";
  assetSceneState.description = `${slot}装備をNからLRまでレア度順に比較し、装備を選ぶ場面です。`;
}

function prepareAssetBackgroundScene(index) {
  prepareAssetSceneBase(index);
  assetPushCoin(5, 470, groundY - 112);
  assetPushObstacle(index % 2 ? "spike" : "crate", 610, { color: currentArea().obstacle });
  assetSceneState.description = `${localizedAreaName(areas[index])}を通常走行し、背景・地面・遠景が同時に見える場面です。`;
}

function prepareAssetUiScene(item) {
  if (item.includes("コイン、宝石")) {
    assetSceneState.focusSelector = ".resource-strip";
    assetSceneState.description = "走行報酬と施設生産がHUDの4資源表示へ反映された場面です。";
  } else if (item.includes("強化カテゴリ")) {
    setAssetSceneTab("upgrades");
    assetSceneState.focusSelector = ".tab-bar";
    assetSceneState.description = "コインで通常強化を選択する強化タブです。";
  } else if (item.includes("工場カテゴリ")) {
    factoryView = "coins";
    setAssetSceneTab("factory");
    assetSceneState.focusSelector = ".tab-bar";
    assetSceneState.description = "放置施設の種類を切り替えて建設する工場タブです。";
  } else if (item.includes("任務/実績/研究")) {
    ensureMissions();
    state.missions.daily.dailyDistance.progress = dailyMissionDefs[0].target;
    setAssetSceneTab("missions");
    assetSceneState.focusSelector = ".tab-bar";
    assetSceneState.description = "達成済み任務と実績報酬を確認する場面です。";
  } else if (item.includes("リワード広告")) {
    state.chests = [{ id: "asset_ad_chest", type: "silver", remaining: 120 }];
    setAssetSceneTab("prestige");
    assetSceneState.focusSelector = "#panelContent";
    assetSceneState.description = "転生欄上部で任意のリワード広告報酬を選ぶ場面です。";
  } else {
    assetSceneState.focusSelector = ".command-row";
    assetSceneState.description = "走行中に保存・再走・スキルなどの操作ボタンを使う場面です。";
  }
}

function prepareAssetEffectScene(item) {
  if (item === "コイン取得") {
    burst(player.x + 70, player.y + 18, "#f2b84b", 20);
    assetPushCoin(10, player.x + 68, player.y + 12);
  } else if (item === "レア取得") {
    burst(player.x + 70, player.y + 18, "#b98cff", 24);
    assetPushRare("diamond", player.x + 68, player.y);
  } else if (item === "敵撃破") {
    burst(450, groundY - 48, "#75d05e", 30);
  } else if (item === "ボス撃破") {
    prepareAssetBossScene(0);
    const boss = objects.find((obj) => obj.type === "boss");
    if (boss) boss.hp = 0;
    burst(595, groundY - 80, "#f2cf5a", 48);
  } else if (item === "レベルアップ") {
    state.level = Math.max(25, state.level);
    burst(player.x + 18, player.y + 12, "#48bde7", 28);
  } else if (item === "転生") {
    prepareAssetSceneBase(0);
    state.prestigePoints = Math.max(12, state.prestigePoints);
    burst(player.x + 18, player.y + 16, "#fff1a5", 42);
    setAssetSceneTab("prestige");
  } else if (item === "コイン雨") {
    prepareAssetEventScene("coinRain");
  } else if (item === "フィーバータイム") {
    prepareAssetEventScene("fever");
  } else if (item === "宝箱ラッシュ") {
    prepareAssetEventScene("chestRush");
  } else if (item === "重力反転") {
    prepareAssetEventScene("gravity");
  } else {
    prepareAssetEventScene("clearPath");
    burst(470, groundY - 44, currentArea().obstacle, 22);
  }
  assetSceneState.description = `${item}が成立した瞬間を、粒子と対象物を含めて静止した場面です。`;
}

function prepareAssetAudioScene(entry) {
  const item = entry.item;
  if (entry.section === "共通画面BGM") prepareAssetCommonMusicScene(item);
  else if (entry.section === "通常ランBGM") prepareAssetBackgroundScene(assetSceneAreaIndex(entry));
  else if (entry.section === "ボスBGM") prepareAssetBossScene(assetSceneBossIndex(item));
  else if (entry.section === "ランダムイベントBGM") prepareAssetEventScene(assetSceneEventFromItem(item));
  else if (entry.section === "特殊状態BGM") prepareAssetSpecialMusicScene(item);
  else prepareAssetJingleScene(item);

  const file = assetSceneMusicFile(item);
  assetSceneState.musicAvailable = Boolean(file);
  assetSceneState.musicKeyOverride = file ? `asset-file:${file}` : "";
  if (!file) stopBgm();
  const status = file ? "音源実装済み。BGM ONならこの場面で再生します。" : "音源未追加。使用予定の実ゲーム場面を表示しています。";
  assetSceneState.description = `${assetSceneState.description} ${status}`.trim();
}

function prepareAssetCommonMusicScene(item) {
  if (item.includes("工場")) setAssetSceneTab("factory");
  else if (item.includes("装備")) setAssetSceneTab("equipment");
  else if (item.includes("ミッション")) setAssetSceneTab("missions");
  else if (item.includes("研究")) setAssetSceneTab("research");
  else if (item.includes("転生")) setAssetSceneTab("prestige");
  else if (item.includes("強化")) setAssetSceneTab("upgrades");
  else if (item.includes("リザルト")) prepareAssetGameOverScene();
  else if (item.includes("トップページ")) assetSceneState.focusSelector = ".home-link";
  else assetSceneState.focusSelector = ".topbar";
  assetSceneState.description = `${item.replace("BGM", "")}を開いている場面です。`;
}

function prepareAssetSpecialMusicScene(item) {
  if (item.includes("ダッシュ")) {
    run.dashTimer = 2.5;
    restartPlayerAnimation("dash");
  } else if (item.includes("無敵")) {
    player.invulnerable = 3;
    run.skillShield = 3;
  } else if (item.includes("時間停止")) {
    run.timeStop = 3;
    assetPushObstacle("meteor", 470);
  } else if (item.includes("低HP")) {
    run.hp = 1;
    assetPushEnemy("bomb", 3, 470);
  } else {
    run.combo = 24;
    for (let index = 0; index < 5; index += 1) assetPushCoin(10, 390 + index * 42, groundY - 110);
  }
  assetSceneState.description = `${item.replace("BGMまたは上乗せレイヤー", "").replace("BGM", "")}の特殊状態が継続中の場面です。`;
}

function prepareAssetJingleScene(item) {
  if (item.includes("ゲームオーバー")) prepareAssetGameOverScene();
  else if (item.includes("レベルアップ")) prepareAssetEffectScene("レベルアップ");
  else if (item.includes("宝箱入手")) prepareAssetChestScene("金宝箱");
  else if (item.includes("宝箱開封")) prepareAssetChestScene("宝箱開封エフェクト");
  else if (item.includes("レア装備")) prepareAssetEquipmentScene("アクセサリーアイコン N/R/SR/SSR/UR/LR");
  else if (item.includes("ボス出現")) prepareAssetBossScene(0);
  else if (item.includes("ボス撃破")) prepareAssetEffectScene("ボス撃破");
  else if (item.includes("ミッション")) prepareAssetCompletedMissionScene(false);
  else if (item.includes("実績")) prepareAssetCompletedMissionScene(true);
  else if (item.includes("転生")) prepareAssetEffectScene("転生");
  else if (item.includes("研究")) prepareAssetResearchCompleteScene();
  else {
    assetPushCoin(1, 390, groundY - 100);
    assetSceneState.description = "再走開始直後、最初のコイン列が見える場面です。";
  }
}

function prepareAssetEventScene(event) {
  run.event = event;
  run.eventTimer = 10;
  run.gravityFlip = event === "gravity";
  if (event === "gravity") {
    player.y = PLAYER_CEILING_Y;
    player.vy = 0;
  } else if (event === "coinRain" || event === "coin3" || event === "fever") {
    for (let index = 0; index < 8; index += 1) {
      assetPushCoin(index % 3 === 0 ? 10 : 5, 330 + index * 48, groundY - 90 - (index % 3) * 42);
    }
  } else if (event === "meteor") {
    for (let index = 0; index < 3; index += 1) assetPushObstacle("meteor", 380 + index * 110, { y: 70 + index * 65 });
  } else if (event === "chestRush") {
    ["wood", "silver", "gold"].forEach((type, index) => assetPushChest(type, 360 + index * 105));
  } else if (event === "clearPath") {
    for (let index = 0; index < 7; index += 1) assetPushCoin(5, 350 + index * 50, groundY - 112);
  }
  assetSceneState.description = `${eventName(event)}イベントの専用生成パターンが画面内へ入った場面です。`;
}

function prepareAssetGameOverScene() {
  run.gameOver = true;
  run.active = false;
  runOverlay.classList.remove("hidden");
  overlayTitle.textContent = currentLanguage === "en" ? "RUN END" : "ラン終了";
  overlayText.textContent = `${formatNumber(run.distance)}m`;
  assetSceneState.focusSelector = "#runOverlay";
  assetSceneState.description = "HPが0になり、距離結果と再走ボタンが表示された場面です。";
}

function prepareAssetCompletedMissionScene(achievement) {
  ensureMissions();
  if (achievement) {
    state.achievements.firstJump = { unlocked: true, claimed: false };
  } else {
    state.missions.daily.dailyDistance.progress = dailyMissionDefs[0].target;
  }
  setAssetSceneTab("missions");
  assetSceneState.focusSelector = "#panelContent";
  assetSceneState.description = achievement ? "実績条件を満たし、報酬が受取可能になった場面です。" : "デイリー任務を達成し、報酬が受取可能になった場面です。";
}

function prepareAssetResearchCompleteScene() {
  state.defeatedAreaBosses = Object.fromEntries(areas.slice(0, -1).map((_, index) => [index, true]));
  state.researchTree.sandBreaker = Math.max(1, state.researchTree.sandBreaker || 0);
  state.research = Math.max(200, state.research);
  setAssetSceneTab("research");
  assetSceneState.focusSelector = "#panelContent";
  assetSceneState.description = "エリア最終ボス由来の研究を完了し、スキル効果が反映された場面です。";
}

function assetPushCoin(value, x, y = groundY - 112) {
  objects.push({ type: "coin", x, y, w: 24, h: 24, value, spin: 0 });
}

function assetPushRare(kind, x, y = groundY - 132) {
  objects.push({ type: "rare", kind, x, y, w: 28, h: 28 });
}

function assetPushItem(kind, x, y = groundY - 132) {
  objects.push({ type: "item", kind, x, y, w: 30, h: 30 });
}

function assetPushChest(type, x, y = groundY - 36) {
  objects.push({ type: "chest", chestType: type, x, y, w: 46, h: 36 });
}

function assetPushObstacle(kind, x, options = {}) {
  const defaultHeight = kind === "spike" ? 42 : kind === "laser" ? 82 : kind === "meteor" ? 36 : 58;
  const height = options.h || defaultHeight;
  const y = options.y ?? (kind === "meteor" ? groundY - 170 : groundY - height);
  objects.push({
    type: "obstacle",
    kind,
    x,
    y,
    w: options.w || (kind === "spike" ? 52 : kind === "laser" ? 26 : kind === "meteor" ? 36 : 48),
    h: height,
    vx: 0,
    vy: 0,
    gravity: 0,
    color: options.color || (kind === "laser" ? "#ef6b65" : kind === "meteor" ? "#ef6b65" : currentArea().obstacle),
    destructible: Boolean(options.destructible)
  });
}

function assetPushEnemy(kind, index, x) {
  const airborne = kind === "bird" || kind === "dragon";
  const large = kind === "giantRobot";
  const enemy = applyEnemyTraits({
    type: "enemy",
    kind,
    x,
    y: airborne ? groundY - (kind === "dragon" ? 165 : 135) : groundY - (large ? 88 : 44),
    w: large ? 74 : kind === "dragon" ? 82 : 46,
    h: large ? 88 : kind === "dragon" ? 44 : airborne ? 30 : 44,
    hp: large ? 3 : 1,
    maxHp: large ? 3 : 1,
    color: kind === "bird" ? currentArea().accent
      : kind === "bomb" ? "#30333c"
        : kind === "laserEnemy" ? "#ef6b65"
          : kind === "giantRobot" ? "#48bde7"
            : kind === "dragon" ? "#b98cff"
              : "#75d05e"
  }, index);
  objects.push(enemy);
}

function assetPushBossAttackPreview(index) {
  const kinds = ["slime", "meteor", "laser", "meteor", "laser", "meteor", "meteor", "laser", "meteor"];
  const kind = kinds[index] || "meteor";
  if (kind === "slime") assetPushEnemy("slime", index, 390);
  else assetPushObstacle(kind, 405, { y: kind === "meteor" ? groundY - 150 : groundY - 120, color: currentArea().accent });
}

function assetSceneAreaIndex(entry) {
  const item = entry?.item || "";
  const match = areas.findIndex((area) => item.startsWith(area.name) || item.includes(`${area.name}エリア`));
  return match >= 0 ? match : 0;
}

function assetSceneBossIndex(item) {
  const names = ["Slime King", "Sand Wyrm", "Frost Core", "Lava Golem", "Giant Robot", "Star Dragon", "Void Engine", "Aether Lord", "Infinity Gate"];
  const index = names.findIndex((name) => String(item || "").includes(name));
  return index >= 0 ? index : 0;
}

function assetSceneEventFromItem(item) {
  if (item.includes("隕石")) return "meteor";
  if (item.includes("フィーバー")) return "fever";
  if (item.includes("宝箱")) return "chestRush";
  if (item.includes("重力")) return "gravity";
  if (item.includes("障害物")) return "clearPath";
  if (item.includes("3倍")) return "coin3";
  return "coinRain";
}

function assetSceneMusicFile(item) {
  const common = {
    "タイトル画面BGM": "タイトル画面BGM.ogg",
    "トップページ/ゲーム選択画面BGM": "トップページゲーム選択画面BGM.ogg",
    "メインメニューBGM": "メインメニューBGM.ogg",
    "強化画面BGM": "強化画面BGM.ogg",
    "工場/放置施設画面BGM": "工場放置施設画面BGM.ogg",
    "装備/宝箱画面BGM": "装備宝箱画面BGM.ogg",
    "ミッション/実績画面BGM": "ミッション実績画面BGM.ogg",
    "研究ツリー画面BGM": "研究ツリー画面BGM.ogg",
    "転生画面BGM": "転生画面BGM.ogg",
    "リザルト画面BGM": "リザルト画面BGM.ogg"
  };
  if (common[item]) return common[item];
  const index = areas.findIndex((area) => item === `${area.name}エリアBGM`);
  if (index >= 0 && index < areaMusicFiles.length && index !== areas.length - 1) return areaMusicFiles[index];
  return "";
}

function setAssetSceneTab(tab) {
  activeTab = tab;
  musicScene = tab;
  if (tab === "equipment" && !equipmentView) equipmentView = "chests";
}

function syncAssetSceneTabState() {
  document.querySelectorAll(".tab-bar button[data-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === activeTab);
  });
}

function clearAssetSceneFocus() {
  assetSceneState.focusElement?.classList.remove("asset-scene-focus");
  assetSceneState.focusElement = null;
  assetSceneState.focusSelector = "";
}

function applyAssetSceneFocus() {
  const selector = assetSceneState.focusSelector || ".canvas-frame";
  clearAssetSceneFocus();
  const element = document.querySelector(selector);
  if (!element) return;
  element.classList.add("asset-scene-focus");
  assetSceneState.focusElement = element;
  assetSceneState.focusSelector = selector;
}

function updateDebugAssetSceneInfo() {
  if (!debugAssetSceneInfo || !assetSceneState.entry) return;
  const audio = assetSceneState.entry.section.includes("BGM") || assetSceneState.entry.section.includes("ジングル")
    ? ` / AUDIO ${assetSceneState.musicAvailable ? "READY" : "PENDING"}`
    : "";
  debugAssetSceneInfo.textContent = `${assetSceneState.selectedIndex + 1}/${assetSceneState.catalog.length} [${assetSceneState.entry.section}] ${assetSceneState.entry.item} / PAUSED${audio} / ${assetSceneState.description}`;
}

function tasScenarioOptionsSafe() {
  try {
    return tasScenarioOptions();
  } catch (error) {
    if (error instanceof ReferenceError) return [];
    console.warn(error);
    return [];
  }
}

function selectedTasScenarioId() {
  return debugSettings.tasScenarioId || tasState.scenarioId || TAS_DEFAULT_SCENARIO_ID;
}

function renderTasScenarioOptions(options, selectedId) {
  if (!options.length) return `<option value="">SCENE LOADING</option>`;
  return options.map((option) => (
    `<option value="${escapeHtml(option.id)}" ${option.id === selectedId ? "selected" : ""}>${escapeHtml(option.label)}</option>`
  )).join("");
}

function loadTasSiteSaves() {
  if (!DEBUG_MODE) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(TAS_SITE_SAVE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && entry.filename && entry.snapshot) : [];
  } catch (error) {
    console.warn(error);
    return [];
  }
}

function persistTasSiteSaves(entries) {
  if (!DEBUG_MODE) return;
  localStorage.setItem(TAS_SITE_SAVE_KEY, JSON.stringify(entries.slice(0, TAS_SITE_SAVE_LIMIT)));
}

function renderTasSiteSaveOptions(entries, selectedName) {
  if (!entries.length) return `<option value="">NO SITE SAVE</option>`;
  return entries.map((entry) => (
    `<option value="${escapeHtml(entry.filename)}" ${entry.filename === selectedName ? "selected" : ""}>${escapeHtml(entry.filename)}</option>`
  )).join("");
}

let tasAutoInputBankCacheRaw = null;
let tasAutoInputBankCache = {};

function loadTasAutoInputBank() {
  if (!DEBUG_MODE) return {};
  try {
    const raw = localStorage.getItem(TAS_AUTO_INPUT_BANK_KEY) || "{}";
    if (raw === tasAutoInputBankCacheRaw) return tasAutoInputBankCache;
    const parsed = JSON.parse(raw);
    const source = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    tasAutoInputBankCacheRaw = raw;
    tasAutoInputBankCache = Object.fromEntries(Object.entries(source).map(([scenarioId, entry]) => [
      scenarioId,
      {
        ...entry,
        inputs: Array.isArray(entry?.inputs) ? entry.inputs : expandTasInputRuns(entry?.inputRuns)
      }
    ]));
    return tasAutoInputBankCache;
  } catch (error) {
    console.warn(error);
    return {};
  }
}

function persistTasAutoInputBank(bank) {
  if (!DEBUG_MODE) return;
  const compressed = Object.fromEntries(Object.entries(bank || {}).map(([scenarioId, entry]) => {
    const inputs = normalizeTasInputFrames(entry?.inputs);
    const stored = {
      ...entry,
      scenarioId,
      frameCount: inputs.length,
      inputRuns: compressTasInputFrames(inputs)
    };
    delete stored.inputs;
    return [scenarioId, stored];
  }));
  localStorage.setItem(TAS_AUTO_INPUT_BANK_KEY, JSON.stringify(compressed));
  tasAutoInputBankCacheRaw = null;
  tasAutoInputBankCache = {};
}

function tasAutoInputBankCount() {
  return Object.keys(loadTasAutoInputBank()).length;
}

function normalizeTasInputFrames(frames) {
  const normalized = [];
  for (const frame of Array.isArray(frames) ? frames : []) {
    const index = Number(frame.frame);
    if (!Number.isFinite(index) || index < 0) continue;
    normalized[index] = {
      frame: index,
      jump: Boolean(frame.jump),
      slide: Boolean(frame.slide),
      block: ["high", "mid", "low"].includes(frame.block) ? frame.block : "mid",
      skill: Boolean(frame.skill),
      cycle: Boolean(frame.cycle)
    };
  }
  return normalized;
}

function compressTasInputFrames(frames) {
  const runs = [];
  let current = null;
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index] || { frame: index, jump: false, slide: false, block: "mid", skill: false, cycle: false };
    const mask = (frame.jump ? 1 : 0) | (frame.slide ? 2 : 0) | (frame.skill ? 4 : 0) | (frame.cycle ? 8 : 0);
    const block = frame.block === "high" ? 1 : frame.block === "low" ? 2 : 0;
    if (current && current[1] === mask && current[2] === block) {
      current[0] += 1;
    } else {
      current = [1, mask, block];
      runs.push(current);
    }
  }
  return runs;
}

function expandTasInputRuns(runs) {
  const frames = [];
  for (const runEntry of Array.isArray(runs) ? runs : []) {
    const count = Math.max(0, Math.floor(Number(runEntry?.[0]) || 0));
    const mask = Math.max(0, Math.floor(Number(runEntry?.[1]) || 0));
    const blockCode = Math.max(0, Math.floor(Number(runEntry?.[2]) || 0));
    for (let offset = 0; offset < count; offset += 1) {
      const frame = frames.length;
      frames.push({
        frame,
        jump: Boolean(mask & 1),
        slide: Boolean(mask & 2),
        block: blockCode === 1 ? "high" : blockCode === 2 ? "low" : "mid",
        skill: Boolean(mask & 4),
        cycle: Boolean(mask & 8)
      });
    }
  }
  return frames;
}

function inferTasScenarioIdFromFileName(name) {
  const match = String(name || "").match(/irf_tas(?:_input)?_(.+)_f\d+_/);
  return match ? match[1] : "";
}

function renderDebugTasControls() {
  if (!DEBUG_MODE || !debugTasControls) return;
  const enabled = isTasEnabled();
  const speed = tasSpeedMultiplier();
  const recording = tasState.recording;
  const playing = tasState.playing;
  const scenarioOptions = tasScenarioOptionsSafe();
  const scenarioId = scenarioOptions.some((option) => option.id === selectedTasScenarioId())
    ? selectedTasScenarioId()
    : (scenarioOptions[0]?.id || selectedTasScenarioId());
  const siteSaves = loadTasSiteSaves();
  const siteSaveName = siteSaves.some((entry) => entry.filename === debugSettings.tasSiteSaveName)
    ? debugSettings.tasSiteSaveName
    : (siteSaves[0]?.filename || "");
  const autoCount = tasAutoInputBankCount();
  tasState.autoLoadedCount = autoCount;
  const autoElapsed = tasState.autoEnabled ? ((gameNow() - tasState.autoStartedAtMs) / 1000).toFixed(1) : "0.0";
  debugTasControls.innerHTML = `
    <button type="button" data-debug-tas="toggle" aria-pressed="${String(enabled)}">TAS ${enabled ? "ON" : "OFF"} F1</button>
    <label class="debug-tas-select">SCENE
      <select data-debug-tas-scenario ${enabled && scenarioOptions.length ? "" : "disabled"}>
        ${renderTasScenarioOptions(scenarioOptions, scenarioId)}
      </select>
    </label>
    <button type="button" data-debug-tas="applyScenario" ${enabled && scenarioOptions.length ? "" : "disabled"}>SET SCENE</button>
    <button type="button" data-debug-tas="pause" aria-pressed="${String(tasState.paused)}" ${enabled ? "" : "disabled"}>${tasState.paused ? "PAUSED" : "RUN"} F2</button>
    <button type="button" data-debug-tas="step" ${enabled ? "" : "disabled"}>1F F3</button>
    <button type="button" data-debug-tas="saveState" ${enabled ? "" : "disabled"}>SAVE F5</button>
    <button type="button" data-debug-tas="loadState" ${enabled ? "" : "disabled"}>LOAD F8</button>
    <label class="debug-tas-select">SITE
      <select data-debug-tas-site-save ${enabled && siteSaves.length ? "" : "disabled"}>
        ${renderTasSiteSaveOptions(siteSaves, siteSaveName)}
      </select>
    </label>
    <button type="button" data-debug-tas="loadSite" ${enabled && siteSaves.length ? "" : "disabled"}>LOAD SITE</button>
    <button type="button" data-debug-tas="deleteSite" ${enabled && siteSaves.length ? "" : "disabled"}>DEL SITE</button>
    <button type="button" data-debug-tas="auto" aria-pressed="${String(tasState.autoEnabled)}" ${enabled ? "" : "disabled"}>AUTO ${tasState.autoEnabled ? "ON" : "OFF"}</button>
    <button type="button" data-debug-tas="autoStart" ${enabled ? "" : "disabled"}>AUTO START</button>
    <button type="button" data-debug-tas="autoImport" ${enabled ? "" : "disabled"}>AUTO IMPORT</button>
    <button type="button" data-debug-tas="autoClear" ${enabled && autoCount ? "" : "disabled"}>AUTO CLEAR</button>
    <button type="button" data-debug-tas="record" aria-pressed="${String(recording)}" ${enabled ? "" : "disabled"}>REC F9</button>
    <button type="button" data-debug-tas="play" aria-pressed="${String(playing)}" ${enabled ? "" : "disabled"}>PLAY F10</button>
    <button type="button" data-debug-tas="edit" ${enabled ? "" : "disabled"}>EDIT F6</button>
    <button type="button" data-debug-tas="rewind" ${enabled ? "" : "disabled"}>REW F7</button>
    <button type="button" data-debug-tas="fast" ${enabled ? "" : "disabled"}>FAST F11</button>
    <button type="button" data-debug-tas="slow" ${enabled ? "" : "disabled"}>SLOW F12</button>
    <button type="button" data-debug-tas="frame" aria-pressed="${String(Boolean(debugSettings.tasShowFrame))}" ${enabled ? "" : "disabled"}>FRAME A+F</button>
    <button type="button" data-debug-tas="kinematics" aria-pressed="${String(Boolean(debugSettings.tasShowKinematics))}" ${enabled ? "" : "disabled"}>XY A+C</button>
    <button type="button" data-debug-tas="hitbox" aria-pressed="${String(Boolean(debugSettings.tasShowHitboxes))}" ${enabled ? "" : "disabled"}>HIT F4</button>
    <button type="button" data-debug-tas="rng" aria-pressed="${String(Boolean(debugSettings.tasShowRng))}" ${enabled ? "" : "disabled"}>RNG A+R</button>
    <button type="button" data-debug-tas="watch" aria-pressed="${String(Boolean(debugSettings.tasShowWatch))}" ${enabled ? "" : "disabled"}>WATCH A+V</button>
    <button type="button" data-debug-tas="export" ${enabled ? "" : "disabled"}>EXPORT A+S</button>
    <button type="button" data-debug-tas="import" ${enabled ? "" : "disabled"}>IMPORT A+O</button>
    <span class="debug-tas-readout">F${tasState.frame} x${speed} IN ${tasState.inputFrames.length} AUTO ${autoCount} ${autoElapsed}s</span>
  `;
  debugTasControls.querySelectorAll("button[data-debug-tas]").forEach((button) => {
    button.addEventListener("click", () => handleDebugTasAction(button.dataset.debugTas));
  });
  const scenarioSelect = debugTasControls.querySelector("[data-debug-tas-scenario]");
  scenarioSelect?.addEventListener("change", () => {
    debugSettings.tasScenarioId = scenarioSelect.value || TAS_DEFAULT_SCENARIO_ID;
    persistDebugSettings();
  });
  const siteSelect = debugTasControls.querySelector("[data-debug-tas-site-save]");
  siteSelect?.addEventListener("change", () => {
    debugSettings.tasSiteSaveName = siteSelect.value || "";
    persistDebugSettings();
  });
}

function handleDebugTasAction(action) {
  if (!DEBUG_MODE) return;
  if (action === "toggle") toggleDebugTas();
  if (action === "applyScenario") applySelectedTasScenario();
  if (action === "pause") toggleTasPause();
  if (action === "step") stepTasFrame();
  if (action === "fast") changeTasSpeed(-1);
  if (action === "slow") changeTasSpeed(1);
  if (action === "saveState") saveTasState();
  if (action === "loadState") loadTasState();
  if (action === "record") toggleTasRecording();
  if (action === "play") toggleTasPlayback();
  if (action === "edit") editTasInputFrame();
  if (action === "rewind") rewindTasFrame();
  if (action === "frame") toggleTasDisplay("tasShowFrame", "FRAME");
  if (action === "kinematics") toggleTasDisplay("tasShowKinematics", "XY");
  if (action === "hitbox") toggleTasDisplay("tasShowHitboxes", "HITBOX");
  if (action === "rng") toggleTasDisplay("tasShowRng", "RNG");
  if (action === "watch") toggleTasDisplay("tasShowWatch", "WATCH");
  if (action === "export") exportTasFile();
  if (action === "import") importTasFile();
  if (action === "loadSite") loadSelectedTasSiteSave();
  if (action === "deleteSite") deleteSelectedTasSiteSave();
  if (action === "auto") toggleTasAutoReplay();
  if (action === "autoStart") startTasAutoRun();
  if (action === "autoImport") importTasAutoFiles();
  if (action === "autoClear") clearTasAutoInputBank();
}

function toggleDebugTas() {
  debugSettings.tasEnabled = !debugSettings.tasEnabled;
  tasState.paused = debugSettings.tasEnabled;
  tasState.queuedSteps = 0;
  tasState.pauseAtFrame = null;
  resetTasScheduler();
  if (!debugSettings.tasEnabled) {
    tasState.autoEnabled = false;
    tasState.autoCurrentScenarioId = "";
  }
  if (debugSettings.tasEnabled) applyTasBalanceOverrides();
  persistDebugSettings();
  renderDebugTasControls();
  renderPanel();
  updateHud();
  debugMessage(`TAS ${debugSettings.tasEnabled ? "ON" : "OFF"}`);
}

function toggleTasPause() {
  if (!isTasEnabled()) return;
  tasState.paused = !tasState.paused;
  resetTasScheduler();
  renderDebugTasControls();
  debugMessage(`TAS ${tasState.paused ? "PAUSE" : `RUN x${tasSpeedMultiplier()}`}`);
}

function stepTasFrame() {
  if (!isTasEnabled()) return;
  tasState.paused = true;
  tasState.pauseAtFrame = null;
  tasState.queuedSteps += 1;
  renderDebugTasControls();
  debugMessage("TAS STEP 1F");
}

function cycleTasSpeed() {
  if (!isTasEnabled()) return;
  debugSettings.tasSpeedIndex = normalizeTasSpeedIndex(debugSettings.tasSpeedIndex + 1);
  resetTasScheduler();
  persistDebugSettings();
  renderDebugTasControls();
  debugMessage(`TAS SPEED x${tasSpeedMultiplier()}`);
}

function changeTasSpeed(direction) {
  if (!isTasEnabled()) return;
  debugSettings.tasSpeedIndex = normalizeTasSpeedIndex(debugSettings.tasSpeedIndex + direction);
  resetTasScheduler();
  persistDebugSettings();
  renderDebugTasControls();
  debugMessage(`TAS SPEED x${tasSpeedMultiplier()}`);
}

function toggleTasDisplay(key, label) {
  if (!isTasEnabled()) return;
  debugSettings[key] = !debugSettings[key];
  persistDebugSettings();
  renderDebugTasControls();
  debugMessage(`${label} ${debugSettings[key] ? "ON" : "OFF"}`);
}

function applySelectedTasScenario() {
  if (!isTasEnabled()) return;
  const option = tasScenarioOptionById(selectedTasScenarioId());
  if (!option) {
    debugMessage("TAS SCENE NOT FOUND");
    return;
  }
  applyTasScenario(option);
}

function tasScenarioOptionById(id) {
  return tasScenarioOptionsSafe().find((option) => option.id === id) || null;
}

function applyTasScenario(option) {
  tasState.scenarioId = option.id;
  debugSettings.tasScenarioId = option.id;
  persistDebugSettings();
  seedTasRng(option.id);
  tasState.paused = true;
  tasState.queuedSteps = 0;
  tasState.pauseAtFrame = null;
  tasState.frame = 0;
  tasState.rewind = [];
  tasState.recording = false;
  tasState.playing = false;
  tasState.playbackFrame = 0;
  tasState.inputFrames = [];
  tasState.pendingActions = {};
  gameClockMs = 0;
  resetTasScheduler();
  if (isGuideActive()) finishGuide();
  if (option.kind === "boss") setupTasBossScenario(option);
  else setupTasRunScenario(option);
  applyTasBalanceOverrides();
  renderDebugTasControls();
  renderPanel();
  updateHud();
  syncBgm();
  debugMessage(`TAS SCENE ${option.id}`);
}

function seedTasRng(seedText) {
  tasState.rngState = hashTasString(seedText || "tas") || 0x12345678;
  tasState.rngCalls = 0;
  tasState.rngLast = 0;
}

function hashTasString(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function setupTasRunScenario(option) {
  const distance = tasRunScenarioDistance(option.areaIndex);
  prepareTasScenarioRun(option.areaIndex, distance);
  if (option.event) startEvent(option.event);
  const area = areas[option.areaIndex] || currentArea();
  const patterns = areaRunPatterns(option.areaIndex);
  const pattern = patterns[option.patternIndex] || patterns[0];
  const baseX = Math.max(player.x + 230, Math.min(canvasWidth * 0.58, canvasWidth - 240));
  run.lastPatternKey = pattern?.key || "";
  spawnRunPattern(pattern, baseX, area, option.areaIndex);
  if (option.event) spawnEventPattern(option.event, pattern, baseX, area, option.areaIndex);
  run.nextSpawn = 999;
}

function setupTasBossScenario(option) {
  const distance = tasBossScenarioDistance(option.areaIndex);
  prepareTasScenarioRun(option.areaIndex, distance);
  if (option.patternIndex === 1 && researchLevel("sandBreaker") > 0) {
    state.settings.activeSkill = "sandBreaker";
  }
  if (option.patternIndex === 2) {
    if (researchLevel("gravityAnchor") > 0) state.settings.activeSkill = "gravityAnchor";
    else if (researchLevel("sandBreaker") > 0) state.settings.activeSkill = "sandBreaker";
  }
  run.bossBattle = true;
  run.bossAreaIndex = option.areaIndex;
  run.bossPhase = option.phase;
  run.bossPatternIndex = option.patternIndex;
  run.bossVolley = 0;
  run.bossSoulMode = bossSoulModeForArea(option.areaIndex);
  run.bossModeTimer = 0;
  run.bossModePulse = 0.85;
  run.bossResearchCounters = {};
  run.bossResearchRequired = requiredResearchDefsForArea(option.areaIndex).map((def) => def.id);
  run.bossResearchScheduled = {};
  run.bossResearchPassed = {};
  run.bossResearchUsage = {};
  run.lastBossResearchAudit = null;
  run.nextSpawn = 999;
  objects = [];
  const hp = finalBossHitPoints(option.areaIndex);
  const boss = spawnBoss(option.areaIndex, {
    finalBoss: true,
    x: canvasWidth - 170,
    hp
  });
  boss.tasInitialDurability = boss.hp + Number(boss.armor || 0) + Number(boss.shield || 0);
  boss.attackPattern = option.patternIndex;
  boss.attackVolley = 0;
  boss.vulnerable = option.phase === "vulnerable";
  boss.phased = false;
  if (option.phase === "vulnerable") {
    run.bossChargeTimer = finalBossVulnerableDuration(option.areaIndex);
    run.bossAttackTimer = 99;
    boss.x = finalBossApproachStartX(boss);
    boss.y = finalBossVulnerableY(boss);
    boss.vx = finalBossApproachVelocity(boss, option.areaIndex);
  } else {
    run.bossChargeTimer = finalBossAttackDuration(option.areaIndex);
    run.bossAttackTimer = finalBossAttackInterval(option.areaIndex, option.patternIndex);
    boss.x = canvasWidth - 170;
    boss.y = groundY - boss.h;
    spawnBossAttack(boss);
    spawnBossResearchTrialsForPattern(boss, option.areaIndex, option.patternIndex);
  }
}

function prepareTasScenarioRun(areaIndexValue, distance) {
  const areaIndexSafe = Math.max(0, Math.min(areas.length - 1, Number(areaIndexValue) || 0));
  state.areaBossClears = {};
  state.defeatedAreaBosses = {};
  for (let index = 0; index < areaIndexSafe; index += 1) {
    state.areaBossClears[index] = true;
    state.defeatedAreaBosses[index] = true;
  }
  run.tasAreaIndex = areaIndexSafe;
  run.active = true;
  run.gameOver = false;
  run.distance = Math.max(0, Number(distance) || 0);
  run.combo = 0;
  run.dashTimer = 0;
  run.dashCooldown = 0;
  run.activeSkillCooldowns = {};
  run.skillShield = 0;
  run.giantTimer = 0;
  run.timeStop = 0;
  run.gravityGuardTimer = 0;
  run.phasePinTimer = 0;
  run.chillTimer = 0;
  run.nextSpawn = 999;
  run.lastPatternKey = "";
  run.nextBossMark = nextAreaBossDistance(areaIndexSafe);
  run.nextChestMark = Math.floor(run.distance / CHEST_DISTANCE_INTERVAL) * CHEST_DISTANCE_INTERVAL + CHEST_DISTANCE_INTERVAL;
  run.bossBattle = false;
  run.bossAreaIndex = -1;
  run.bossAttackTimer = 0;
  run.bossChargeTimer = 0;
  run.bossRetreating = false;
  run.bossPhase = "attack";
  run.bossPatternIndex = 0;
  run.bossVolley = 0;
  run.bossSoulMode = "red";
  run.bossModeTimer = 0;
  run.bossModePulse = 0;
  run.bossResearchCounters = {};
  run.bossResearchRequired = requiredResearchDefsForArea(areaIndexSafe).map((def) => def.id);
  run.bossResearchScheduled = {};
  run.bossResearchPassed = {};
  run.bossResearchUsage = {};
  run.lastBossResearchAudit = null;
  run.tasDisabledResearchIds = [];
  run.webLane = 1;
  run.justiceCooldown = 0;
  run.echoActive = false;
  run.event = null;
  run.eventTimer = 0;
  run.eventCooldown = 999;
  run.gravityFlip = false;
  run.gravityLandingGuard = false;
  run.stockedItem = null;
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
  player.invulnerable = 0;
  player.regenTimer = 0;
  player.damageTimer = 0;
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.jumpMaxVelocity = 0;
  inputState.jumpAppliedVelocity = 0;
  inputState.slideHolding = false;
  inputState.pointerSlideActive = false;
  inputState.pointerJumpActive = false;
  inputState.tasWantsJump = false;
  inputState.tasJumpRetry = false;
  inputState.blockDirection = "mid";
  state.settings.activeSkill = "none";
  run.hp = getStats().maxHp;
  runOverlay.classList.add("hidden");
  musicScene = "run";
  restartPlayerAnimation("running");
}

function tasRunScenarioDistance(areaIndexValue) {
  const area = areas[areaIndexValue] || areas[0];
  const nextArea = areas[areaIndexValue + 1];
  const safeBeforeBoss = nextArea ? Math.max(area.start + 20, nextArea.start - FINAL_BOSS_OFFSET - 160) : area.start + 400;
  return Math.min(area.start + 140, safeBeforeBoss);
}

function tasBossScenarioDistance(areaIndexValue) {
  const mark = nextAreaBossDistance(areaIndexValue);
  if (Number.isFinite(mark)) return mark;
  return (areas[areaIndexValue]?.start || 0) + 900;
}

function tasScenarioOptions() {
  const options = [];
  for (let areaIndexValue = 0; areaIndexValue < areas.length; areaIndexValue += 1) {
    const areaLabel = tasAreaLabel(areaIndexValue);
    RUN_PATTERN_TEMPLATES.forEach((template, patternIndex) => {
      options.push({
        id: tasRunPatternScenarioId(areaIndexValue, { id: template.id, templateIndex: patternIndex }),
        kind: "run",
        areaIndex: areaIndexValue,
        patternIndex,
        label: `${areaLabel} / RUN / ${template.id}`
      });
    });
    for (const eventDef of RANDOM_EVENT_DEFS) {
      const eventTemplates = RUN_EVENT_PATTERN_TEMPLATES[eventDef.value] || [];
      eventTemplates.forEach((template, patternIndex) => {
        options.push({
          id: tasRunPatternScenarioId(areaIndexValue, { id: template.id, templateIndex: patternIndex }, eventDef.value),
          kind: "event",
          areaIndex: areaIndexValue,
          patternIndex,
          event: eventDef.value,
          label: `${areaLabel} / EVENT ${eventName(eventDef.value)} / ${template.id}`
        });
      });
    }
    for (let patternIndex = 0; patternIndex < FINAL_BOSS_ATTACK_PATTERNS; patternIndex += 1) {
      options.push({
        id: tasBossScenarioId(areaIndexValue, "attack", patternIndex),
        kind: "boss",
        areaIndex: areaIndexValue,
        patternIndex,
        phase: "attack",
        label: `${areaLabel} / BOSS ATTACK / p${patternIndex + 1}`
      });
      options.push({
        id: tasBossScenarioId(areaIndexValue, "vulnerable", patternIndex),
        kind: "boss",
        areaIndex: areaIndexValue,
        patternIndex,
        phase: "vulnerable",
        label: `${areaLabel} / BOSS APPROACH / p${patternIndex + 1}`
      });
    }
  }
  return options;
}

function tasAreaLabel(index) {
  const area = areas[index] || areas[0];
  return `A${index + 1} ${area.line}`;
}

function tasRunPatternScenarioId(index, pattern, event = null) {
  const patternId = pattern?.id || RUN_PATTERN_TEMPLATES[pattern?.templateIndex || 0]?.id || "unknown";
  return event ? `a${index}_event_${event}_${patternId}` : `a${index}_run_${patternId}`;
}

function tasBossScenarioId(index, phase, patternIndex) {
  const phaseId = phase === "vulnerable" ? "approach" : "attack";
  return `a${index}_boss_${phaseId}_p${patternIndex + 1}`;
}

function currentTasScenarioId() {
  return tasState.scenarioId || selectedTasScenarioId() || "manual";
}

function tasSaveFilename(prefix = "irf_tas") {
  const scenarioId = sanitizeTasFilePart(currentTasScenarioId());
  const frame = Math.max(0, Math.floor(tasState.frame || 0));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}_${scenarioId}_f${frame}_${stamp}.json`;
}

function sanitizeTasFilePart(value) {
  return String(value || "manual").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 96) || "manual";
}

function saveTasSnapshotToSite(snapshot, filename = tasSaveFilename()) {
  const entries = loadTasSiteSaves().filter((entry) => entry.filename !== filename);
  const entry = {
    filename,
    scenarioId: currentTasScenarioId(),
    savedAt: new Date().toISOString(),
    frame: tasState.frame,
    snapshot: clonePlain(snapshot)
  };
  entries.unshift(entry);
  persistTasSiteSaves(entries);
  tasState.siteSaveName = filename;
  debugSettings.tasSiteSaveName = filename;
  persistDebugSettings();
  return filename;
}

function loadSelectedTasSiteSave() {
  if (!isTasEnabled()) return;
  const entries = loadTasSiteSaves();
  const filename = debugSettings.tasSiteSaveName || entries[0]?.filename || "";
  const entry = entries.find((item) => item.filename === filename);
  if (!entry) {
    debugMessage("TAS SITE SAVE EMPTY");
    return;
  }
  tasState.saveSlot = clonePlain(entry.snapshot);
  restoreTasSnapshot(entry.snapshot);
  tasState.paused = true;
  tasState.playing = false;
  tasState.recording = false;
  tasState.scenarioId = entry.scenarioId || entry.snapshot.tasScenarioId || "";
  debugSettings.tasScenarioId = tasState.scenarioId || debugSettings.tasScenarioId;
  debugSettings.tasSiteSaveName = entry.filename;
  persistDebugSettings();
  renderDebugTasControls();
  debugMessage(`TAS SITE LOAD ${entry.filename}`);
}

function deleteSelectedTasSiteSave() {
  if (!isTasEnabled()) return;
  const entries = loadTasSiteSaves();
  const filename = debugSettings.tasSiteSaveName || entries[0]?.filename || "";
  if (!filename) return;
  const nextEntries = entries.filter((entry) => entry.filename !== filename);
  persistTasSiteSaves(nextEntries);
  debugSettings.tasSiteSaveName = nextEntries[0]?.filename || "";
  persistDebugSettings();
  renderDebugTasControls();
  debugMessage(`TAS SITE DELETE ${filename}`);
}

function toggleTasAutoReplay() {
  if (!isTasEnabled()) return;
  tasState.autoEnabled = !tasState.autoEnabled;
  tasState.autoCurrentScenarioId = "";
  tasState.autoMissCount = 0;
  tasState.pauseAtFrame = null;
  resetTasScheduler();
  if (tasState.autoEnabled) {
    if (run.gameOver) resetRun();
    tasState.paused = false;
    tasState.playing = false;
    tasState.recording = false;
    tasState.playbackFrame = 0;
    tasState.autoTracks = [];
    tasState.autoStartedAtMs = gameNow();
    tasState.autoStartDistance = run.distance || 0;
  } else {
    tasState.playing = false;
    tasState.playbackFrame = 0;
    tasState.autoTracks = [];
  }
  renderDebugTasControls();
  debugMessage(`TAS AUTO ${tasState.autoEnabled ? "ON" : "OFF"}`);
}

function startTasAutoRun() {
  if (!isTasEnabled()) return;
  seedTasRng("tas-auto-run-v2");
  tasState.frame = 0;
  tasState.rewind = [];
  tasState.queuedSteps = 0;
  tasState.pauseAtFrame = null;
  gameClockMs = 0;
  resetTasScheduler();
  resetRun();
  tasState.autoEnabled = true;
  tasState.autoCurrentScenarioId = "";
  tasState.autoMissCount = 0;
  tasState.playing = false;
  tasState.recording = false;
  tasState.playbackFrame = 0;
  tasState.autoTracks = [];
  tasState.paused = false;
  tasState.autoStartedAtMs = gameNow();
  tasState.autoStartDistance = run.distance || 0;
  renderDebugTasControls();
  updateHud();
  debugMessage("TAS AUTO START");
}

function importTasAutoFiles() {
  if (!isTasEnabled()) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.multiple = true;
  input.addEventListener("change", async () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const bank = loadTasAutoInputBank();
    let imported = 0;
    for (const file of files) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text || "{}");
        const scenarioId = parsed.scenarioId || inferTasScenarioIdFromFileName(file.name);
        const frames = normalizeTasInputFrames(parsed.inputs);
        if (!scenarioId || !frames.length) continue;
        bank[scenarioId] = {
          scenarioId,
          filename: file.name,
          importedAt: new Date().toISOString(),
          frameCount: frames.length,
          inputs: frames.filter(Boolean)
        };
        imported += 1;
      } catch (error) {
        console.warn(error);
      }
    }
    persistTasAutoInputBank(bank);
    tasState.autoLoadedCount = Object.keys(bank).length;
    renderDebugTasControls();
    debugMessage(`TAS AUTO IMPORT ${imported}/${files.length}`);
  });
  input.click();
}

function clearTasAutoInputBank() {
  if (!isTasEnabled()) return;
  localStorage.removeItem(TAS_AUTO_INPUT_BANK_KEY);
  tasState.autoLoadedCount = 0;
  tasState.autoCurrentScenarioId = "";
  tasState.autoMissCount = 0;
  tasState.autoTracks = [];
  renderDebugTasControls();
  debugMessage("TAS AUTO BANK CLEARED");
}

function startTasAutoReplayForScenario(scenarioId) {
  if (!isTasEnabled() || !tasState.autoEnabled || !scenarioId) return false;
  const bank = loadTasAutoInputBank();
  const entry = bank[scenarioId];
  if (!entry || !Array.isArray(entry.inputs) || !entry.inputs.length) {
    tasState.autoMissCount += 1;
    tasState.autoCurrentScenarioId = scenarioId;
    return false;
  }
  const frames = normalizeTasInputFrames(entry.inputs);
  tasState.inputFrames = frames;
  tasState.autoTracks.push({
    scenarioId,
    frames,
    frame: 0,
    startedAtFrame: tasState.frame
  });
  if (tasState.autoTracks.length > 8) tasState.autoTracks.shift();
  tasState.playbackFrame = 0;
  tasState.playing = true;
  tasState.recording = false;
  tasState.paused = false;
  tasState.scenarioId = scenarioId;
  tasState.autoCurrentScenarioId = scenarioId;
  debugSettings.tasScenarioId = scenarioId;
  persistDebugSettings();
  debugMessage(`TAS AUTO PLAY ${scenarioId}`);
  return true;
}

function tasAutoScenarioElapsedSeconds() {
  return tasState.autoEnabled ? Math.max(0, (gameNow() - tasState.autoStartedAtMs) / 1000) : 0;
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function captureTasSnapshot() {
  return {
    version: 1,
    frame: tasState.frame,
    tasScenarioId: currentTasScenarioId(),
    gameClockMs,
    state: clonePlain(state),
    run: clonePlain(run),
    player: clonePlain(player),
    objects: clonePlain(objects),
    particles: clonePlain(particles),
    inputState: clonePlain(inputState),
    activeTab,
    factoryView,
    equipmentView,
    musicScene,
    autosaveTimer,
    uiTimer,
    messageTimer,
    rngState: tasState.rngState,
    rngCalls: tasState.rngCalls,
    rngLast: tasState.rngLast
  };
}

function restoreTasSnapshot(snapshot) {
  if (!snapshot) return false;
  state = clonePlain(snapshot.state);
  Object.assign(run, clonePlain(snapshot.run));
  Object.assign(player, clonePlain(snapshot.player));
  Object.assign(inputState, clonePlain(snapshot.inputState));
  objects = clonePlain(snapshot.objects || []);
  particles = clonePlain(snapshot.particles || []);
  activeTab = snapshot.activeTab || activeTab;
  factoryView = snapshot.factoryView || factoryView;
  equipmentView = snapshot.equipmentView || equipmentView;
  musicScene = snapshot.musicScene || musicScene;
  autosaveTimer = Number(snapshot.autosaveTimer || 0);
  uiTimer = Number(snapshot.uiTimer || 0);
  messageTimer = Number(snapshot.messageTimer || 0);
  gameClockMs = Number(snapshot.gameClockMs || gameClockMs);
  tasState.frame = Number(snapshot.frame || 0);
  tasState.rngState = Number(snapshot.rngState || tasState.rngState) >>> 0;
  tasState.rngCalls = Number(snapshot.rngCalls || 0);
  tasState.rngLast = Number(snapshot.rngLast || 0);
  tasState.scenarioId = snapshot.tasScenarioId || tasState.scenarioId || "";
  tasState.pauseAtFrame = null;
  resetTasScheduler();
  runOverlay.classList.toggle("hidden", !run.gameOver);
  renderPanel();
  updateHud();
  syncBgm();
  return true;
}

function saveTasState() {
  if (!isTasEnabled()) return;
  const snapshot = captureTasSnapshot();
  tasState.saveSlot = snapshot;
  const filename = saveTasSnapshotToSite(snapshot);
  renderDebugTasControls();
  debugMessage(`TAS SAVE ${filename}`);
}

function loadTasState() {
  if (!isTasEnabled()) return;
  if (!tasState.saveSlot) {
    debugMessage("TAS SAVE STATE EMPTY");
    return;
  }
  restoreTasSnapshot(tasState.saveSlot);
  tasState.paused = true;
  tasState.playing = false;
  renderDebugTasControls();
  debugMessage(`TAS LOAD F${tasState.frame}`);
}

function captureTasRewindSnapshot() {
  if (!isTasEnabled()) return;
  tasState.rewind.push(captureTasSnapshot());
  if (tasState.rewind.length > 600) tasState.rewind.shift();
}

function rewindTasFrame() {
  if (!isTasEnabled()) return;
  const snapshot = tasState.rewind.pop();
  if (!snapshot) {
    debugMessage("TAS REWIND EMPTY");
    return;
  }
  restoreTasSnapshot(snapshot);
  tasState.paused = true;
  tasState.playing = false;
  renderDebugTasControls();
  debugMessage(`TAS REWIND F${tasState.frame}`);
}

function currentTasInputFrame() {
  const frame = Math.max(0, tasState.frame - tasState.recordingStartFrame);
  return {
    frame,
    jump: Boolean(inputState.jumpHolding),
    slide: Boolean(inputState.slideHolding),
    block: inputState.blockDirection || "mid",
    skill: Boolean(tasState.pendingActions.skill),
    cycle: Boolean(tasState.pendingActions.cycle)
  };
}

function recordTasInputFrame() {
  if (!isTasEnabled() || !tasState.recording || tasState.playing) return;
  const inputFrame = currentTasInputFrame();
  tasState.inputFrames[inputFrame.frame] = inputFrame;
  tasState.pendingActions = {};
}

function markTasAction(action) {
  if (!isTasEnabled() || !tasState.recording || tasState.playing) return;
  if (action === "item") return;
  tasState.pendingActions[action] = true;
}

function toggleTasRecording() {
  if (!isTasEnabled()) return;
  tasState.recording = !tasState.recording;
  if (tasState.recording) {
    tasState.playing = false;
    tasState.recordingStartFrame = tasState.frame;
    tasState.playbackFrame = 0;
    tasState.inputFrames = [];
  }
  renderDebugTasControls();
  debugMessage(`TAS REC ${tasState.recording ? "ON" : "OFF"}`);
}

function toggleTasPlayback() {
  if (!isTasEnabled()) return;
  tasState.playing = !tasState.playing;
  if (tasState.playing) {
    tasState.recording = false;
    tasState.playbackFrame = 0;
    tasState.paused = false;
  }
  renderDebugTasControls();
  debugMessage(`TAS PLAY ${tasState.playing ? "ON" : "OFF"}`);
}

function applyTasPlaybackFrame() {
  if (isTasEnabled() && tasState.autoEnabled) {
    applyTasAutoTracksFrame();
    return;
  }
  if (!isTasEnabled() || !tasState.playing) return;
  const frame = tasState.inputFrames[tasState.playbackFrame];
  if (!frame) {
    tasState.playing = false;
    tasState.paused = !tasState.autoEnabled;
    renderDebugTasControls();
    debugMessage(tasState.autoEnabled ? `TAS AUTO WAIT ${tasState.autoCurrentScenarioId || ""}` : "TAS PLAY END");
    return;
  }
  applyTasInputFrame(frame);
  tasState.playbackFrame += 1;
}

function applyTasAutoTracksFrame() {
  if (!isTasEnabled() || !tasState.autoEnabled) return;
  const combined = {
    jump: false,
    slide: false,
    block: "mid",
    skill: false,
    cycle: false
  };
  const activeTracks = [];
  const gravityEventTrackActive = run.event === "gravity"
    && tasState.autoTracks.some((track) => String(track.scenarioId || "").includes("_event_gravity_"));
  const newestGravityTrackFrame = gravityEventTrackActive
    ? Math.max(...tasState.autoTracks
      .filter((track) => String(track.scenarioId || "").includes("_event_gravity_"))
      .map((track) => Number(track.startedAtFrame || 0)))
    : -Infinity;
  for (const track of tasState.autoTracks) {
    const frame = track.frames[track.frame];
    if (!frame) continue;
    const scenarioId = String(track.scenarioId || "");
    const isGravityTrack = scenarioId.includes("_event_gravity_");
    const suppressInput = gravityEventTrackActive
      && (!isGravityTrack || Number(track.startedAtFrame || 0) < newestGravityTrackFrame);
    if (!suppressInput) {
      combined.jump = combined.jump || Boolean(frame.jump);
      combined.slide = combined.slide || Boolean(frame.slide);
      combined.skill = combined.skill || Boolean(frame.skill);
      combined.cycle = combined.cycle || Boolean(frame.cycle);
      if (frame.block === "low") combined.block = "low";
      else if (frame.block === "high" && combined.block === "mid") combined.block = "high";
    }
    track.frame += 1;
    activeTracks.push(track);
  }
  tasState.autoTracks = activeTracks;
  tasState.playing = activeTracks.length > 0;
  if (!activeTracks.length) {
    tasState.playbackFrame = 0;
    if (inputState.jumpHolding) releaseJumpHold();
    if (inputState.slideHolding) cancelSlideHold();
    inputState.tasWantsJump = false;
    inputState.tasJumpRetry = false;
    inputState.blockDirection = "mid";
    return;
  }
  tasState.playbackFrame = Math.max(...activeTracks.map((track) => track.frame));
  applyTasInputFrame(combined);
}

function applyTasInputFrame(frame) {
  if (run.gameOver) return;
  const wantsJump = Boolean(frame.jump);
  const wantsSlide = Boolean(frame.slide) && !wantsJump;
  inputState.tasWantsJump = wantsJump;
  const purpleLaneMode = run.bossBattle && run.bossPhase === "attack" && activeBossSoulMode() === "purple";
  if (purpleLaneMode) {
    if (wantsJump && !inputState.tasPurpleJumpHeld) shiftWebLane(-1);
    if (wantsSlide && !inputState.tasPurpleSlideHeld) shiftWebLane(1);
    inputState.tasPurpleJumpHeld = wantsJump;
    inputState.tasPurpleSlideHeld = wantsSlide;
    inputState.blockDirection = frame.block || "mid";
    if (frame.cycle) cycleActiveSkill();
    if (frame.skill) activateActiveSkill();
    return;
  }
  inputState.tasPurpleJumpHeld = false;
  inputState.tasPurpleSlideHeld = false;
  if (wantsSlide && !inputState.slideHolding) startSlideHold();
  if (!wantsSlide && inputState.slideHolding) cancelSlideHold();
  if (wantsJump && !inputState.jumpHolding) {
    inputState.tasJumpRetry = !startJumpHold(gameNow());
  } else {
    inputState.tasJumpRetry = false;
  }
  if (!wantsJump && inputState.jumpHolding) releaseJumpHold();
  if (!wantsJump) inputState.tasJumpRetry = false;
  inputState.blockDirection = frame.block || "mid";
  if (frame.cycle) cycleActiveSkill();
  if (frame.skill) activateActiveSkill();
}

function editTasInputFrame() {
  if (!isTasEnabled()) return;
  const frameNumber = Number(window.prompt("Edit TAS frame number", String(tasState.frame)));
  if (!Number.isFinite(frameNumber) || frameNumber < 0) return;
  const current = tasState.inputFrames[frameNumber] || {
    frame: frameNumber,
    jump: false,
    slide: false,
    block: "mid",
    skill: false,
    cycle: false
  };
  const edited = window.prompt("Edit TAS input JSON", JSON.stringify(current));
  if (!edited) return;
  try {
    const parsed = JSON.parse(edited);
    tasState.inputFrames[frameNumber] = {
      frame: frameNumber,
      jump: Boolean(parsed.jump),
      slide: Boolean(parsed.slide),
      block: ["high", "mid", "low"].includes(parsed.block) ? parsed.block : "mid",
      skill: Boolean(parsed.skill),
      cycle: Boolean(parsed.cycle)
    };
    renderDebugTasControls();
    debugMessage(`TAS EDIT F${frameNumber}`);
  } catch (error) {
    console.warn(error);
    debugMessage("TAS EDIT JSON ERROR");
  }
}

function exportTasFile() {
  if (!isTasEnabled()) return;
  const filename = tasSaveFilename("irf_tas_input");
  const payload = {
    format: "irf-tas-v1",
    filename,
    scenarioId: currentTasScenarioId(),
    exportedAt: new Date().toISOString(),
    frame: tasState.frame,
    inputs: tasState.inputFrames.filter(Boolean).map((frame, index) => ({
      frame: Number.isFinite(Number(frame.frame)) ? Number(frame.frame) : index,
      jump: Boolean(frame.jump),
      slide: Boolean(frame.slide),
      block: ["high", "mid", "low"].includes(frame.block) ? frame.block : "mid",
      skill: Boolean(frame.skill),
      cycle: Boolean(frame.cycle)
    })),
    rngState: tasState.rngState,
    rngCalls: tasState.rngCalls
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
  debugMessage(`TAS FILE EXPORTED ${filename}`);
}

function importTasFile() {
  if (!isTasEnabled()) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const frames = Array.isArray(parsed.inputs) ? parsed.inputs : [];
        tasState.inputFrames = normalizeTasInputFrames(frames);
        if (Number.isFinite(parsed.rngState)) tasState.rngState = Number(parsed.rngState) >>> 0;
        if (Number.isFinite(parsed.rngCalls)) tasState.rngCalls = Number(parsed.rngCalls);
        if (typeof parsed.scenarioId === "string") {
          tasState.scenarioId = parsed.scenarioId;
          debugSettings.tasScenarioId = parsed.scenarioId;
          persistDebugSettings();
        }
        renderDebugTasControls();
        debugMessage(`TAS FILE IMPORTED ${frames.length}F`);
      } catch (error) {
        console.warn(error);
        debugMessage("TAS FILE IMPORT ERROR");
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

function handleDebugTasShortcut(event) {
  if (!DEBUG_MODE) return false;
  const altActions = {
    KeyF: () => toggleTasDisplay("tasShowFrame", "FRAME"),
    KeyC: () => toggleTasDisplay("tasShowKinematics", "XY"),
    KeyR: () => toggleTasDisplay("tasShowRng", "RNG"),
    KeyV: () => toggleTasDisplay("tasShowWatch", "WATCH"),
    KeyS: exportTasFile,
    KeyO: importTasFile
  };
  const plainActions = {
    F1: toggleDebugTas,
    F2: toggleTasPause,
    F3: stepTasFrame,
    F4: () => toggleTasDisplay("tasShowHitboxes", "HITBOX"),
    F5: saveTasState,
    F6: editTasInputFrame,
    F7: rewindTasFrame,
    F8: loadTasState,
    F9: toggleTasRecording,
    F10: toggleTasPlayback,
    F11: () => changeTasSpeed(-1),
    F12: () => changeTasSpeed(1)
  };
  const action = event.altKey ? altActions[event.code] : plainActions[event.code];
  if (!action) return false;
  event.preventDefault();
  event.stopPropagation();
  action();
  return true;
}

function isTasEnabled() {
  return DEBUG_MODE && Boolean(debugSettings.tasEnabled);
}

function isGameplayKeyCode(code) {
  return GAMEPLAY_KEY_CODES.has(code);
}

function isTasAllowedGameplayKeyCode(code) {
  return !isTasEnabled() || TAS_ALLOWED_GAMEPLAY_KEY_CODES.has(code);
}

function tasSpeedMultiplier() {
  return TAS_SPEEDS[normalizeTasSpeedIndex(debugSettings.tasSpeedIndex)] || 1;
}

function resetTasScheduler() {
  tasStepAccumulator = 0;
  lastFrame = performance.now();
}

function normalizeTasSpeedIndex(value) {
  const index = Number(value);
  if (!Number.isFinite(index)) return TAS_DEFAULT_SPEED_INDEX;
  return Math.max(0, Math.min(TAS_SPEEDS.length - 1, Math.floor(index)));
}

function loadDebugSettings() {
  const defaults = {
    skipGuides: false,
    tasEnabled: false,
    tasSpeedIndex: TAS_DEFAULT_SPEED_INDEX,
    tasScenarioId: TAS_DEFAULT_SCENARIO_ID,
    tasSiteSaveName: "",
    tasShowFrame: true,
    tasShowKinematics: true,
    tasShowHitboxes: false,
    tasShowRng: true,
    tasShowWatch: true
  };
  if (!DEBUG_MODE) return defaults;
  try {
    const parsed = JSON.parse(localStorage.getItem(DEBUG_SETTINGS_KEY) || "{}");
    return {
      ...defaults,
      skipGuides: Boolean(parsed.skipGuides),
      tasEnabled: Boolean(parsed.tasEnabled),
      tasSpeedIndex: normalizeTasSpeedIndex(parsed.tasSpeedIndex),
      tasScenarioId: typeof parsed.tasScenarioId === "string" ? parsed.tasScenarioId : defaults.tasScenarioId,
      tasSiteSaveName: typeof parsed.tasSiteSaveName === "string" ? parsed.tasSiteSaveName : defaults.tasSiteSaveName,
      tasShowFrame: parsed.tasShowFrame !== undefined ? Boolean(parsed.tasShowFrame) : defaults.tasShowFrame,
      tasShowKinematics: parsed.tasShowKinematics !== undefined ? Boolean(parsed.tasShowKinematics) : defaults.tasShowKinematics,
      tasShowHitboxes: Boolean(parsed.tasShowHitboxes),
      tasShowRng: parsed.tasShowRng !== undefined ? Boolean(parsed.tasShowRng) : defaults.tasShowRng,
      tasShowWatch: parsed.tasShowWatch !== undefined ? Boolean(parsed.tasShowWatch) : defaults.tasShowWatch
    };
  } catch (error) {
    console.warn(error);
    return defaults;
  }
}

function persistDebugSettings() {
  if (!DEBUG_MODE) return;
  localStorage.setItem(DEBUG_SETTINGS_KEY, JSON.stringify(debugSettings));
}

function shouldSkipGuides() {
  return DEBUG_MODE && Boolean(debugSettings.skipGuides);
}

function toggleDebugSkipGuides() {
  if (!DEBUG_MODE) return;
  debugSettings.skipGuides = !debugSettings.skipGuides;
  persistDebugSettings();
  updateDebugSkipGuidesButton();
  debugMessage(`説明スキップ ${debugSettings.skipGuides ? "ON" : "OFF"}`);
  if (debugSettings.skipGuides && isGuideActive()) {
    finishGuide();
  }
}

function updateDebugSkipGuidesButton() {
  if (!debugSkipGuides) return;
  debugSkipGuides.textContent = `説明スキップ ${debugSettings.skipGuides ? "ON" : "OFF"}`;
  debugSkipGuides.setAttribute("aria-pressed", String(Boolean(debugSettings.skipGuides)));
}

function debugMessage(message) {
  if (debugStatus) debugStatus.textContent = message;
}

function configureDebugHudInputs() {
  if (!DEBUG_MODE) return;
  for (const id of Object.keys(debugHudFields)) {
    const element = document.getElementById(id);
    if (element) configureDebugHudElement(element, id);
  }
}

function configureDebugHudElement(element, id) {
  element.dataset.debugField = debugHudFields[id];
  element.contentEditable = "true";
  element.spellcheck = false;
  element.inputMode = "decimal";
  element.classList.add("debug-editable");
  if (element.dataset.debugBound) return;
  element.dataset.debugBound = "true";
  element.addEventListener("focus", () => {
    element.dataset.debugLastValue = element.textContent || "";
  });
  element.addEventListener("input", () => applyDebugHudInput(element));
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      element.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      element.textContent = element.dataset.debugLastValue || element.textContent || "";
      element.blur();
    }
  });
  element.addEventListener("blur", () => applyDebugHudEdit(element));
}

function setDebugHudText(id, text) {
  const element = document.getElementById(id);
  if (!element) return;
  if (DEBUG_MODE) configureDebugHudElement(element, id);
  if (DEBUG_MODE && document.activeElement === element) return;
  element.textContent = text;
}

function applyDebugHudEdit(element) {
  if (!DEBUG_MODE) return;
  const field = element.dataset.debugField;
  const value = parseDebugNumber(element.textContent);
  if (!field || !Number.isFinite(value)) {
    updateHud();
    return;
  }
  applyDebugHudValue(field, value);
  finishDebugEdit(`HUD ${field}`);
}

function applyDebugHudInput(element) {
  if (!DEBUG_MODE) return;
  const field = element.dataset.debugField;
  const value = parseDebugNumber(element.textContent);
  if (!field || !Number.isFinite(value)) return;
  applyDebugHudValue(field, value);
  persistStateQuiet();
  debugMessage(`DEBUG editing: ${field}`);
}

function applyDebugHudValue(field, value) {
  if (field === "coins") state.coins = Math.max(0, value);
  if (field === "gems") state.gems = Math.max(0, value);
  if (field === "research") state.research = Math.max(0, value);
  if (field === "prestigePoints") state.prestigePoints = Math.max(0, Math.floor(value));
  if (field === "distance") setDebugDistance(value);
  if (field === "bestDistance") state.bestDistance = Math.max(0, value);
  if (field === "hp") run.hp = Math.max(0, Math.floor(value));
  if (field === "combo") run.combo = Math.max(0, (value - 1) / 0.012);
  if (field === "level") state.level = Math.max(1, Math.floor(value));
}

function setDebugDistance(value) {
  const distance = Math.max(0, value);
  run.distance = distance;
  state.currentPrestigeDistance = distance;
  state.bestDistance = Math.max(state.bestDistance || 0, distance);
  run.nextBossMark = nextAreaBossDistance(areaIndexForDistance(distance));
  run.nextChestMark = Math.floor(distance / CHEST_DISTANCE_INTERVAL) * CHEST_DISTANCE_INTERVAL + CHEST_DISTANCE_INTERVAL;
  normalizeAreaBossClears(state);
  normalizeDefeatedAreaBosses(state);
  maybeExplainAreaTrait(areaIndexForDistance(distance));
}

function parseDebugNumber(rawValue) {
  let value = String(rawValue || "").trim().replace(/,/g, "");
  if (!value) return NaN;
  value = value.split("/")[0].trim();
  value = value.replace(/^x/i, "").replace(/m$/i, "").trim();
  const suffix = value.match(/^(-?\d+(?:\.\d+)?)([kmbt])$/i);
  if (suffix) {
    const scale = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[suffix[2].toLowerCase()];
    return Number(suffix[1]) * scale;
  }
  return Number(value);
}

function handleDebugPanelInput(event) {
  if (!DEBUG_MODE) return;
  const input = event.target.closest?.(".debug-inline-input");
  if (!input) return;
  handleDebugInlineInput(input);
}

function handleDebugInlineInput(input) {
  if (!DEBUG_MODE || !input) return;
  const value = parseDebugNumber(input.value);
  if (!Number.isFinite(value)) {
    renderPanel();
    return;
  }
  applyDebugPanelValue(input, value);
}

function handleDebugInlineTyping(input) {
  if (!DEBUG_MODE || !input) return;
  const value = parseDebugNumber(input.value);
  if (!Number.isFinite(value)) return;
  applyDebugPanelValue(input, value, { render: false });
}

function handleDebugInlineKey(event, input) {
  if (!DEBUG_MODE || !event || !input) return;
  if (event.key !== "Enter") return;
  event.preventDefault();
  handleDebugInlineInput(input);
  input.blur();
}

function applyDebugPanelValue(input, value, options = {}) {
  const group = input.dataset.debugGroup;
  const id = input.dataset.debugId;
  if (!group || !id) return;
  if (group === "upgrades") setDebugLevelValue(state.upgrades, id, value);
  if (group === "factories") setDebugLevelValue(state.factories, id, value);
  if (group === "permanent") setDebugLevelValue(state.permanent, id, value);
  if (group === "researchTree") {
    setDebugLevelValue(state.researchTree, id, value);
    normalizeDefeatedAreaBosses(state);
    normalizeActiveSkill(state);
  }
  if (group === "chests") {
    const chest = state.chests.find((entry) => entry.id === id);
    if (chest) chest.remaining = Math.max(0, value);
  }
  if (group === "equipmentValue") {
    const item = state.equipment.find((entry) => entry.id === id);
    const scale = Number(input.dataset.debugScale || 1);
    if (item) item.value = Math.max(0, value / Math.max(1, scale));
  }
  if (group === "dailyMission" || group === "weeklyMission") {
    ensureMissions();
    const bucket = group === "dailyMission" ? "daily" : "weekly";
    const mission = state.missions?.[bucket]?.[id];
    if (mission) mission.progress = Math.max(0, value);
  }
  if (group === "achievement") {
    state.achievements[id] = state.achievements[id] || { unlocked: false, claimed: false };
    state.achievements[id].unlocked = value > 0;
    if (!state.achievements[id].unlocked) state.achievements[id].claimed = false;
  }
  if (group === "scalar") {
    setDebugScalarValue(id, value);
  }
  if (options.render === false) {
    persistStateQuiet();
    debugMessage(`DEBUG editing: ${group}:${id}`);
    return;
  }
  finishDebugEdit(`${group}:${id}`);
}

function setDebugLevelValue(group, id, value) {
  group[id] = Math.max(0, Math.floor(value));
}

function setDebugScalarValue(id, value) {
  if (id === "prestigeCount") {
    state.prestigeCount = Math.max(0, Math.floor(value));
  }
}

function finishDebugEdit(label) {
  renderPanel();
  updateHud();
  persistStateQuiet();
  debugMessage(`DEBUG updated: ${label}`);
}

if (typeof window !== "undefined") {
  window.handleDebugInlineInput = handleDebugInlineInput;
  window.handleDebugInlineTyping = handleDebugInlineTyping;
  window.handleDebugInlineKey = handleDebugInlineKey;
}

function guideValue(value) {
  if (!value || typeof value !== "object") return value || "";
  return value[currentLanguage] || value.ja || "";
}

function isGuideActive() {
  return Boolean(guideState.active);
}

function isGameplayPaused() {
  return languageSelectionActive || isGuideActive() || isAssetSceneActive();
}

function maybeStartIntroGuide(options = {}) {
  normalizeTutorialState(state);
  if (languageSelectionActive || guideState.active || state.tutorial.introComplete) return;
  if (!options.force && state.tutorial.introComplete) return;
  queueGuide(introGuideSteps, {
    onComplete: () => {
      state.tutorial.introComplete = true;
      persistStateQuiet();
      maybeExplainAreaTrait(areaIndex());
    }
  });
}

function queueGuide(steps, options = {}) {
  const normalizedSteps = (Array.isArray(steps) ? steps : [steps]).filter(Boolean);
  if (normalizedSteps.length === 0 || !guideOverlay) return;
  const entry = { steps: normalizedSteps, onComplete: options.onComplete || null };
  if (shouldSkipGuides()) {
    skipGuideEntry(entry);
    return;
  }
  if (guideState.active) {
    guideState.queue.push(entry);
    return;
  }
  beginGuide(entry);
}

function beginGuide(entry) {
  if (shouldSkipGuides()) {
    skipGuideEntry(entry);
    return;
  }
  guideState.active = true;
  guideState.steps = entry.steps;
  guideState.index = 0;
  guideState.onComplete = entry.onComplete;
  showGuideStep();
}

function skipGuideEntry(entry) {
  if (entry?.onComplete) entry.onComplete();
  const next = guideState.queue.shift();
  if (next) beginGuide(next);
}

function showGuideStep() {
  const step = guideState.steps[guideState.index];
  if (!step) {
    finishGuide();
    return;
  }
  guideTitle.textContent = guideValue(step.title);
  guideText.textContent = guideValue(step.text);
  guideStep.textContent = `${guideState.index + 1}/${guideState.steps.length}`;
  const keyHint = "Space / ↑";
  guideNext.textContent = currentLanguage === "en"
    ? guideState.index >= guideState.steps.length - 1 ? `Close (${keyHint})` : `Next (${keyHint})`
    : guideState.index >= guideState.steps.length - 1 ? `閉じる (${keyHint})` : `次へ (${keyHint})`;
  guideOverlay.classList.remove("hidden");
  guideState.currentTarget = step.target;
  updateGuideHighlight(step.target);
}

function advanceGuide() {
  if (!guideState.active) return;
  guideState.index += 1;
  if (guideState.index >= guideState.steps.length) {
    finishGuide();
  } else {
    showGuideStep();
  }
}

function finishGuide() {
  const onComplete = guideState.onComplete;
  clearGuideHighlight();
  guideOverlay?.classList.add("hidden");
  guideState.active = false;
  guideState.steps = [];
  guideState.index = 0;
  guideState.onComplete = null;
  guideState.currentTarget = null;
  if (onComplete) onComplete();
  const next = guideState.queue.shift();
  if (next) beginGuide(next);
}

function clearGuideHighlight() {
  guideState.targetElement?.classList?.remove("guide-target");
  guideState.targetElement = null;
  guideSpotlight?.classList.add("hidden");
}

function updateGuideHighlight(target) {
  clearGuideHighlight();
  const rect = guideTargetRect(target);
  if (!rect || !guideSpotlight) {
    guideCard?.classList.remove("guide-card-top");
    return;
  }
  if (rect.width <= 0 || rect.height <= 0) {
    guideCard?.classList.remove("guide-card-top");
    return;
  }
  const pad = 8;
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (element?.classList) {
    guideState.targetElement = element;
    element.classList.add("guide-target");
  }
  guideSpotlight.style.left = `${Math.max(8, rect.left - pad)}px`;
  guideSpotlight.style.top = `${Math.max(8, rect.top - pad)}px`;
  guideSpotlight.style.width = `${Math.min(window.innerWidth - 16, rect.width + pad * 2)}px`;
  guideSpotlight.style.height = `${Math.min(window.innerHeight - 16, rect.height + pad * 2)}px`;
  guideSpotlight.classList.remove("hidden");
  guideCard?.classList.toggle("guide-card-top", rect.top > window.innerHeight * 0.52);
}

function guideTargetRect(target) {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector(target)?.getBoundingClientRect() || null;
  if (target.canvasObject) return canvasObjectScreenRect(target.canvasObject);
  if (typeof target.getBoundingClientRect === "function") return target.getBoundingClientRect();
  if (Number.isFinite(target.left) && Number.isFinite(target.top)) return target;
  return null;
}

function canvasObjectScreenRect(obj) {
  if (!obj) return null;
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / Math.max(1, canvasWidth);
  const scaleY = canvasRect.height / Math.max(1, canvasHeight);
  return {
    left: canvasRect.left + obj.x * scaleX,
    top: canvasRect.top + obj.y * scaleY,
    width: Math.max(18, obj.w * scaleX),
    height: Math.max(18, obj.h * scaleY)
  };
}

function markTutorialSeen(group, id) {
  normalizeTutorialState(state);
  state.tutorial[group][id] = true;
  persistStateQuiet();
}

function tagLatestHazardForGuide(kind) {
  const obj = objects[objects.length - 1];
  tagHazardForGuide(obj, kind);
}

function tagHazardForGuide(obj, kind) {
  if (!obj || obj.finalBoss || !hazardGuideDefs[kind] || state.tutorial?.seenHazards?.[kind]) return;
  obj.guideKind = kind;
  obj.guidePending = true;
}

function tagLatestItemForGuide(kind) {
  const obj = objects[objects.length - 1];
  tagItemForGuide(obj, kind);
}

function tagItemForGuide(obj, kind) {
  if (!obj || obj.type !== "item" || !itemGuideDefs[kind] || state.tutorial?.seenItems?.[kind]) return;
  obj.itemGuideKind = kind;
  obj.itemGuidePending = true;
}

function checkHazardGuideTrigger(obj) {
  if (!obj?.guidePending || state.tutorial?.seenHazards?.[obj.guideKind]) return;
  const centerX = obj.x + obj.w / 2;
  if (centerX <= canvasWidth * 0.52 && centerX >= 0) {
    maybeExplainHazard(obj.guideKind, obj);
    obj.guidePending = false;
  }
}

function checkItemGuideTrigger(obj) {
  if (!obj?.itemGuidePending || state.tutorial?.seenItems?.[obj.itemGuideKind]) return;
  const centerX = obj.x + obj.w / 2;
  if (centerX <= canvasWidth * 0.52 && centerX >= 0) {
    maybeExplainItem(obj.itemGuideKind, obj);
    obj.itemGuidePending = false;
  }
}

function checkResearchTrialGuideTrigger(obj) {
  if (!obj?.researchTrialGuidePending || state.tutorial?.seenResearchTrials?.[obj.researchTrialId]) return;
  const centerX = obj.x + obj.w / 2;
  if (centerX <= canvasWidth * 0.58 && centerX >= 0) {
    maybeExplainResearchTrial(obj.researchTrialId, obj);
    obj.researchTrialGuidePending = false;
  }
}

function maybeExplainResearchTrial(id, obj) {
  const def = researchDefs.find((entry) => entry.id === id);
  if (!def || state.tutorial?.seenResearchTrials?.[id]) return;
  markTutorialSeen("seenResearchTrials", id);
  const active = Boolean(def.active);
  queueGuide([{
    title: {
      ja: `研究防壁: ${def.name}`,
      en: `Research Gate: ${translateText(def.name)}`
    },
    text: active ? {
      ja: "この防壁は表示されたアクティブ研究でのみ破壊できます。Qでスキルを切り替え、防壁が近づいた時にDで発動してください。無敵やアイテムでは通過できません。",
      en: "Only the displayed active research can break this gate. Cycle skills with Q, then press D when the gate is close. Invincibility and items cannot bypass it."
    } : {
      ja: "この防壁は表示されたパッシブ研究の習得状況を検査します。研究Lvが1以上なら接触時に自動で無効化され、未研究では必ずダメージを受けます。",
      en: "This gate checks the displayed passive research. At Lv1 or higher it is neutralized automatically on contact; without it, the gate always deals damage."
    },
    target: { canvasObject: obj }
  }]);
}

function maybeExplainHazard(kind, obj = null) {
  const def = hazardGuideDefs[kind];
  if (!def || state.tutorial?.seenHazards?.[kind]) return;
  markTutorialSeen("seenHazards", kind);
  queueGuide([{ ...def, target: obj ? { canvasObject: obj } : ".canvas-frame" }]);
}

function maybeExplainItem(kind, obj = null) {
  const def = itemGuideDefs[kind];
  if (!def || state.tutorial?.seenItems?.[kind]) return;
  markTutorialSeen("seenItems", kind);
  queueGuide([{ ...def, target: obj ? { canvasObject: obj } : ".canvas-frame" }]);
}

function maybeExplainBoss(index) {
  const id = String(index);
  if (state.tutorial?.seenBosses?.[id]) return;
  markTutorialSeen("seenBosses", id);
  const def = bossGuideDefs[index] || {
    title: { ja: `最終ボス: ${bossName(index)}`, en: `Final Boss: ${bossName(index)}` },
    text: { ja: "このエリアの最深部を守る特異な存在です。周囲の環境を取り込んだ専用ギミックでランを乱します。", en: "A strange guardian of this area. It disrupts the run with a gimmick shaped by its environment." }
  };
  queueGuide([{ ...def, target: ".canvas-frame" }]);
}

function maybeExplainAreaTrait(index) {
  const trait = areaEnemyTraits[index]?.id;
  const def = traitGuideDefs[trait];
  if (!def || state.tutorial?.seenTraits?.[trait]) return;
  markTutorialSeen("seenTraits", trait);
  queueGuide([{ ...def, target: ".canvas-frame" }]);
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
    areaBossClears: {},
    defeatedAreaBosses: {},
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
      bgmEnabled: !DEBUG_MODE,
      activeSkill: "none"
    },
    stats: {
      jumps: 0,
      chestsOpened: 0,
      adsWatched: 0
    },
    tutorial: {
      introComplete: false,
      seenHazards: {},
      seenItems: {},
      seenBosses: {},
      seenTraits: {},
      seenResearchTrials: {}
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
    migrateSaveData(parsed);
    const merged = mergeDefaults(parsed, defaultState());
    if (parsed.currentPrestigeDistance === undefined) {
      merged.currentPrestigeDistance = merged.bestDistance || 0;
    }
    normalizeResearchTree(merged);
    normalizeAreaBossClears(merged);
    normalizeDefeatedAreaBosses(merged);
    normalizeUpgradeTree(merged);
    normalizeActiveSkill(merged);
    normalizeTutorialState(merged);
    enforceLevelCaps(merged);
    return merged;
  } catch (error) {
    console.warn(error);
    return defaultState();
  }
}

function migrateSaveData(saved) {
  const version = Math.max(1, Number(saved?.version || 1));
  if (version < 2) {
    if (Number.isFinite(Number(saved.bestDistance))) {
      saved.bestDistance = migrateLegacyProgressDistance(Number(saved.bestDistance));
    }
    if (Number.isFinite(Number(saved.currentPrestigeDistance))) {
      saved.currentPrestigeDistance = migrateLegacyProgressDistance(Number(saved.currentPrestigeDistance));
    }
  }
  saved.version = SAVE_VERSION;
}

function migrateLegacyProgressDistance(distance) {
  const safeDistance = Math.max(0, Number(distance || 0));
  let index = 0;
  for (let i = 0; i < LEGACY_AREA_STARTS.length; i += 1) {
    if (safeDistance >= LEGACY_AREA_STARTS[i]) index = i;
  }
  const area = areas[index] || areas[areas.length - 1];
  const legacyStart = LEGACY_AREA_STARTS[index] || 0;
  const legacyNext = LEGACY_AREA_STARTS[index + 1];
  if (!Number.isFinite(legacyNext)) {
    return area.start + Math.min(area.runDistance, Math.max(0, safeDistance - legacyStart));
  }
  const legacyBossDistance = legacyNext - FINAL_BOSS_OFFSET;
  if (safeDistance <= legacyBossDistance) {
    const progress = Math.max(0, Math.min(1, (safeDistance - legacyStart) / Math.max(1, legacyBossDistance - legacyStart)));
    return area.start + area.runDistance * progress;
  }
  const postBossProgress = Math.max(0, Math.min(1, (safeDistance - legacyBossDistance) / FINAL_BOSS_OFFSET));
  return area.start + area.runDistance + FINAL_BOSS_OFFSET * postBossProgress;
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

function normalizeUpgradeTree(targetState = state) {
  const source = targetState.upgrades || {};
  if (Object.prototype.hasOwnProperty.call(source, "dash")) {
    source.skillCooldown = Math.max(Number(source.skillCooldown || 0), Number(source.dash || 0));
  }
  targetState.upgrades = normalizeDefObject(source, upgradeDefs);
}

function normalizeDefObject(source, defs) {
  const output = {};
  for (const def of defs) {
    output[def.id] = Number(source?.[def.id] || 0);
  }
  return output;
}

function normalizeActiveSkill(targetState = state) {
  targetState.settings = targetState.settings || {};
  const activeId = targetState.settings.activeSkill;
  const def = activeSkillDefs.find((entry) => entry.id === activeId);
  if (!def || Number(targetState.researchTree?.[activeId] || 0) <= 0) {
    targetState.settings.activeSkill = "none";
  }
}

function normalizeAreaBossClears(targetState = state) {
  targetState.areaBossClears = targetState.areaBossClears || {};
  const distance = targetState.currentPrestigeDistance || 0;
  for (let i = 0; i < areas.length - 1; i += 1) {
    if (distance >= areas[i + 1].start) {
      targetState.areaBossClears[i] = true;
    }
  }
}

function normalizeDefeatedAreaBosses(targetState = state) {
  targetState.defeatedAreaBosses = targetState.defeatedAreaBosses || {};
  for (let i = 0; i < areas.length - 1; i += 1) {
    if (targetState.areaBossClears?.[i]) {
      targetState.defeatedAreaBosses[i] = true;
    }
  }
  for (const def of researchDefs) {
    if ((targetState.researchTree?.[def.id] || 0) > 0 && def.sourceAreaIndex !== undefined) {
      targetState.defeatedAreaBosses[def.sourceAreaIndex] = true;
    }
  }
}

function normalizeTutorialState(targetState = state) {
  targetState.tutorial = targetState.tutorial && typeof targetState.tutorial === "object"
    ? targetState.tutorial
    : {};
  targetState.tutorial.introComplete = Boolean(targetState.tutorial.introComplete);
  targetState.tutorial.seenHazards = targetState.tutorial.seenHazards || {};
  targetState.tutorial.seenItems = targetState.tutorial.seenItems || {};
  targetState.tutorial.seenBosses = targetState.tutorial.seenBosses || {};
  targetState.tutorial.seenTraits = targetState.tutorial.seenTraits || {};
  targetState.tutorial.seenResearchTrials = targetState.tutorial.seenResearchTrials || {};
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
  if (isAssetSceneActive()) {
    debugMessage("ASSET SCENE中は保存しません");
    return;
  }
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
  window.addEventListener("resize", () => {
    if (guideState.active) showGuideStep();
  });
  window.addEventListener("scroll", () => {
    if (guideState.active) updateGuideHighlight(guideState.currentTarget);
  }, { passive: true });
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  document.addEventListener("keydown", (event) => {
    if (handleDebugTasShortcut(event)) return;
    const jumpKey = isTasEnabled() ? event.code === "ArrowUp" : (event.code === "Space" || event.code === "ArrowUp");
    if (isGuideActive() && jumpKey) {
      event.preventDefault();
      if (!event.repeat) advanceGuide();
      return;
    }
    const gameplayKey = isGameplayKeyCode(event.code);
    if (gameplayKey) event.preventDefault();
    if (gameplayKey && !isTasAllowedGameplayKeyCode(event.code)) return;
    if (event.repeat) return;
    if ((!isTasEnabled() && event.code === "Space") || event.code === "ArrowUp") {
      inputState.blockDirection = "high";
    } else if (event.code === "ArrowDown") {
      inputState.blockDirection = "low";
    }
    if (run.bossBattle && run.bossPhase === "attack" && activeBossSoulMode() === "purple") {
      if ((!isTasEnabled() && event.code === "Space") || event.code === "ArrowUp") shiftWebLane(-1);
      if (event.code === "ArrowDown") shiftWebLane(1);
      const allowedPurpleAction = event.code === "KeyD" || event.code === "KeyQ" || (!isTasEnabled() && event.code === "KeyE");
      if (!allowedPurpleAction) return;
    }
    if (event.code === "KeyQ") {
      markTasAction("cycle");
      cycleActiveSkill();
      return;
    }
    if (event.code === "KeyE") {
      markTasAction("item");
      useStockedItem();
      return;
    }
    if ((!isTasEnabled() && event.code === "Space") || event.code === "ArrowUp") {
      startJumpHold();
    }
    if (event.code === "ArrowDown") {
      startSlideHold();
    }
    if (event.code === "KeyD") {
      markTasAction("skill");
      dash();
    }
  });

  document.addEventListener("keyup", (event) => {
    const gameplayKey = isGameplayKeyCode(event.code);
    if (gameplayKey) event.preventDefault();
    if (gameplayKey && !isTasAllowedGameplayKeyCode(event.code)) return;
    if (((!isTasEnabled() && event.code === "Space") || event.code === "ArrowUp") && inputState.blockDirection === "high") {
      inputState.blockDirection = "mid";
    }
    if (event.code === "ArrowDown" && inputState.blockDirection === "low") {
      inputState.blockDirection = "mid";
    }
    if ((!isTasEnabled() && event.code === "Space") || event.code === "ArrowUp") {
      releaseJumpHold();
    }
    if (event.code === "ArrowDown") {
      cancelSlideHold();
    }
  });

  bindHoldButton(document.getElementById("jumpBtn"), startJumpHold, releaseJumpHold);
  bindHoldButton(document.getElementById("slideBtn"), startSlideHold, cancelSlideHold);
  document.getElementById("dashBtn").addEventListener("click", () => {
    markTasAction("skill");
    activateActiveSkill();
  });
  document.getElementById("cycleSkillBtn").addEventListener("click", () => {
    markTasAction("cycle");
    cycleActiveSkill();
  });
  document.getElementById("stockItemBtn").addEventListener("click", () => {
    if (isTasEnabled()) {
      debugMessage("TAS ITEM INPUT DISABLED");
      return;
    }
    markTasAction("item");
    useStockedItem();
  });
  document.getElementById("restartBtn").addEventListener("click", restartFromButton);
  document.getElementById("overlayRestart").addEventListener("click", restartFromButton);
  document.getElementById("saveBtn").addEventListener("click", saveState);
  document.getElementById("bgmBtn").addEventListener("click", toggleBgm);
  guideNext?.addEventListener("click", advanceGuide);
  document.querySelectorAll("[data-language-choice]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.languageChoice));
  });

  canvas.addEventListener("pointerdown", (event) => {
    inputState.pointerStartX = event.clientX;
    inputState.pointerStartY = event.clientY;
    inputState.pointerStartedAt = gameNow();
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
    const holdSeconds = (gameNow() - inputState.pointerStartedAt) / 1000;
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
    if (action === "selectActiveSkill") selectActiveSkill(id);
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
  panelContent.addEventListener("change", handleDebugPanelInput);
  panelContent.addEventListener("blur", handleDebugPanelInput, true);
  panelContent.addEventListener("keydown", (event) => {
    if (!DEBUG_MODE || !event.target.matches?.(".debug-inline-input")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.blur();
    }
  });

  window.addEventListener("beforeunload", () => {
    const source = isAssetSceneActive() && assetSceneState.snapshot
      ? clonePlain(assetSceneState.snapshot.state)
      : state;
    source.lastSavedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(source));
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
  const audioEntry = isAssetSceneActive()
    && (assetSceneState.entry?.section.includes("BGM") || assetSceneState.entry?.section.includes("ジングル"));
  if (audioEntry && !assetSceneState.musicAvailable) {
    if (music.current) stopBgm();
    return;
  }
  const key = currentMusicKey();
  if (key === music.currentKey) return;
  playBgm(key);
}

function currentMusicKey() {
  if (isAssetSceneActive() && assetSceneState.musicKeyOverride) return assetSceneState.musicKeyOverride;
  if (run.gameOver || musicScene === "result") return "result";
  if (sceneMusicFiles[musicScene]) return musicScene;
  return `area:${areaIndex()}`;
}

function musicUrlForKey(key) {
  if (key.startsWith("asset-file:")) return `${MUSIC_ROOT}${key.slice("asset-file:".length)}`;
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
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(canvas.width / GAME_WIDTH, 0, 0, canvas.height / GAME_HEIGHT, 0, 0);
}

function loop(now) {
  lastAnimationFrameAt = performance.now();
  runLoopFrame(now);
  requestAnimationFrame(loop);
}

function runLoopFrame(now) {
  const elapsed = Math.max(0, (now - lastFrame) / 1000);
  const rawDt = isTasEnabled() ? Math.min(1, elapsed) : Math.min(0.05, elapsed);
  lastFrame = now;
  if (isAssetSceneActive()) {
    tasStepAccumulator = 0;
    syncBgm();
    draw();
    return;
  }
  if (isTasEnabled()) {
    updateTasFixedSteps(rawDt);
  } else {
    tasStepAccumulator = 0;
    gameClockMs += rawDt * 1000;
    update(rawDt);
  }
  draw();
}

function runTasAnimationFallback() {
  const now = performance.now();
  if (!isTasEnabled() || now - lastAnimationFrameAt < 100) return;
  runLoopFrame(now);
}

function updateTasFixedSteps(rawDt) {
  if (isGameplayPaused()) {
    tasStepAccumulator = 0;
    return;
  }
  if (tasState.paused) {
    tasStepAccumulator = 0;
    if (tasState.queuedSteps > 0) {
      tasState.queuedSteps -= 1;
      advanceTasSimulationFrame();
    }
    return;
  }

  tasStepAccumulator += rawDt * tasSpeedMultiplier();
  let steps = 0;
  while (
    tasStepAccumulator >= TAS_STEP_SECONDS
    && steps < TAS_MAX_STEPS_PER_DRAW
    && !tasState.paused
  ) {
    tasStepAccumulator -= TAS_STEP_SECONDS;
    advanceTasSimulationFrame();
    steps += 1;
  }
}

function advanceTasSimulationFrame() {
  gameClockMs += TAS_STEP_SECONDS * 1000;
  update(TAS_STEP_SECONDS);
}

function gameNow() {
  return gameClockMs;
}

function update(dt) {
  if (isGameplayPaused()) {
    if (messageTimer > 0) messageTimer -= dt;
    syncBgm();
    return;
  }
  const tasAdvancing = isTasEnabled() && dt > 0;
  if (tasAdvancing) {
    captureTasRewindSnapshot();
    applyTasPlaybackFrame();
    recordTasInputFrame();
  }
  ensureMissions();
  updateInputHolds();
  tickIdle(dt);
  tickChestTimers(dt);
  tickBoosts(dt);
  checkAchievements();
  if (isTasEnabled()) applyTasBalanceOverrides();

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
    if (!tasBatchAdvancing) {
      updateHud();
      if (activeTab === "equipment" || activeTab === "missions" || activeTab === "prestige") {
        renderPanel();
      }
      if (DEBUG_MODE) renderDebugTasControls();
    }
  }
  if (tasAdvancing) {
    tasState.frame += 1;
    if (Number.isFinite(tasState.pauseAtFrame) && tasState.frame >= tasState.pauseAtFrame) {
      tasState.paused = true;
      tasState.pauseAtFrame = null;
      tasStepAccumulator = 0;
    }
    if (!tasBatchAdvancing) renderDebugTasControls();
  }
}

function updateInputHolds() {
  if (!inputState.jumpHolding) return;
  const heldSeconds = (gameNow() - inputState.jumpStartedAt) / 1000;
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
  const speedMeters = run.bossBattle ? 0 : stats.speed * dashMult * eventSpeed * chillMult;
  const scrollSpeed = stopped || run.bossBattle ? 0 : speedMeters * 48;

  if (run.bossBattle) {
    updateBossBattle(dt);
  } else {
    advanceRunDistance(speedMeters * dt);
    maybeSpawnScheduledChest();

    run.nextSpawn -= dt;
    if (run.nextSpawn <= 0 && !stopped) {
      spawnSegment(stats);
      run.nextSpawn = runPatternSpawnDelay(speedMeters);
    }
  }

  updatePlayer(dt, stats);
  retryTasJumpAfterLanding();
  updateObjects(dt, scrollSpeed, stats);
  updateParticles(dt);
  if (!run.bossBattle) updateEvent(dt);

  if (run.dashTimer > 0) run.dashTimer -= dt;
  if (run.dashCooldown > 0) run.dashCooldown -= dt;
  updateActiveSkillCooldowns(dt);
  if (run.skillShield > 0) run.skillShield -= dt;
  if (run.giantTimer > 0) run.giantTimer -= dt;
  if (run.timeStop > 0) run.timeStop -= dt;
  if (run.gravityGuardTimer > 0) run.gravityGuardTimer -= dt;
  if (run.phasePinTimer > 0) run.phasePinTimer -= dt;
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

  syncPlayerAnimationState();
  state.bestDistance = Math.max(state.bestDistance, run.distance);
  state.currentPrestigeDistance = Math.max(state.currentPrestigeDistance || 0, run.distance);
}

function advanceRunDistance(delta) {
  if (delta <= 0) return;
  const previousArea = areaIndexForDistance(run.distance);
  const area = previousArea;
  const bossMark = nextAreaBossDistance(area);
  const shouldFight = Number.isFinite(bossMark) && !isAreaBossCleared(area);
  const nextDistance = run.distance + delta;
  const appliedDelta = shouldFight && nextDistance >= bossMark
    ? Math.max(0, bossMark - run.distance)
    : delta;
  if (appliedDelta > 0) {
    run.distance += appliedDelta;
    state.totalDistance += appliedDelta;
    addMissionProgress("dailyDistance", appliedDelta);
    addMissionProgress("weeklyDistance", appliedDelta);
  }
  const newArea = areaIndexForDistance(run.distance);
  if (newArea !== previousArea) {
    maybeExplainAreaTrait(newArea);
  }
  if (shouldFight && nextDistance >= bossMark) {
    run.distance = bossMark;
    startAreaBossBattle(area);
  }
}

function maybeSpawnScheduledChest() {
  while (!run.bossBattle && run.distance >= run.nextChestMark) {
    spawnChest(canvasWidth + 260);
    run.nextChestMark += CHEST_DISTANCE_INTERVAL;
  }
}

function updatePlayer(dt, stats) {
  if (run.bossBattle && run.bossPhase === "attack" && activeBossSoulMode() === "purple") {
    updateWebLanePlayer(dt);
    return;
  }
  const gravity = run.gravityFlip ? -PLAYER_GRAVITY : PLAYER_GRAVITY;
  const targetGround = run.gravityFlip ? PLAYER_CEILING_Y : groundY - getPlayerHeight();

  player.slideTimer = Math.max(0, player.slideTimer - dt);
  player.vy += gravity * dt;
  player.y += player.vy * dt;

  if (!run.gravityFlip) {
    if (player.y >= targetGround) {
      player.y = targetGround;
      player.vy = 0;
      player.jumpsUsed = 0;
      run.gravityLandingGuard = false;
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

function shiftWebLane(direction) {
  run.webLane = Math.max(0, Math.min(2, (run.webLane ?? 1) + direction));
  player.slideTimer = 0;
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.slideHolding = false;
  restartPlayerAnimation("running");
}

function updateWebLanePlayer(dt) {
  const targetY = webLaneY(run.webLane ?? 1);
  player.vy = 0;
  player.jumpsUsed = 0;
  player.slideTimer = 0;
  player.y += (targetY - player.y) * Math.min(1, dt * 16);
}

function webLaneY(lane) {
  const heights = [150, 98, 46];
  return groundY - heights[Math.max(0, Math.min(2, lane))];
}

function updateObjects(dt, scrollSpeed, stats) {
  const magnetRadius = stats.magnetRadius * (run.event === "coinRain" ? 1.35 : 1);
  const playerRect = getPlayerRect();
  const removed = new Set();

  for (const obj of objects) {
    const frozen = run.timeStop > 0 && obj.type !== "boss";
    if (!frozen) {
      obj.x += (obj.vx || 0) * dt;
      obj.y += (obj.vy || 0) * dt;
      if (obj.gravity) obj.vy = (obj.vy || 0) + obj.gravity * dt;
      if (obj.bounceOnGround) applyGroundBounce(obj);
      obj.x -= scrollSpeed * dt;
    }
    checkHazardGuideTrigger(obj);
    checkItemGuideTrigger(obj);
    checkResearchTrialGuideTrigger(obj);
    if (obj.hitCooldown > 0) obj.hitCooldown -= dt;
    if (!frozen && (obj.type === "enemy" || obj.type === "boss")) {
      updateEnemyTrait(obj, dt, playerRect);
    }
    if (obj.life !== undefined) {
      obj.life -= dt;
      if (obj.life <= 0) {
        removed.add(obj);
        continue;
      }
    }
    if (obj.type === "playerShot") {
      handlePlayerShotCollision(obj, removed);
      continue;
    }
    if (run.echoActive && obj.dualHazard && (obj.type === "obstacle" || obj.type === "enemy")) {
      const echoRect = getPlayerEchoRect();
      if (echoRect && rectsOverlap(echoRect, obj)) {
        damagePlayer({ source: obj });
        obj.x += 90;
      }
    }

    if (obj.type === "boss" && obj.x + obj.w < 0) {
      damagePlayer({ force: true, source: obj });
      if (run.gameOver) continue;
      if (obj.finalBoss && run.bossBattle) {
        switchBossPhase(obj, "attack");
        obj.x = canvasWidth + 120;
        obj.y = groundY - obj.h;
        player.invulnerable = Math.max(player.invulnerable, 0.8);
        logEvent("BOSS ESCAPED");
        continue;
      }
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

    const separatedPurpleLane = run.bossBattle
      && run.bossPhase === "attack"
      && activeBossSoulMode() === "purple"
      && obj.bossAttack
      && Number.isInteger(obj.webLane)
      && obj.webLane !== run.webLane;
    if (separatedPurpleLane) continue;

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
        stockItem(obj.kind);
        removed.add(obj);
      } else if (obj.type === "obstacle") {
        if (obj.kind === "researchGate" && handleResearchTrialCollision(obj, removed)) {
          // Research trial handled this collision.
        } else if (handleSoulObstacleCollision(obj, removed)) {
          // Soul-mode rule handled this collision.
        } else if (isInvincible() || run.event === "clearPath") {
          burst(obj.x, obj.y, "#f2b84b", 9);
          removed.add(obj);
          gainCombo(1);
        } else {
          damagePlayer({ source: obj, playerRect });
          obj.x -= 80;
        }
      } else if (obj.type === "enemy") {
        if (handleSoulEnemyCollision(obj, removed)) {
          // Soul-mode rule handled this collision.
        } else if (canStomp(obj) || isInvincible()) {
          if (damageEnemy(obj, isInvincible() ? 2 : 1)) {
            defeatEnemy(obj);
            removed.add(obj);
          }
        } else {
          damagePlayer({ source: obj, playerRect });
          obj.x -= 85;
        }
      } else if (obj.type === "boss") {
        const finalBossClosed = obj.finalBoss && !obj.vulnerable;
        const finalBossOpen = obj.finalBoss && obj.vulnerable;
        if (finalBossClosed) {
          if (!isInvincible() && run.skillShield <= 0 && player.invulnerable <= 0.05) {
            damagePlayer({ source: obj, playerRect });
          }
          player.vy = run.gravityFlip ? 300 : -300;
          obj.x += 70;
        } else if (finalBossOpen) {
          if (canStomp(obj)) {
            if (damageEnemy(obj, 1)) {
              defeatBoss(obj);
              removed.add(obj);
            }
            player.vy = run.gravityFlip ? 480 : -480;
            burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#ef6b65", 14);
            gainCombo(3);
          } else {
            const hpBefore = run.hp;
            damagePlayer({ source: obj, playerRect });
            if (!run.gameOver && run.hp < hpBefore) {
              switchBossPhase(obj, "attack");
            }
          }
        } else if (run.dashTimer > 0) {
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
          damagePlayer({ source: obj, playerRect });
          obj.x -= 90;
        }
      }
    }
  }

  objects = objects.filter((obj) => obj.x > -220 && !removed.has(obj));
}

function applyGroundBounce(obj) {
  const floorY = groundY - obj.h;
  if (obj.y < floorY) return;
  obj.y = floorY;
  if ((obj.vy || 0) <= 0) return;
  const factor = obj.bounceFactor ?? 0.72;
  const minimum = obj.bounceVelocity || 260;
  obj.vy = -Math.max(minimum, Math.abs(obj.vy) * factor);
}

function handlePlayerShotCollision(shot, removed) {
  const target = objects.find((obj) => {
    if (obj === shot || removed.has(obj)) return false;
    if (obj.type !== "obstacle" && obj.type !== "enemy" && obj.type !== "boss") return false;
    if (obj.kind === "researchGate") return false;
    return rectsOverlap(shot, obj);
  });
  if (!target) return;
  removed.add(shot);
  burst(shot.x + shot.w, shot.y + shot.h / 2, shot.color, 6);
  if (target.type === "obstacle") {
    removed.add(target);
    gainCombo(1);
    return;
  }
  const canDamageBoss = target.type !== "boss" || activeBossSoulMode() === "yellow" || target.vulnerable;
  if (!canDamageBoss) return;
  if (damageEnemy(target, 1)) {
    if (target.type === "boss") defeatBoss(target);
    else defeatEnemy(target);
    removed.add(target);
  }
}

function handleSoulObstacleCollision(obj, removed) {
  if (obj.soulRule === "patience") {
    if (isPlayerStillForPatience()) {
      removed.add(obj);
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#65d6ff", 7);
      gainCombo(1);
    } else {
      damagePlayer({ source: obj });
      obj.x -= 80;
    }
    return true;
  }
  if (obj.soulRule === "bravery") {
    if (isPlayerActingForBravery()) {
      removed.add(obj);
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#ff9f3d", 8);
      gainCombo(1);
    } else {
      damagePlayer({ source: obj });
      obj.x -= 80;
    }
    return true;
  }
  if (obj.soulRule === "shield") {
    if (shieldDirection() === obj.shieldLane) {
      removed.add(obj);
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#60d878", 8);
      if (run.hp < getStats().maxHp && shouldShieldBlockHeal()) run.hp += 1;
      gainCombo(1);
    } else {
      damagePlayer({ source: obj });
      obj.x -= 80;
    }
    return true;
  }
  return false;
}

function handleSoulEnemyCollision(obj, removed) {
  if (obj.soulRule === "patience") {
    if (isPlayerStillForPatience()) {
      removed.add(obj);
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#65d6ff", 7);
      gainCombo(1);
    } else {
      damagePlayer({ source: obj });
      obj.x -= 85;
    }
    return true;
  }
  if (obj.soulRule === "bravery") {
    if (isPlayerActingForBravery()) {
      defeatEnemy(obj);
      removed.add(obj);
    } else {
      damagePlayer({ source: obj });
      obj.x -= 85;
    }
    return true;
  }
  if (obj.soulRule === "shield") {
    if (shieldDirection() === obj.shieldLane) {
      removed.add(obj);
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#60d878", 8);
      gainCombo(1);
    } else {
      damagePlayer({ source: obj });
      obj.x -= 85;
    }
    return true;
  }
  return false;
}

function isPlayerStillForPatience() {
  return Math.abs(player.vy) < 12 && player.slideTimer <= 0 && !inputState.jumpHolding && player.jumpsUsed === 0;
}

function isPlayerActingForBravery() {
  return Math.abs(player.vy) > 35 || player.slideTimer > 0 || run.dashTimer > 0 || inputState.jumpHolding;
}

function shieldDirection() {
  return inputState.blockDirection || "mid";
}

function damageEnemy(obj, amount = 1) {
  if (obj.hitCooldown > 0) return false;
  if (obj.armor > 0) {
    obj.armor -= 1;
    obj.hitCooldown = 0.28;
    burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#d7b878", 8);
    return false;
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
  obj.traitWarning = false;
  if (obj.finalBoss && run.bossBattle && run.bossPhase === "vulnerable") {
    updateBossGimmick(obj, dt, distance);
    return;
  }
  if (obj.finalBoss && run.bossBattle && run.bossPhase === "attack" && run.bossChargeTimer <= 0) {
    updateBossGimmick(obj, dt, distance);
    return;
  }

  if (obj.trait === "sandArmor") {
    const armor = Math.max(0, Number(obj.armor || 0));
    if ((obj.lastTraitArmor || 0) > 0 && armor <= 0 && (obj.armorReformCharges || 0) > 0) {
      obj.armorReformTimer = 2.4;
    }
    if (armor <= 0 && obj.armorReformTimer > 0) {
      obj.armorReformTimer -= dt;
      obj.traitWarning = obj.armorReformTimer <= 0.65;
      if (obj.armorReformTimer <= 0) {
        obj.armor = 1;
        obj.armorReformCharges -= 1;
        burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#d7b878", 7);
      }
    }
    obj.lastTraitArmor = Math.max(0, Number(obj.armor || 0));
  }

  if (obj.trait === "frostAura" && distance < 135) {
    const duration = (obj.type === "boss" ? 1.6 : 0.85) * researchReduction("frostInsulation");
    run.chillTimer = Math.max(run.chillTimer, duration);
  }
  if (obj.trait === "frostAura") {
    obj.frostPulseTimer -= dt;
    obj.traitWarning = distance < 240 && obj.frostPulseTimer <= 0.65;
    if (distance < 220 && obj.frostPulseTimer <= 0) {
      run.chillTimer = Math.max(run.chillTimer, (obj.type === "boss" ? 1.5 : 1.05) * researchReduction("frostInsulation"));
      player.vy *= 0.86;
      obj.frostPulseTimer = obj.type === "boss" ? 2.1 : 2.65;
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#9fd9ff", 8);
    }
  }
  if (obj.trait === "burning") {
    obj.burningPulseTimer -= dt;
    obj.traitWarning = distance < 330 && obj.burningPulseTimer <= 0.7;
    if (distance < 300 && obj.burningPulseTimer <= 0) {
      spawnEnemyTraitHazard(obj, "meteor", {
        lane: "ground",
        color: "#ff8b38",
        w: 26,
        h: 24,
        sourceGap: run.bossBattle ? 72 : 190
      });
      obj.burningPulseTimer = obj.type === "boss" ? 1.85 : 2.35;
    }
  }
  if (obj.trait === "energyShield") {
    const shield = Math.max(0, Number(obj.shield || 0));
    if ((obj.lastTraitShield || 0) > 0 && shield <= 0 && (obj.shieldRechargeCharges || 0) > 0) {
      obj.shieldRechargeTimer = 3.2;
    }
    if (shield <= 0 && obj.shieldRechargeTimer > 0) {
      obj.shieldRechargeTimer -= dt;
      obj.traitWarning = obj.shieldRechargeTimer <= 0.75;
      if (obj.shieldRechargeTimer <= 0) {
        obj.shield = 1;
        obj.shieldRechargeCharges -= 1;
        spawnEnemyTraitHazard(obj, "laser", { lane: "mid", color: "#48bde7", w: 20, h: 54 });
        burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#48bde7", 9);
      }
    }
    obj.lastTraitShield = Math.max(0, Number(obj.shield || 0));
  }
  if (obj.trait === "voidPull" && distance < 190) {
    const pullScale = researchReduction("voidTether");
    obj.x -= 34 * pullScale * dt;
    player.vy += Math.sign(dy || 1) * 70 * pullScale * (obj.voidPolarity || 1) * dt;
  }
  if (obj.trait === "voidPull") {
    obj.voidPolarityTimer -= dt;
    obj.traitWarning = distance < 230 && obj.voidPolarityTimer <= 0.65;
    if (obj.voidPolarityTimer <= 0) {
      obj.voidPolarity = (obj.voidPolarity || 1) * -1;
      obj.voidPolarityTimer = obj.type === "boss" ? 1.85 : 2.25;
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.voidPolarity > 0 ? "#b98cff" : "#65d6ff", 7);
    }
  }
  if (obj.trait === "gravityPulse") {
    obj.pulseTimer = (obj.pulseTimer || 1.6) - dt;
    obj.traitWarning = distance < 170 && obj.pulseTimer <= 0.7;
    if (distance < 120 && obj.pulseTimer <= 0) {
      if (run.gravityGuardTimer <= 0) {
        run.gravityFlip = !run.gravityFlip;
        player.vy *= -0.25;
      }
      obj.pulseTimer = obj.type === "boss" ? 4.5 : 3.2;
      logEvent("GRAVITY PULSE");
    }
  }
  if (obj.trait === "regen" && !obj.finalBoss && obj.hp && obj.maxHp && obj.hp < obj.maxHp) {
    obj.regenTimer = (obj.regenTimer || (1.5 + researchLevel("aetherSeal") * 0.12)) - dt;
    obj.traitWarning = obj.regenTimer <= 0.7;
    if (obj.regenTimer <= 0) {
      obj.hp = Math.min(obj.maxHp, obj.hp + 1);
      obj.regenTimer = (obj.type === "boss" ? 2.4 : 3.5) + researchLevel("aetherSeal") * 0.12;
      spawnEnemyTraitHazard(obj, "meteor", { lane: "air", color: "#fff1a5", w: 24, h: 24 });
    }
  }
  if (obj.trait === "phase") {
    const wasPhased = Boolean(obj.phased);
    obj.phaseTimer = (obj.phaseTimer || 0) + dt;
    obj.phased = run.phasePinTimer <= 0 && Math.sin(obj.phaseTimer * 2.4) > 0.62;
    obj.traitWarning = !obj.phased && Math.sin(obj.phaseTimer * 2.4) > 0.35;
    obj.phaseEchoCooldown = Math.max(0, (obj.phaseEchoCooldown || 0) - dt);
    if (wasPhased && !obj.phased && obj.phaseEchoCooldown <= 0) {
      spawnEnemyTraitHazard(obj, "meteor", { lane: "echo", color: "#8fffc6", w: 24, h: 24 });
      obj.phaseEchoCooldown = 1.1;
    }
  }
  if (obj.type === "boss") {
    updateBossGimmick(obj, dt, distance);
  }
}

function spawnEnemyTraitHazard(source, kind, options = {}) {
  const w = options.w || 24;
  const h = options.h || 24;
  const lane = options.lane || "mid";
  const y = lane === "ground"
    ? groundY - h
    : lane === "air"
      ? groundY - 150
      : lane === "echo"
        ? Math.max(40, Math.min(groundY - h, source.y + source.h / 2 - h / 2))
        : groundY - 96;
  const safeGap = run.bossBattle ? 190 : 260;
  const x = Math.max(source.x + source.w + (options.sourceGap || 28), player.x + safeGap);
  const hazard = {
    type: "obstacle",
    kind,
    traitHazard: true,
    bossAttack: Boolean(run.bossBattle),
    x,
    y,
    w,
    h,
    vx: run.bossBattle ? -190 : -48,
    life: run.bossBattle ? 4.2 : 3.6,
    color: options.color || source.color || "#ffffff",
    attackVolley: Number.isFinite(source.attackVolley) ? Math.max(0, source.attackVolley - 1) : Math.max(0, run.bossVolley - 1)
  };
  const finalBoss = objects.find((obj) => obj.type === "boss" && obj.finalBoss);
  if (run.bossBattle && finalBoss) {
    applyBossSoulRule(hazard, finalBoss, {});
    applyBossWebLaneRule(hazard, finalBoss);
  }
  objects.push(hazard);
}

function updateBossGimmick(obj, dt, distance) {
  if (run.bossBattle && obj.finalBoss) {
    updateFinalBossGimmick(obj, dt);
    return;
  }
  obj.bossTimer = (obj.bossTimer || 2) - dt;
  if (obj.bossGimmick === "sandBurrow") {
    obj.y = groundY - obj.h - Math.abs(Math.sin(gameNow() / 620)) * 22;
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
    objects.push({ type: "obstacle", kind: "meteor", bossAttack: run.bossBattle, x: obj.x - 90, y: groundY - random(130, 250), w: 34, h: 34, vx: run.bossBattle ? -120 : 0, vy: run.bossBattle ? 80 : 0, gravity: run.bossBattle ? 70 : 0, color: "#ef6b65" });
    obj.bossTimer = 3.1;
  }
  if (obj.bossGimmick === "laserGrid" && obj.bossTimer <= 0) {
    objects.push({ type: "obstacle", kind: "laser", bossAttack: run.bossBattle, x: obj.x - 80, y: groundY - 128, w: 24, h: 88, vx: run.bossBattle ? -135 : 0, color: "#ef6b65" });
    obj.bossTimer = 3.6;
  }
  if (obj.bossGimmick === "gravitySurge" && obj.bossTimer <= 0) {
    if (run.gravityGuardTimer <= 0) {
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
    obj.phased = run.phasePinTimer <= 0 && Math.sin(obj.phaseTimer * 3) > 0.45;
  }
  if (obj.bossGimmick === "slimeSplit" && obj.bossTimer <= 0 && (obj.spawnedMinions || 0) < 2) {
    objects.push(applyEnemyTraits({
      type: "enemy",
      kind: "slime",
      bossAttack: run.bossBattle,
      x: obj.x - 48,
      y: groundY - 30,
      w: 30,
      h: 30,
      vx: run.bossBattle ? -115 : 0,
      color: "#75d05e"
    }, obj.areaIndex || 0));
    obj.spawnedMinions = (obj.spawnedMinions || 0) + 1;
    obj.bossTimer = 4.2;
  }
}

function updateFinalBossGimmick(boss, dt) {
  const index = boss.areaIndex || 0;
  const phaseKey = `${run.bossPhase}:${run.bossPatternIndex}`;
  if (boss.gimmickPhaseKey !== phaseKey) {
    boss.gimmickPhaseKey = phaseKey;
    boss.gimmickUsed = false;
    boss.gimmickTimer = boss.bossGimmick === "aetherRegen" ? 4.5 : 0.75;
    if (run.bossPhase === "vulnerable") {
      boss.phased = false;
    }
  }

  if (run.bossPhase === "vulnerable") {
    boss.phased = false;
    if (boss.bossGimmick === "sandBurrow") boss.y = finalBossVulnerableY(boss);
    return;
  }

  if (run.bossChargeTimer <= 0) {
    return;
  }

  boss.gimmickTimer = (boss.gimmickTimer || 0.75) - dt;

  if (boss.bossGimmick === "slimeSplit" && boss.gimmickTimer <= 0) {
    addBossEnemy("slime", boss, { x: boss.x - 64, y: groundY - 28, w: 26, h: 26, vx: bossSpeed(index, 64), color: "#75d05e" });
    boss.gimmickTimer = 1.35;
  }

  if (boss.bossGimmick === "sandBurrow") {
    boss.phased = run.bossChargeTimer > finalBossAttackDuration(index) - 0.75;
    const bob = boss.phased ? 0 : Math.abs(Math.sin(gameNow() / 180)) * 8;
    boss.y = groundY - boss.h - bob;
  }

  if (boss.bossGimmick === "frostPrison") {
    run.chillTimer = Math.max(run.chillTimer, 0.35 * researchReduction("frostInsulation"));
    if (boss.gimmickTimer <= 0) {
      addBossObstacle("crate", boss, { x: player.x + 260, y: groundY - 62, w: 42, h: 62, vx: -42, color: "#d9f6ff" });
      boss.gimmickTimer = 1.55;
    }
  }

  if (boss.bossGimmick === "lavaMeteor" && boss.gimmickTimer <= 0) {
    addBossMeteor(boss, { w: 32, h: 32, color: "#ffb238" });
    boss.gimmickTimer = 1.25;
  }

  if (boss.bossGimmick === "laserGrid") {
    if (!boss.gimmickUsed && (boss.laserShieldCharges || 0) < 3) {
      boss.shield = Math.max(boss.shield || 0, 1);
      boss.laserShieldCharges = (boss.laserShieldCharges || 0) + 1;
      boss.gimmickUsed = true;
    }
    if (boss.gimmickTimer <= 0) {
      addBossObstacle("laser", boss, { x: bossSpawnX(boss, 60), y: groundY - 112, w: 20, h: 72, vx: bossSpeed(index, 58), color: "#48bde7" });
      boss.gimmickTimer = 1.35;
    }
  }

  if (boss.bossGimmick === "gravitySurge" && !boss.gimmickUsed) {
    if (run.gravityGuardTimer <= 0) {
      run.gravityFlip = !run.gravityFlip;
      player.vy *= -0.25;
    }
    boss.gimmickUsed = true;
    logEvent("BOSS GRAVITY SURGE");
  }

  if (boss.bossGimmick === "singularity") {
    const pullScale = researchReduction("voidTether");
    player.vy += (run.gravityFlip ? -1 : 1) * 120 * pullScale * dt;
    if (boss.gimmickTimer <= 0) {
      addBossMeteor(boss, { w: 30, h: 30, color: "#d7b8ff", travelTime: 1.05 });
      boss.gimmickTimer = 1.45;
    }
  }

  if (boss.bossGimmick === "aetherRegen" && boss.gimmickTimer <= 0) {
    if (boss.hp < boss.maxHp && (boss.aetherRegenCharges || 0) < 5) {
      boss.hp = Math.min(boss.maxHp, boss.hp + 1);
      boss.aetherRegenCharges = (boss.aetherRegenCharges || 0) + 1;
    }
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, "#fff1a5", 8);
    boss.gimmickTimer = Math.max(3.4, 4.5 - researchLevel("aetherSeal") * 0.12);
  }

  if (boss.bossGimmick === "infinitePhase") {
    boss.phased = run.phasePinTimer <= 0 && Math.sin(gameNow() / 130) > -0.1;
    if (boss.gimmickTimer <= 0) {
      const birdPattern = nextFinalBossGimmickPattern(boss, "infinitePhaseBird");
      addBossEnemy("bird", boss, {
        x: bossSpawnX(boss, birdPattern.offset),
        y: groundY - birdPattern.height,
        vx: bossSpeed(index, birdPattern.speedAdd),
        color: "#8fffc6"
      });
      boss.gimmickTimer = 1.45;
    }
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
      if (ended === "gravity") run.gravityLandingGuard = shouldGuardGravityLanding();
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

const RUN_PATTERN_TEMPLATES = [
  {
    id: "arc_gate",
    entries: [
      { type: "coins", offset: 40, count: 7, arc: true, lane: "mid" },
      { type: "hazard", role: "ground", offset: 430 },
      { type: "coins", offset: 740, count: 5, lane: "low" }
    ]
  },
  {
    id: "step_low",
    entries: [
      { type: "hazard", role: "block", offset: 340 },
      { type: "coins", offset: 460, count: 6, arc: true, lane: "mid" },
      { type: "hazard", role: "ground", offset: 740 },
      { type: "item", offset: 1100, chance: 0.1 }
    ]
  },
  {
    id: "air_over",
    entries: [
      { type: "coins", offset: 80, count: 6, lane: "low" },
      { type: "hazard", role: "air", offset: 390, lane: "high" },
      { type: "hazard", role: "ground", offset: 790 },
      { type: "coins", offset: 940, count: 5, arc: true, lane: "mid" }
    ]
  },
  {
    id: "laser_gap",
    entries: [
      { type: "coins", offset: 90, count: 5, lane: "high" },
      { type: "hazard", role: "tall", offset: 500 },
      { type: "coins", offset: 730, count: 6, lane: "low" },
      { type: "item", offset: 1180, chance: 0.12 }
    ]
  },
  {
    id: "double_ground",
    entries: [
      { type: "hazard", role: "ground", offset: 260 },
      { type: "coins", offset: 450, count: 5, lane: "mid" },
      { type: "hazard", role: "heavy", offset: 720 },
      { type: "coins", offset: 890, count: 6, arc: true, lane: "mid" }
    ]
  },
  {
    id: "fall_lane",
    entries: [
      { type: "coins", offset: 70, count: 7, lane: "low" },
      { type: "hazard", role: "fall", offset: 450, lane: "high" },
      { type: "hazard", role: "air", offset: 820, lane: "mid" },
      { type: "coins", offset: 1030, count: 4, lane: "high" }
    ]
  },
  {
    id: "reward_thread",
    entries: [
      { type: "coins", offset: 60, count: 9, lane: "mid", rareChance: 0.04 },
      { type: "item", offset: 720, chance: 0.15 },
      { type: "hazard", role: "ground", offset: 1000 }
    ]
  },
  {
    id: "stagger_wall",
    entries: [
      { type: "coins", offset: 230, count: 4, lane: "low" },
      { type: "hazard", role: "tall", offset: 620 },
      { type: "coins", offset: 800, count: 6, arc: true, lane: "mid" },
      { type: "item", offset: 1220, chance: 0.1 }
    ]
  },
  {
    id: "high_low",
    entries: [
      { type: "hazard", role: "air", offset: 280, lane: "high" },
      { type: "coins", offset: 410, count: 7, arc: true, lane: "high" },
      { type: "hazard", role: "ground", offset: 910 }
    ]
  },
  {
    id: "mixed_end",
    entries: [
      { type: "hazard", role: "heavy", offset: 230 },
      { type: "coins", offset: 430, count: 6, lane: "low" },
      { type: "hazard", role: "fall", offset: 790, lane: "mid" },
      { type: "coins", offset: 1010, count: 5, arc: true, lane: "mid" },
      { type: "item", offset: 1280, chance: 0.08 }
    ]
  }
];

const AREA_PATTERN_HAZARDS = [
  { ground: ["spike", "crate"], block: ["crate"], heavy: ["slime"], air: ["bird"], tall: ["laser"], fall: ["spike"] },
  { ground: ["spike"], block: ["crate"], heavy: ["bomb"], air: ["bird"], tall: ["laser"], fall: ["meteor"] },
  { ground: ["crate", "spike"], block: ["crate"], heavy: ["slime"], air: ["bird"], tall: ["laser"], fall: ["meteor"] },
  { ground: ["spike"], block: ["crate"], heavy: ["bomb"], air: ["bird"], tall: ["laser"], fall: ["meteor"] },
  { ground: ["spike"], block: ["crate"], heavy: ["bomb"], air: ["bird"], tall: ["laser"], fall: ["laser"] },
  { ground: ["spike"], block: ["crate"], heavy: ["bomb"], air: ["bird"], tall: ["laser"], fall: ["meteor"] },
  { ground: ["spike"], block: ["crate"], heavy: ["bomb"], air: ["bird"], tall: ["laser"], fall: ["meteor"] },
  { ground: ["spike"], block: ["crate"], heavy: ["slime"], air: ["bird"], tall: ["laser"], fall: ["meteor"] },
  { ground: ["spike"], block: ["crate"], heavy: ["bomb"], air: ["bird"], tall: ["laser"], fall: ["meteor"] }
];

const RUN_EVENT_PATTERN_TEMPLATES = {
  coinRain: [
    { id: "arc_gate", entries: [{ type: "coins", offset: 120, count: 10, arc: true, lane: "high", rareChance: 0.035 }, { type: "coins", offset: 760, count: 8, lane: "low" }] },
    { id: "step_low", entries: [{ type: "coins", offset: 120, count: 8, lane: "low" }, { type: "coins", offset: 560, count: 9, arc: true, lane: "mid" }] },
    { id: "air_over", entries: [{ type: "coins", offset: 160, count: 10, arc: true, lane: "high" }, { type: "coins", offset: 860, count: 6, lane: "mid" }] },
    { id: "laser_gap", entries: [{ type: "coins", offset: 80, count: 7, lane: "high" }, { type: "coins", offset: 640, count: 10, arc: true, lane: "low", rareChance: 0.03 }] },
    { id: "double_ground", entries: [{ type: "coins", offset: 110, count: 8, arc: true, lane: "mid" }, { type: "coins", offset: 860, count: 8, lane: "high" }] },
    { id: "fall_lane", entries: [{ type: "coins", offset: 100, count: 9, lane: "low" }, { type: "coins", offset: 700, count: 7, arc: true, lane: "high" }] },
    { id: "reward_thread", entries: [{ type: "coins", offset: 90, count: 12, lane: "mid", rareChance: 0.05 }, { type: "item", offset: 1040, chance: 0.08 }] },
    { id: "stagger_wall", entries: [{ type: "coins", offset: 120, count: 8, arc: true, lane: "high" }, { type: "coins", offset: 840, count: 7, lane: "low" }] },
    { id: "high_low", entries: [{ type: "coins", offset: 80, count: 8, lane: "high" }, { type: "coins", offset: 520, count: 8, arc: true, lane: "low" }] },
    { id: "mixed_end", entries: [{ type: "coins", offset: 120, count: 9, lane: "mid" }, { type: "coins", offset: 820, count: 7, arc: true, lane: "high", rareChance: 0.035 }] }
  ],
  meteor: [
    { id: "arc_gate", entries: [{ type: "hazard", kind: "meteor", offset: 310, lane: "high" }, { type: "hazard", kind: "meteor", offset: 910, lane: "mid" }] },
    { id: "step_low", entries: [{ type: "hazard", kind: "meteor", offset: 170, lane: "mid" }, { type: "hazard", kind: "meteor", offset: 760, lane: "high" }, { type: "coins", offset: 980, count: 4, lane: "low" }] },
    { id: "air_over", entries: [{ type: "hazard", kind: "meteor", offset: 360, lane: "high" }, { type: "hazard", kind: "meteor", offset: 1080, lane: "low" }] },
    { id: "laser_gap", entries: [{ type: "hazard", kind: "meteor", offset: 230, lane: "low" }, { type: "hazard", kind: "meteor", offset: 620, lane: "high" }, { type: "hazard", kind: "meteor", offset: 1120, lane: "mid" }] },
    { id: "double_ground", entries: [{ type: "hazard", kind: "meteor", offset: 380, lane: "mid" }, { type: "hazard", kind: "meteor", offset: 980, lane: "high" }] },
    { id: "fall_lane", entries: [{ type: "hazard", kind: "meteor", offset: 220, lane: "high" }, { type: "hazard", kind: "meteor", offset: 620, lane: "mid" }, { type: "hazard", kind: "meteor", offset: 1060, lane: "low" }] },
    { id: "reward_thread", entries: [{ type: "coins", offset: 140, count: 5, lane: "low" }, { type: "hazard", kind: "meteor", offset: 520, lane: "high" }, { type: "hazard", kind: "meteor", offset: 1160, lane: "mid" }] },
    { id: "stagger_wall", entries: [{ type: "hazard", kind: "meteor", offset: 330, lane: "low" }, { type: "hazard", kind: "meteor", offset: 780, lane: "high" }, { type: "coins", offset: 1040, count: 4, lane: "mid" }] },
    { id: "high_low", entries: [{ type: "hazard", kind: "meteor", offset: 260, lane: "high" }, { type: "hazard", kind: "meteor", offset: 760, lane: "low" }] },
    { id: "mixed_end", entries: [{ type: "hazard", kind: "meteor", offset: 320, lane: "mid" }, { type: "hazard", kind: "meteor", offset: 720, lane: "high" }, { type: "hazard", kind: "meteor", offset: 1180, lane: "low" }] }
  ],
  fever: [
    { id: "arc_gate", entries: [{ type: "coins", offset: 120, count: 7, value: 5, arc: true, lane: "mid" }, { type: "item", offset: 980, chance: 0.12 }] },
    { id: "step_low", entries: [{ type: "coins", offset: 110, count: 6, value: 5, lane: "low" }, { type: "hazard", role: "air", offset: 980, lane: "high" }] },
    { id: "air_over", entries: [{ type: "coins", offset: 190, count: 8, value: 5, arc: true, lane: "high" }, { type: "item", offset: 1080, chance: 0.1 }] },
    { id: "laser_gap", entries: [{ type: "coins", offset: 150, count: 6, value: 10, lane: "high" }, { type: "hazard", role: "ground", offset: 1060 }] },
    { id: "double_ground", entries: [{ type: "coins", offset: 130, count: 8, value: 5, lane: "mid" }, { type: "hazard", role: "air", offset: 1020, lane: "mid" }] },
    { id: "fall_lane", entries: [{ type: "coins", offset: 90, count: 7, value: 5, lane: "low" }, { type: "hazard", role: "fall", offset: 980, lane: "high" }] },
    { id: "reward_thread", entries: [{ type: "coins", offset: 100, count: 10, value: 5, lane: "mid", rareChance: 0.045 }, { type: "item", offset: 1180, chance: 0.16 }] },
    { id: "stagger_wall", entries: [{ type: "coins", offset: 160, count: 7, value: 5, arc: true, lane: "high" }, { type: "hazard", role: "ground", offset: 1080 }] },
    { id: "high_low", entries: [{ type: "coins", offset: 120, count: 8, value: 5, lane: "high" }, { type: "hazard", role: "air", offset: 1040, lane: "low" }] },
    { id: "mixed_end", entries: [{ type: "coins", offset: 160, count: 8, value: 10, arc: true, lane: "mid" }, { type: "item", offset: 1220, chance: 0.12 }] }
  ],
  gravity: [
    { id: "arc_gate", entries: [{ type: "coins", offset: 130, count: 8, arc: true, lane: "high" }, { type: "hazard", role: "air", offset: 960, lane: "mid" }] },
    { id: "step_low", entries: [{ type: "coins", offset: 160, count: 7, lane: "high" }, { type: "hazard", role: "tall", offset: 900, lane: "high" }] },
    { id: "air_over", entries: [{ type: "hazard", role: "air", offset: 280, lane: "low" }, { type: "coins", offset: 560, count: 8, arc: true, lane: "high" }] },
    { id: "laser_gap", entries: [{ type: "coins", offset: 140, count: 6, lane: "high" }, { type: "hazard", role: "fall", offset: 840, lane: "high" }] },
    { id: "double_ground", entries: [{ type: "coins", offset: 130, count: 7, arc: true, lane: "high" }, { type: "hazard", role: "air", offset: 1020, lane: "high" }] },
    { id: "fall_lane", entries: [{ type: "hazard", role: "fall", offset: 360, lane: "high" }, { type: "coins", offset: 700, count: 7, lane: "high" }] },
    { id: "reward_thread", entries: [{ type: "coins", offset: 120, count: 9, lane: "high", rareChance: 0.035 }, { type: "item", offset: 1080, chance: 0.12 }] },
    { id: "stagger_wall", entries: [{ type: "hazard", role: "tall", offset: 330, lane: "high" }, { type: "coins", offset: 760, count: 8, arc: true, lane: "high" }] },
    { id: "high_low", entries: [{ type: "coins", offset: 120, count: 7, lane: "high" }, { type: "hazard", role: "air", offset: 920, lane: "mid" }] },
    { id: "mixed_end", entries: [{ type: "hazard", role: "fall", offset: 290, lane: "mid" }, { type: "coins", offset: 760, count: 8, arc: true, lane: "high" }] }
  ],
  clearPath: [
    { id: "arc_gate", entries: [{ type: "coins", offset: 100, count: 10, arc: true, lane: "mid" }, { type: "item", offset: 1040, chance: 0.1 }] },
    { id: "step_low", entries: [{ type: "coins", offset: 110, count: 9, lane: "low" }, { type: "coins", offset: 620, count: 7, arc: true, lane: "mid" }] },
    { id: "air_over", entries: [{ type: "coins", offset: 140, count: 9, arc: true, lane: "high" }, { type: "item", offset: 1100, chance: 0.12 }] },
    { id: "laser_gap", entries: [{ type: "coins", offset: 120, count: 8, lane: "high" }, { type: "coins", offset: 700, count: 8, lane: "low" }] },
    { id: "double_ground", entries: [{ type: "coins", offset: 100, count: 10, lane: "mid" }, { type: "item", offset: 1160, chance: 0.1 }] },
    { id: "fall_lane", entries: [{ type: "coins", offset: 120, count: 8, lane: "low" }, { type: "coins", offset: 650, count: 8, arc: true, lane: "high" }] },
    { id: "reward_thread", entries: [{ type: "coins", offset: 90, count: 12, lane: "mid", rareChance: 0.045 }, { type: "item", offset: 980, chance: 0.16 }] },
    { id: "stagger_wall", entries: [{ type: "coins", offset: 130, count: 8, arc: true, lane: "mid" }, { type: "coins", offset: 820, count: 7, lane: "high" }] },
    { id: "high_low", entries: [{ type: "coins", offset: 100, count: 8, lane: "high" }, { type: "coins", offset: 560, count: 8, lane: "low" }] },
    { id: "mixed_end", entries: [{ type: "coins", offset: 120, count: 10, arc: true, lane: "mid" }, { type: "item", offset: 1240, chance: 0.12 }] }
  ],
  coin3: [
    { id: "arc_gate", entries: [{ type: "coins", offset: 120, count: 7, value: 5, arc: true, lane: "mid" }, { type: "coins", offset: 820, count: 5, value: 10, lane: "high" }] },
    { id: "step_low", entries: [{ type: "coins", offset: 110, count: 6, value: 5, lane: "low" }, { type: "coins", offset: 620, count: 6, value: 10, arc: true, lane: "mid" }] },
    { id: "air_over", entries: [{ type: "coins", offset: 160, count: 7, value: 5, arc: true, lane: "high" }, { type: "coins", offset: 900, count: 5, value: 10, lane: "mid" }] },
    { id: "laser_gap", entries: [{ type: "coins", offset: 90, count: 5, value: 10, lane: "high" }, { type: "coins", offset: 760, count: 6, value: 5, lane: "low" }] },
    { id: "double_ground", entries: [{ type: "coins", offset: 130, count: 7, value: 5, lane: "mid" }, { type: "coins", offset: 890, count: 5, value: 10, arc: true, lane: "high" }] },
    { id: "fall_lane", entries: [{ type: "coins", offset: 100, count: 6, value: 5, lane: "low" }, { type: "coins", offset: 780, count: 6, value: 10, arc: true, lane: "high" }] },
    { id: "reward_thread", entries: [{ type: "coins", offset: 90, count: 9, value: 10, lane: "mid", rareChance: 0.04 }, { type: "item", offset: 1160, chance: 0.08 }] },
    { id: "stagger_wall", entries: [{ type: "coins", offset: 140, count: 6, value: 5, arc: true, lane: "high" }, { type: "coins", offset: 860, count: 6, value: 10, lane: "low" }] },
    { id: "high_low", entries: [{ type: "coins", offset: 110, count: 6, value: 10, lane: "high" }, { type: "coins", offset: 580, count: 7, value: 5, arc: true, lane: "low" }] },
    { id: "mixed_end", entries: [{ type: "coins", offset: 140, count: 7, value: 5, lane: "mid" }, { type: "coins", offset: 920, count: 5, value: 10, arc: true, lane: "high" }] }
  ]
};

function spawnSegment(stats) {
  const index = areaIndex();
  const area = areas[index] || currentArea();
  const baseX = canvasWidth + 70;
  const pattern = pickRunPattern(index);
  spawnRunPattern(pattern, baseX, area, index);
  spawnEventPattern(run.event, pattern, baseX, area, index);
  startTasAutoReplayForScenario(tasRunPatternScenarioId(index, pattern, run.event));
}

function runPatternSpawnDelay(speedMeters) {
  return Math.max(0.25, RUN_PATTERN_LENGTH_METERS / Math.max(1, speedMeters || 1));
}

function areaRunPatterns(index) {
  return RUN_PATTERN_TEMPLATES.map((template, templateIndex) => ({
    ...template,
    areaIndex: index,
    templateIndex,
    key: `${index}:${template.id}`
  }));
}

function pickRunPattern(index) {
  const patterns = areaRunPatterns(index);
  const candidates = patterns.length > 1
    ? patterns.filter((pattern) => pattern.key !== run.lastPatternKey)
    : patterns;
  const pattern = candidates[randomInt(0, candidates.length - 1)] || patterns[0];
  run.lastPatternKey = pattern.key;
  return pattern;
}

function spawnRunPattern(pattern, baseX, area, index) {
  const clearPath = run.event === "clearPath";
  for (const entry of pattern.entries) {
    const jitter = entry.jitter || 0;
    const x = baseX + entry.offset + random(-jitter, jitter);
    spawnPatternEntry(entry, x, area, index, pattern.templateIndex + Math.floor(entry.offset / 100), { clearPath });
  }
}

function spawnEventPattern(event, pattern, baseX, area, index) {
  const eventPatterns = areaEventPatterns(event, index);
  if (!eventPatterns.length) return;
  const eventPattern = eventPatterns[pattern.templateIndex % eventPatterns.length];
  for (const entry of eventPattern.entries) {
    const jitter = entry.jitter || 0;
    const x = baseX + entry.offset + random(-jitter, jitter);
    const eventEntry = event === "meteor" && entry.kind === "meteor"
      ? { ...entry, airObstacle: true, vx: 0, vy: 0, gravity: 0 }
      : entry;
    spawnPatternEntry(eventEntry, x, area, index, pattern.templateIndex + Math.floor(entry.offset / 100), { clearPath: false });
  }
}

function areaEventPatterns(event, index) {
  const templates = RUN_EVENT_PATTERN_TEMPLATES[event] || [];
  return templates.map((template, templateIndex) => ({
    ...template,
    areaIndex: index,
    event,
    templateIndex,
    key: `${index}:${event}:${template.id}`
  }));
}

function spawnPatternEntry(entry, x, area, index, seed, options = {}) {
  if (entry.type === "coins") {
    spawnPatternCoinLine(x, entry);
  } else if (entry.type === "hazard" && !options.clearPath) {
    const kind = entry.kind || resolvePatternHazardKind(entry.role, index, seed);
    spawnPatternHazard(kind, x, area, index, entry);
  } else if (entry.type === "item") {
    const itemChance = Math.min(0.45, (entry.chance || 0.08) + effectiveUpgradeLevel("item") * 0.004);
    if (rng() < itemChance) spawnItem(x);
  }
}

function resolvePatternHazardKind(role, index, seed = 0) {
  const theme = AREA_PATTERN_HAZARDS[index] || AREA_PATTERN_HAZARDS[AREA_PATTERN_HAZARDS.length - 1];
  const choices = theme[role] || theme.ground || ["crate"];
  return choices[Math.abs(seed) % choices.length];
}

function spawnPatternCoinLine(startX, entry = {}) {
  const value = entry.value !== undefined ? entry.value : weightedPick([
    { value: 1, weight: 58 },
    { value: 5, weight: 25 },
    { value: 10, weight: 12 },
    { value: 50, weight: 4 },
    { value: 100, weight: 1 }
  ]);
  const count = entry.count || randomInt(4, 7);
  const spacing = entry.spacing || 38;
  for (let i = 0; i < count; i++) {
    const y = entry.arc
      ? coinArcY(i, count, entry.lane, entry.arcHeight)
      : coinLaneY(entry.lane) + random(-10, 10);
    objects.push({
      type: "coin",
      x: startX + i * spacing,
      y,
      w: 20,
      h: 20,
      value,
      spin: rng() * Math.PI
    });
  }

  const rareChance = (entry.rareChance ?? 0.015) + state.permanent.rarity * 0.008;
  if (rng() < rareChance) {
    objects.push({
      type: "rare",
      kind: weightedPick([
        { value: "rainbow", weight: 72 },
        { value: "diamond", weight: 21 },
        { value: "gem", weight: 7 }
      ]),
      x: startX + count * spacing + 18,
      y: coinLaneY("high") + random(-12, 20),
      w: 24,
      h: 24
    });
  }
}

function coinLaneY(lane = "mid") {
  if (lane === "high") return groundY - 175;
  if (lane === "low") return groundY - 78;
  return groundY - 125;
}

function coinArcY(i, count, lane = "mid", arcHeight = 72) {
  const progress = count <= 1 ? 0 : i / (count - 1);
  return coinLaneY(lane) - Math.sin(progress * Math.PI) * arcHeight;
}

function hazardAirY(lane = "mid") {
  if (lane === "high") return groundY - 178;
  if (lane === "low") return groundY - 98;
  return groundY - 138;
}

function spawnPatternHazard(kind, x, area, index, entry = {}) {
  const plannedVx = plannedHazardVx(kind, entry);
  if (!canSpawnHazardAt(x, entry.gap || HAZARD_MIN_GAP, {
    vx: plannedVx,
    safeRadius: gravityLandingSafeRadiusFor(kind)
  })) return false;

  if (kind === "slime" || kind === "bird" || kind === "bomb") {
    const airborne = kind === "bird";
    const sizeBoost = Math.min(10, index * 1.2);
    objects.push(applyEnemyTraits({
      type: "enemy",
      kind,
      x,
      y: airborne ? hazardAirY(entry.lane) : groundY - (kind === "bomb" ? 40 : 38) - sizeBoost * 0.35,
      w: airborne ? 42 + sizeBoost * 0.4 : 40 + sizeBoost * 0.35,
      h: airborne ? 28 + sizeBoost * 0.25 : (kind === "bomb" ? 40 : 38) + sizeBoost * 0.35,
      color: kind === "bird" ? area.accent : kind === "bomb" ? "#30333c" : "#75d05e"
    }, index));
    tagLatestHazardForGuide(kind);
    return true;
  }

  if (kind === "laser") {
    const height = entry.lane === "high" ? 92 : 78;
    objects.push({
      type: "obstacle",
      kind,
      x,
      y: groundY - height - (entry.lane === "high" ? 18 : 40),
      w: 24,
      h: height,
      color: "#ef6b65"
    });
    tagLatestHazardForGuide(kind);
    return true;
  }

  if (kind === "meteor") {
    const airObstacle = Boolean(entry.airObstacle);
    objects.push({
      type: "obstacle",
      kind,
      x,
      y: airObstacle ? hazardAirY(entry.lane) : hazardAirY(entry.lane) - random(35, 85),
      w: 34,
      h: 34,
      vx: entry.vx ?? (airObstacle ? 0 : -random(25, 55)),
      vy: entry.vy ?? (airObstacle ? 0 : random(90, 130)),
      gravity: entry.gravity ?? (airObstacle ? 0 : random(65, 95)),
      color: entry.color || area.accent
    });
    tagLatestHazardForGuide(kind);
    return true;
  }

  const isSlideBlock = entry.role === "block";
  const height = kind === "spike" ? 42 : isSlideBlock ? 24 : randomInt(46, 70);
  objects.push({
    type: "obstacle",
    kind,
    x,
    y: isSlideBlock ? groundY - 56 : groundY - height,
    w: kind === "spike" ? 48 : 44,
    h: height,
    color: area.obstacle
  });
  tagLatestHazardForGuide(kind);
  return true;
}

function plannedHazardVx(kind, entry = {}) {
  if (entry.vx !== undefined) return entry.vx;
  if (kind === "meteor" && !entry.airObstacle) return -40;
  return 0;
}

function gravityLandingSafeRadiusFor(kind) {
  const hazardWidth = {
    laser: 46,
    bird: 54,
    meteor: 48,
    spike: 56,
    crate: 54,
    slime: 50,
    bomb: 50
  }[kind] || 52;
  return Math.max(GRAVITY_LANDING_SAFE_RADIUS, player.w + hazardWidth + 72);
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
      spin: rng() * Math.PI
    });
  }

  if (rng() < 0.025 + state.permanent.rarity * 0.01) {
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
  if (!canSpawnHazardAt(x)) return false;
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
    tagLatestHazardForGuide(kind);
    return true;
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
    tagLatestHazardForGuide(kind);
    return true;
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
  tagLatestHazardForGuide(kind);
  return true;
}

function canSpawnHazardAt(x, gap = HAZARD_MIN_GAP, options = {}) {
  if (isGravityLandingSpawnBlocked(x, options.vx || 0, options.safeRadius || GRAVITY_LANDING_SAFE_RADIUS)) return false;
  const conflicts = new Set(objects.filter((obj) => isHazardObject(obj) && Math.abs(obj.x - x) < gap));
  if (conflicts.size > 0) {
    objects = objects.filter((obj) => !conflicts.has(obj));
  }
  return true;
}

function isGravityLandingSpawnBlocked(x, hazardVx = 0, radius = GRAVITY_LANDING_SAFE_RADIUS) {
  const prediction = predictGravityLanding();
  if (!prediction) return false;
  const blockedSpawnX = player.x + (prediction.scrollSpeed - hazardVx) * prediction.timeToLanding;
  return Math.abs(x - blockedSpawnX) < radius;
}

function predictGravityLanding() {
  const duringGravityEvent = run.event === "gravity" && run.gravityFlip && run.eventTimer > 0;
  const guardingLanding = run.gravityLandingGuard && !run.gravityFlip;
  if (!duringGravityEvent && !guardingLanding) return null;

  const targetY = groundY - getPlayerHeight();
  let forecastY = player.y;
  let forecastVy = player.vy;
  let timeToLanding = 0;

  if (duringGravityEvent) {
    const timeUntilFlipEnds = Math.max(0, run.eventTimer);
    const timeToCeiling = solveTimeToY(forecastY, forecastVy, -PLAYER_GRAVITY, PLAYER_CEILING_Y);
    if (timeToCeiling !== null && timeToCeiling <= timeUntilFlipEnds) {
      forecastY = PLAYER_CEILING_Y;
      forecastVy = 0;
    } else {
      forecastY += forecastVy * timeUntilFlipEnds - 0.5 * PLAYER_GRAVITY * timeUntilFlipEnds * timeUntilFlipEnds;
      forecastVy -= PLAYER_GRAVITY * timeUntilFlipEnds;
    }
    timeToLanding += timeUntilFlipEnds;
  }

  if (forecastY >= targetY - 1) return null;
  const fallTime = solveTimeToY(forecastY, forecastVy, PLAYER_GRAVITY, targetY);
  if (fallTime === null) return null;
  timeToLanding += fallTime;
  if (timeToLanding <= 0 || timeToLanding > 20) return null;

  return {
    timeToLanding,
    scrollSpeed: currentRunScrollSpeedPixels()
  };
}

function solveTimeToY(y, vy, acceleration, targetY) {
  const a = 0.5 * acceleration;
  const b = vy;
  const c = y - targetY;
  const epsilon = 0.0001;
  if (Math.abs(a) < epsilon) {
    if (Math.abs(b) < epsilon) return null;
    const time = -c / b;
    return time >= 0 ? time : null;
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  const times = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter((time) => time >= 0);
  if (!times.length) return null;
  return Math.min(...times);
}

function currentRunScrollSpeedPixels() {
  if (run.bossBattle || run.timeStop > 0) return 0;
  const stats = getStats();
  const dashMult = run.dashTimer > 0 ? 1.9 : 1;
  const eventSpeed = run.event === "fever" ? 1.25 : 1;
  const chillMult = run.chillTimer > 0 ? 0.78 : 1;
  return stats.speed * dashMult * eventSpeed * chillMult * 48;
}

function shouldGuardGravityLanding() {
  const targetY = groundY - getPlayerHeight();
  return player.y < targetY - 2 || Math.abs(player.vy) > 10;
}

function isHazardObject(obj) {
  return obj.type === "obstacle" || obj.type === "enemy" || obj.type === "boss";
}

function applyEnemyTraits(obj, index) {
  const trait = areaEnemyTraits[index]?.id || "plain";
  const complexity = areaEnemyTraits[index]?.complexity || 0;
  obj.areaIndex = index;
  obj.trait = trait;
  obj.traitComplexity = complexity;
  obj.hitCooldown = obj.hitCooldown || 0;
  if (trait === "sandArmor") {
    obj.armor = obj.type === "boss" ? 2 : 1;
    obj.lastTraitArmor = obj.armor;
    obj.armorReformCharges = obj.type === "boss" ? 2 : 1;
    obj.armorReformTimer = 0;
  }
  if (trait === "frostAura") {
    obj.frostPulseTimer = deterministicTraitRange(obj, index, 1.25, 2.15);
  }
  if (trait === "burning") {
    obj.burningPulseTimer = deterministicTraitRange(obj, index, 1.1, 2.05);
  }
  if (trait === "energyShield") {
    obj.shield = obj.type === "boss" ? 2 : 1;
    obj.lastTraitShield = obj.shield;
    obj.shieldRechargeCharges = obj.type === "boss" ? 3 : 1;
    obj.shieldRechargeTimer = 0;
  }
  if (trait === "gravityPulse") {
    obj.pulseTimer = deterministicTraitRange(obj, index, 1.2, 2.8);
  }
  if (trait === "voidPull") {
    obj.voidPolarity = deterministicTraitRange(obj, index, 0, 1) >= 0.5 ? 1 : -1;
    obj.voidPolarityTimer = deterministicTraitRange(obj, index, 1.1, 2.2);
  }
  if (trait === "regen") {
    obj.hp = obj.hp || (obj.type === "boss" ? obj.maxHp : 2);
    obj.maxHp = Math.max(obj.maxHp || obj.hp, obj.hp);
    obj.regenTimer = 1.5;
  }
  if (trait === "phase") {
    obj.phaseTimer = deterministicTraitRange(obj, index, 0, Math.PI * 2);
    obj.phased = false;
    obj.phaseEchoCooldown = 0;
  }
  return obj;
}

function deterministicTraitRange(obj, index, min, max) {
  const xBucket = Math.max(0, Math.round((obj.x || 0) / 24));
  const yBucket = Math.max(0, Math.round((obj.y || 0) / 24));
  const pattern = run.bossPatternIndex || 0;
  const volley = run.bossVolley || 0;
  const kindCode = String(obj.kind || obj.type || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const slot = (index * 13 + pattern * 7 + volley * 5 + xBucket * 3 + yBucket + kindCode) % 11;
  return min + (max - min) * (slot / 10);
}

function spawnChest(x) {
  const chestType = pickChestType();
  objects.push({
    type: "chest",
    chestType,
    x,
    y: groundY - 34,
    w: 40,
    h: 32
  });
}

function pickChestType() {
  const qualityBonus = state.permanent.rarity * 0.001;
  return weightedPick(Object.entries(chestDefs).map(([value, def]) => {
    const rank = ["wood", "silver", "gold", "rainbow", "god"].indexOf(value);
    const bonus = rank > 0 ? 1 + qualityBonus * rank : 1;
    return { value, weight: def.weight * bonus };
  }));
}

function spawnItem(x) {
  if (objects.some((obj) => obj.type === "item" && Math.abs(obj.x - x) < ITEM_MIN_GAP)) return false;
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
  tagLatestItemForGuide(kind);
  return true;
}

function spawnBoss(index = areaIndex(), options = {}) {
  const area = areas[index] || currentArea();
  const hp = 3 + index + Math.floor(run.distance / 10000);
  const boss = applyEnemyTraits({
    type: "boss",
    kind: bossName(index),
    x: options.x ?? canvasWidth + 160,
    y: groundY - 100,
    w: 92,
    h: 100,
    hp: options.hp ?? hp,
    maxHp: options.hp ?? hp,
    color: area.accent,
    areaIndex: index,
    bossGimmick: bossGimmicks[index]?.id || "slimeSplit",
    bossTimer: 1.8,
    hitCooldown: 0,
    finalBoss: Boolean(options.finalBoss),
    soulMode: bossSoulModeForArea(index),
    chargePhase: "approach",
    attackPattern: 0,
    attackVolley: 0,
    vulnerable: false
  }, index);
  objects.push(boss);
  logEvent(`BOSS ${bossName(index).toUpperCase()}`);
  return boss;
}

function startAreaBossBattle(index) {
  if (run.bossBattle || isAreaBossCleared(index)) return;
  run.dashCooldown = 0;
  run.activeSkillCooldowns = {};
  run.bossBattle = true;
  run.bossAreaIndex = index;
  run.bossAttackTimer = 0.7;
  run.bossChargeTimer = finalBossAttackDuration(index);
  run.bossRetreating = true;
  run.bossPhase = "attack";
  run.bossPatternIndex = 0;
  run.bossVolley = 0;
  run.bossSoulMode = bossSoulModeForArea(index);
  run.bossModeTimer = 0;
  run.bossModePulse = 0.85;
  run.bossResearchCounters = {};
  run.bossResearchRequired = requiredResearchDefsForArea(index).map((def) => def.id);
  run.bossResearchScheduled = {};
  run.bossResearchPassed = {};
  run.bossResearchUsage = {};
  run.lastBossResearchAudit = null;
  run.webLane = 1;
  run.justiceCooldown = 0;
  run.echoActive = false;
  run.event = null;
  run.eventTimer = 0;
  run.gravityFlip = false;
  run.gravityLandingGuard = false;
  run.nextSpawn = 999;
  objects = [];
  const hp = finalBossHitPoints(index);
  const boss = spawnBoss(index, { finalBoss: true, x: canvasWidth - 170, hp });
  spawnBossResearchTrialsForPattern(boss, index, run.bossPatternIndex);
  if (tasState.autoEnabled) tasState.autoTracks = [];
  startTasAutoReplayForScenario(tasBossScenarioId(index, "attack", run.bossPatternIndex));
  restartPlayerAnimation("running");
  logEvent(`AREA BOSS ${bossName(index).toUpperCase()}`);
  maybeExplainBoss(index);
}

function finalBossHitPoints(index) {
  return FINAL_BOSS_HIT_POINT_TARGETS[index] || FINAL_BOSS_HIT_POINT_TARGETS[FINAL_BOSS_HIT_POINT_TARGETS.length - 1];
}

function updateBossBattle(dt) {
  const boss = objects.find((obj) => obj.type === "boss" && obj.finalBoss);
  if (!boss) {
    run.bossBattle = false;
    return;
  }
  const index = boss.areaIndex || 0;
  const anchorX = canvasWidth - 170;
  const vulnerable = run.bossPhase === "vulnerable";
  boss.vulnerable = vulnerable;
  boss.attackPattern = run.bossPatternIndex % FINAL_BOSS_ATTACK_PATTERNS;
  updateBossSoulMode(boss, dt);

  run.bossChargeTimer -= dt;
  if (vulnerable) {
    if (!boss.vx) boss.vx = finalBossApproachVelocity(boss, index);
    boss.y = finalBossVulnerableY(boss) - Math.abs(Math.sin(gameNow() / 460)) * 3;
    const playerRect = getPlayerRect();
    const passedPlayer = boss.x + boss.w < playerRect.x - 16;
    if (run.bossChargeTimer <= 0 || passedPlayer) {
      switchBossPhase(boss, "attack");
    }
    return;
  }

  boss.vx = 0;
  boss.x += (anchorX - boss.x) * Math.min(1, dt * 2.2);
  boss.y = groundY - boss.h - Math.abs(Math.sin(gameNow() / 560)) * 13;

  run.bossAttackTimer -= dt;
  if (run.bossChargeTimer > 0 && run.bossAttackTimer <= 0) {
    spawnBossAttack(boss);
    run.bossAttackTimer = finalBossAttackInterval(index, boss.attackPattern);
  }
  if (run.bossChargeTimer <= 0 && bossAttackTailPassedPlayer()) {
    switchBossPhase(boss, "vulnerable");
  }
}

function switchBossPhase(boss, phase) {
  const index = boss.areaIndex || 0;
  const mode = activeBossSoulMode();
  run.bossPhase = phase;
  run.bossRetreating = phase === "attack";
  run.bossVolley = 0;
  boss.attackVolley = 0;
  boss.bossTimer = 0.8;
  boss.vulnerable = phase === "vulnerable";
  boss.phased = false;
  boss.vx = 0;
  boss.vy = 0;
  boss.gravity = 0;
  if (tasState.autoEnabled) tasState.autoTracks = [];
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.slideHolding = false;
  player.slideTimer = 0;
  player.jumpsUsed = 0;
  resetBossSoulModeMovement(mode);
  if (phase === "attack") {
    clearBossAttackObjects();
    boss.x = canvasWidth - 170;
    boss.y = groundY - boss.h;
    run.bossPatternIndex = (run.bossPatternIndex + 1) % FINAL_BOSS_ATTACK_PATTERNS;
    boss.attackPattern = run.bossPatternIndex;
    run.bossModePulse = 0.85;
    run.bossChargeTimer = finalBossAttackDuration(index);
    run.bossAttackTimer = 0.7;
    spawnBossResearchTrialsForPattern(boss, index, run.bossPatternIndex);
    logEvent(`${bossName(index).toUpperCase()} PATTERN ${boss.attackPattern + 1}`);
    startTasAutoReplayForScenario(tasBossScenarioId(index, "attack", run.bossPatternIndex));
  } else {
    clearBossAttackObjects();
    run.bossModePulse = 0.4;
    run.bossChargeTimer = finalBossVulnerableDuration(index);
    run.bossAttackTimer = 99;
    boss.x = finalBossApproachStartX(boss);
    boss.y = finalBossVulnerableY(boss);
    boss.vx = finalBossApproachVelocity(boss, index);
    burst(boss.x + boss.w / 2, boss.y + 12, boss.color, 12);
    logEvent("BOSS OPEN");
    startTasAutoReplayForScenario(tasBossScenarioId(index, "vulnerable", run.bossPatternIndex));
  }
}

function updateBossSoulMode(boss, dt) {
  const mode = activeBossSoulMode();
  run.bossSoulMode = mode;
  run.bossModeTimer += dt;
  run.echoActive = mode === "dual" && run.bossPhase === "attack";
  if (run.justiceCooldown > 0) run.justiceCooldown -= dt;

  if (mode !== "purple") {
    run.webLane = 1;
  }

  if (mode === "blue" && run.bossPhase === "attack" && run.bossChargeTimer > 0) {
    run.bossModePulse -= dt;
    if (run.bossModePulse <= 0) {
      run.gravityFlip = !run.gravityFlip;
      player.vy *= -0.25;
      run.bossModePulse = 1.45;
      logEvent("BLUE GRAVITY SHIFT");
    }
  }

  if (mode === "purple" && run.bossPhase === "attack") {
    boss.phased = false;
  }
}

function finalBossAttackDuration(index) {
  return Math.max(2.2, 3.05 + index * 0.1);
}

function finalBossVulnerableDuration(index) {
  return Math.max(1.65, 2.05 - index * 0.03);
}

function finalBossAttackInterval(index, pattern) {
  if (index === 0 && pattern === 2) return 1.28;
  if (index === 1 && pattern === 2) return 1.55;
  return Math.max(0.58, 1.02 - index * 0.025 - pattern * 0.03);
}

function finalBossApproachStartX(boss) {
  return Math.max(boss.x, canvasWidth - 170, player.x + 260);
}

function finalBossApproachEndX(boss) {
  return player.x - boss.w - 62;
}

function finalBossApproachVelocity(boss, index) {
  const duration = Math.max(1.1, finalBossVulnerableDuration(index));
  const distance = Math.max(220, finalBossApproachStartX(boss) - finalBossApproachEndX(boss));
  return -distance / duration;
}

function bossAttackTailPassedPlayer() {
  const passX = getPlayerRect().x - 8;
  return !objects.some((obj) => {
    if (!obj.bossAttack) return false;
    if (obj.type === "boss" || obj.type === "playerShot") return false;
    const right = (obj.x || 0) + (obj.w || 0);
    return right >= passX;
  });
}

function clearBossAttackObjects() {
  objects = objects.filter((obj) => obj.type === "boss" || !obj.bossAttack);
}

function resetBossSoulModeMovement(mode) {
  run.echoActive = false;
  run.gravityFlip = false;
  run.gravityLandingGuard = false;
  run.webLane = 1;
  player.y = groundY - getPlayerHeight();
  player.vy = 0;
  player.jumpsUsed = 0;
  player.slideTimer = 0;
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.slideHolding = false;
}

function finalBossVulnerableY(boss) {
  return groundY - finalBossVulnerableHeight(boss);
}

function finalBossVulnerableHeight(boss) {
  return Math.min(boss.h, 72);
}

function spawnBossAttack(boss) {
  const index = boss.areaIndex || 0;
  const pattern = boss.attackPattern || 0;
  const volley = boss.attackVolley || 0;
  boss.attackVolley = volley + 1;
  run.bossVolley = boss.attackVolley;
  spawnFinalBossPattern(boss, index, pattern, volley);
}

function spawnFinalBossPattern(boss, index, pattern, volley) {
  if (index === 0) spawnSlimeKingPattern(boss, pattern, volley);
  else if (index === 1) spawnSandWyrmPattern(boss, pattern, volley);
  else if (index === 2) spawnFrostCorePattern(boss, pattern, volley);
  else if (index === 3) spawnLavaGolemPattern(boss, pattern, volley);
  else if (index === 4) spawnGiantRobotPattern(boss, pattern, volley);
  else if (index === 5) spawnStarDragonPattern(boss, pattern, volley);
  else if (index === 6) spawnVoidEnginePattern(boss, pattern, volley);
  else if (index === 7) spawnAetherLordPattern(boss, pattern, volley);
  else spawnInfinityGatePattern(boss, pattern, volley);
}

function requiredResearchDefsForArea(index) {
  const safeIndex = Math.max(0, Math.min(areas.length - 1, Number(index) || 0));
  return researchDefs.filter((def) => Number.isFinite(def.sourceAreaIndex) && def.sourceAreaIndex < safeIndex);
}

function researchTrialPattern(def) {
  if (def.id === "sandBreaker") return 0;
  if (def.id === "gravityAnchor") return 1;
  if (def.id === "phaseAnchor") return 2;
  return Math.max(0, Number(def.sourceAreaIndex || 0)) % FINAL_BOSS_ATTACK_PATTERNS;
}

function spawnBossResearchTrialsForPattern(boss, index, pattern) {
  if (!boss?.finalBoss || index <= 0) return;
  run.bossResearchRequired = run.bossResearchRequired?.length
    ? run.bossResearchRequired
    : requiredResearchDefsForArea(index).map((def) => def.id);
  run.bossResearchScheduled = run.bossResearchScheduled || {};
  const trials = requiredResearchDefsForArea(index).filter((def) => (
    researchTrialPattern(def) === pattern && !run.bossResearchScheduled[def.id]
  ));
  trials.forEach((def, order) => {
    run.bossResearchScheduled[def.id] = true;
    const gate = {
      type: "obstacle",
      kind: "researchGate",
      researchTrialId: def.id,
      researchTrialActive: Boolean(def.active),
      researchTrialResolved: false,
      researchTrialGuidePending: !state.tutorial?.seenResearchTrials?.[def.id],
      bossAttack: true,
      x: canvasWidth + 26 + order * 196,
      y: -64,
      w: RESEARCH_TRIAL_GATE_WIDTH,
      h: canvasHeight + 128,
      vx: -(RESEARCH_TRIAL_GATE_SPEED + index * 4),
      color: researchTrialColor(def.id),
      attackVolley: -1
    };
    objects.push(gate);
  });
  if (trials.length > 0) logEvent(`RESEARCH TRIAL: ${trials.map((def) => def.name).join(" / ")}`);
}

function researchTrialColor(id) {
  return {
    sandBreaker: "#d7b878",
    frostInsulation: "#9fd9ff",
    heatPlating: "#ff8b38",
    shieldPiercer: "#48bde7",
    gravityAnchor: "#b98cff",
    voidTether: "#8d73d6",
    aetherSeal: "#fff1a5",
    phaseAnchor: "#8fffc6"
  }[id] || "#eef3f7";
}

function researchTrialActivationRange(id, level = researchLevel(id)) {
  if (id === "sandBreaker") return sandBreakerRange(level);
  return 206 + Math.min(12, Math.max(0, Number(level || 0))) * 4;
}

function hasResolvableActiveResearchTrial(id) {
  const range = researchTrialActivationRange(id);
  const playerCenterX = player.x + player.w / 2;
  return objects.some((obj) => {
    if (obj.kind !== "researchGate" || obj.researchTrialResolved || obj.researchTrialId !== id) return false;
    const gateCenterX = obj.x + obj.w / 2;
    return gateCenterX >= playerCenterX - 12 && gateCenterX - playerCenterX <= range;
  });
}

function resolveActiveResearchTrials(id, range = researchTrialActivationRange(id)) {
  const playerCenterX = player.x + player.w / 2;
  let resolved = 0;
  for (const obj of objects) {
    if (obj.kind !== "researchGate" || obj.researchTrialResolved || obj.researchTrialId !== id) continue;
    const gateCenterX = obj.x + obj.w / 2;
    if (gateCenterX < playerCenterX - 12 || gateCenterX - playerCenterX > range) continue;
    obj.researchTrialResolved = true;
    obj.life = 0.12;
    obj.vx = 0;
    passBossResearchTrial(id);
    burst(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.color, 14);
    resolved += 1;
  }
  return resolved;
}

function passBossResearchTrial(id) {
  run.bossResearchPassed = run.bossResearchPassed || {};
  run.bossResearchPassed[id] = true;
  logEvent(`RESEARCH PASS: ${researchTrialName(id)}`);
}

function researchTrialName(id) {
  const def = researchDefs.find((entry) => entry.id === id);
  return def ? translateText(def.name) : id;
}

function handleResearchTrialCollision(obj, removed) {
  const id = obj.researchTrialId;
  if (obj.researchTrialResolved) {
    removed.add(obj);
    return true;
  }
  const def = researchDefs.find((entry) => entry.id === id);
  if (def && !def.active && researchLevel(id) > 0) {
    passBossResearchTrial(id);
    burst(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.color, 12);
    removed.add(obj);
    return true;
  }
  run.bossResearchPassed = run.bossResearchPassed || {};
  run.bossResearchPassed[id] = false;
  damagePlayer({ force: true, amount: 1, source: obj });
  logEvent(`RESEARCH FAILED: ${researchTrialName(id)}`);
  removed.add(obj);
  return true;
}

function bossSpeed(index, add = 0) {
  return -(165 + index * 14 + add);
}

function bossSpawnX(boss, offset = 0) {
  return boss.x + boss.w / 2 + offset;
}

const FINAL_BOSS_METEOR_AIM_PATTERNS = [
  { startAhead: 250, startHeight: 252, targetOffsetX: -34, targetRatio: 0.2, targetOffsetY: -44, travelAdjust: -0.08 },
  { startAhead: 320, startHeight: 304, targetOffsetX: -72, targetRatio: 0.55, targetOffsetY: -8, travelAdjust: 0.04 },
  { startAhead: 390, startHeight: 278, targetOffsetX: -48, targetRatio: 0.9, targetOffsetY: 26, travelAdjust: 0.1 },
  { startAhead: 285, startHeight: 318, targetOffsetX: -90, targetRatio: 0.35, targetOffsetY: 18, travelAdjust: -0.02 },
  { startAhead: 360, startHeight: 266, targetOffsetX: -26, targetRatio: 0.7, targetOffsetY: -28, travelAdjust: 0.07 },
  { startAhead: 415, startHeight: 292, targetOffsetX: -64, targetRatio: 0.45, targetOffsetY: 36, travelAdjust: -0.05 }
];

const FINAL_BOSS_GIMMICK_PATTERNS = {
  infinitePhaseBird: [
    { offset: 58, height: 126, speedAdd: 50 },
    { offset: 132, height: 184, speedAdd: 66 },
    { offset: 84, height: 152, speedAdd: 58 },
    { offset: 156, height: 112, speedAdd: 72 },
    { offset: 48, height: 174, speedAdd: 54 },
    { offset: 118, height: 138, speedAdd: 62 }
  ]
};

function addBossMeteor(boss, options = {}) {
  return addBossObstacle("meteor", boss, aimedBossMeteorOptions(boss, options));
}

function aimedBossMeteorOptions(boss, options = {}) {
  const index = boss.areaIndex || 0;
  const w = options.w || 34;
  const h = options.h || 34;
  const playerRect = getPlayerRect();
  const startOffset = options.startOffset || 0;
  const aim = finalBossMeteorAimPattern(boss, options);
  const startX = options.x ?? playerRect.x + playerRect.w + aim.startAhead + startOffset;
  const startY = options.y ?? Math.max(30, groundY - aim.startHeight);
  const targetX = options.targetX ?? playerRect.x + aim.targetOffsetX;
  const minTargetY = Math.max(46, playerRect.y - 58);
  const maxTargetY = Math.min(groundY - h * 0.5, playerRect.y + playerRect.h + 46);
  const rawTargetY = playerRect.y + playerRect.h * aim.targetRatio + aim.targetOffsetY;
  const targetY = options.targetY ?? Math.max(minTargetY, Math.min(Math.max(minTargetY + 1, maxTargetY), rawTargetY));
  const travelTime = options.travelTime ?? Math.max(0.82, 1.16 - index * 0.025 + aim.travelAdjust);
  const gravity = options.gravity ?? (112 + index * 7);
  const startCenterX = startX + w / 2;
  const startCenterY = startY + h / 2;
  const vx = (targetX - startCenterX) / travelTime;
  const vy = (targetY - startCenterY - 0.5 * gravity * travelTime * travelTime) / travelTime;
  return { ...options, x: startX, y: startY, w, h, vx, vy, gravity };
}

function finalBossMeteorAimPattern(boss, options = {}) {
  const salt = finalBossOptionSalt(options);
  return FINAL_BOSS_METEOR_AIM_PATTERNS[finalBossPatternIndex(boss, FINAL_BOSS_METEOR_AIM_PATTERNS.length, salt)];
}

function finalBossOptionSalt(options = {}) {
  return Math.abs(Math.round(
    (options.startOffset || 0) * 0.1
    + (options.w || 0) * 0.37
    + (options.h || 0) * 0.41
    + (options.gravity || 0) * 0.13
    + (options.travelTime || 0) * 17
  ));
}

function finalBossPatternIndex(boss, length, salt = 0) {
  const area = boss.areaIndex || 0;
  const pattern = boss.attackPattern || 0;
  const volley = Math.max(0, (boss.attackVolley || 1) - 1);
  return Math.abs(area * 17 + pattern * 7 + volley * 5 + salt) % length;
}

function nextFinalBossGimmickPattern(boss, key) {
  const sequence = FINAL_BOSS_GIMMICK_PATTERNS[key] || [];
  if (!sequence.length) return null;
  const counterKey = `${key}Counter`;
  const counter = boss[counterKey] || 0;
  boss[counterKey] = counter + 1;
  const area = boss.areaIndex || 0;
  const pattern = boss.attackPattern || 0;
  return sequence[(area + pattern * 2 + counter) % sequence.length];
}

function addBossObstacle(kind, boss, options = {}) {
  const obj = {
    type: "obstacle",
    kind,
    bossAttack: true,
    x: options.x ?? bossSpawnX(boss),
    y: options.y ?? groundY - (options.h || 42),
    w: options.w || 44,
    h: options.h || 42,
    vx: options.vx ?? bossSpeed(boss.areaIndex || 0),
    vy: options.vy || 0,
    gravity: options.gravity || 0,
    bounceOnGround: Boolean(options.bounceOnGround),
    bounceVelocity: options.bounceVelocity || 0,
    bounceFactor: options.bounceFactor ?? 0.72,
    color: options.color || boss.color,
    attackVolley: Math.max(0, (boss.attackVolley || 1) - 1)
  };
  applyBossSoulRule(obj, boss, options);
  applyBossWebLaneRule(obj, boss);
  objects.push(obj);
  tagLatestHazardForGuide(kind);
  return obj;
}

function addBossEnemy(kind, boss, options = {}) {
  const airborne = kind === "bird";
  const obj = applyEnemyTraits({
    type: "enemy",
    kind,
    bossAttack: true,
    x: options.x ?? bossSpawnX(boss),
    y: options.y ?? (airborne ? groundY - 150 : groundY - 38),
    w: options.w || (airborne ? 42 : 36),
    h: options.h || (airborne ? 28 : 36),
    vx: options.vx ?? bossSpeed(boss.areaIndex || 0, 12),
    vy: options.vy || 0,
    gravity: options.gravity || 0,
    bounceOnGround: Boolean(options.bounceOnGround),
    bounceVelocity: options.bounceVelocity || 0,
    bounceFactor: options.bounceFactor ?? 0.72,
    color: options.color || (kind === "slime" ? "#75d05e" : boss.color)
  }, boss.areaIndex || 0);
  applyBossSoulRule(obj, boss, options);
  applyBossWebLaneRule(obj, boss);
  objects.push(obj);
  tagLatestHazardForGuide(kind);
  return obj;
}

function applyBossSoulRule(obj, boss, options = {}) {
  if (options.ignoreSoulRule) {
    obj.soulMode = "normal";
    obj.soulRule = null;
    return;
  }
  const mode = activeBossSoulMode();
  obj.soulMode = mode;
  if (mode === "cyan") obj.soulRule = "patience";
  if (mode === "orange") obj.soulRule = "bravery";
  if (mode === "green") {
    obj.soulRule = "shield";
    obj.shieldLane = options.shieldLane || inferShieldLane(obj);
  }
  if (mode === "yellow") obj.shootable = true;
  if (mode === "dual") {
    obj.dualHazard = true;
    if (obj.kind === "laser") {
      obj.h = Math.min(obj.h || 28, 28);
      obj.y = (PLAYER_CEILING_Y + groundY) / 2 - obj.h / 2;
    }
  }
  if ((boss?.soulMode || run.bossSoulMode) === "rainbow") {
    obj.rainbowRule = mode;
  }
}

function applyBossWebLaneRule(obj, boss) {
  if (activeBossSoulMode() !== "purple") return;
  const offsetBucket = Math.abs(Math.round(((obj.x || 0) - (boss.x || 0)) / 52));
  const kindCode = String(obj.kind || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const volley = Math.max(0, Number(obj.attackVolley || 0));
  const safeLane = Math.abs((boss.attackPattern || 0) + volley) % 3;
  const blockedLanes = [0, 1, 2].filter((laneIndex) => laneIndex !== safeLane);
  const lane = blockedLanes[Math.abs(offsetBucket + kindCode) % blockedLanes.length];
  obj.webLane = lane;
  obj.h = Math.min(obj.h || 34, 34);
  obj.y = webLaneY(lane) + getPlayerHeight() / 2 - obj.h / 2;
  obj.vy = 0;
  obj.gravity = 0;
  obj.bounceOnGround = false;
}

function inferShieldLane(obj) {
  const centerY = obj.y + obj.h / 2;
  if (centerY < groundY - 125) return "high";
  if (centerY > groundY - 58) return "low";
  return "mid";
}

function spawnSlimeKingPattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossEnemy("slime", boss, { x: bossSpawnX(boss, volley % 2 ? 36 : 0), w: 34, h: 34, vx: bossSpeed(0, 8) });
    if (volley % 2 === 1) {
      addBossEnemy("slime", boss, {
        x: bossSpawnX(boss, 126),
        y: groundY - 150,
        w: 26,
        h: 26,
        vx: bossSpeed(0, -42),
        vy: -430,
        gravity: 540,
        bounceOnGround: true,
        bounceVelocity: 430,
        bounceFactor: 0.74,
        color: "#9be977"
      });
    }
  } else if (pattern === 1) {
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 0), w: 26, h: 40, color: "#75d05e", vx: bossSpeed(0, 38) });
    addBossEnemy("slime", boss, { x: bossSpawnX(boss, 64), w: 30, h: 30, vx: bossSpeed(0, 48) });
  } else {
    if (volley < 2) {
      addBossEnemy("bird", boss, { x: bossSpawnX(boss, 20), y: groundY - 132 - (volley % 2) * 28, vx: bossSpeed(0, 315), color: "#a8ee78" });
    }
    addBossEnemy("slime", boss, { x: bossSpawnX(boss, 220), w: 32, h: 32, vx: bossSpeed(0, 38) });
  }
}

function spawnSandWyrmPattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossObstacle("spike", boss, { x: bossSpawnX(boss), w: 52, h: 44, vx: bossSpeed(1, 18), color: "#d6a15c" });
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 105), w: 40, h: 34, vx: bossSpeed(1, 4), color: "#d6a15c" });
    addSandWyrmNormalHazard(boss, 156 + (volley % 2) * 26);
  } else if (pattern === 1) {
    addBossEnemy("bomb", boss, { x: bossSpawnX(boss), y: groundY - 38, vx: bossSpeed(1, 24), color: "#6b5640" });
    addBossObstacle("crate", boss, { x: bossSpawnX(boss, 120), w: 48, h: 60, vx: bossSpeed(1, 8), color: "#9c6a32" });
    addSandWyrmNormalHazard(boss, 178);
  } else {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 128, w: 24, h: 92, vx: bossSpeed(1, 20), color: "#f2b84b" });
    if (volley % 2 === 0) addBossObstacle("spike", boss, { x: bossSpawnX(boss, 108), w: 48, h: 42, vx: bossSpeed(1, 28), color: "#d6a15c" });
    addSandWyrmNormalHazard(boss, 348);
  }
}

function addSandWyrmNormalHazard(boss, offset) {
  addBossObstacle("spike", boss, {
    x: bossSpawnX(boss, offset),
    y: groundY - 36,
    w: 44,
    h: 36,
    vx: bossSpeed(1, 56),
    color: "#5f3c24",
    ignoreSoulRule: true
  });
}

function spawnFrostCorePattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossMeteor(boss, { w: 30, h: 34, color: "#9fd9ff", startOffset: volley % 2 ? 70 : 0 });
    addBossMeteor(boss, { w: 30, h: 34, color: "#d9f6ff", startOffset: 110, travelTime: 1.28 });
  } else if (pattern === 1) {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 116, w: 24, h: 78, vx: bossSpeed(2, 14), color: "#9fd9ff" });
    addBossEnemy("bird", boss, { x: bossSpawnX(boss, 100), y: groundY - 158, vx: bossSpeed(2, 30), color: "#d9f6ff" });
  } else {
    addBossObstacle("crate", boss, { x: bossSpawnX(boss), w: 46, h: 70, vx: bossSpeed(2, 20), color: "#60798d" });
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 98), w: 48, h: 42, vx: bossSpeed(2, 34), color: "#d9f6ff" });
  }
}

function spawnLavaGolemPattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossMeteor(boss, { w: 38, h: 38, color: "#ef6b65", startOffset: -20, travelTime: 1.02 });
    addBossMeteor(boss, { w: 34, h: 34, color: "#ffb238", startOffset: 105, travelTime: 1.2 });
  } else if (pattern === 1) {
    addBossObstacle("spike", boss, { x: bossSpawnX(boss), w: 56, h: 46, vx: bossSpeed(3, 22), color: "#ef6b65" });
    addBossEnemy("bomb", boss, { x: bossSpawnX(boss, 116), y: groundY - 40, vx: bossSpeed(3, 38), color: "#53312d" });
  } else {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 142, w: 26, h: 100, vx: bossSpeed(3, 44), color: "#ff7b44" });
    addBossMeteor(boss, { w: 32, h: 32, color: "#ffb238", startOffset: 70, travelTime: 1.4 });
  }
}

function spawnGiantRobotPattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 138, w: 22, h: 96, vx: bossSpeed(4, 24), color: "#7af0d2" });
    addBossObstacle("laser", boss, { x: bossSpawnX(boss, 86), y: groundY - 92, w: 22, h: 52, vx: bossSpeed(4, 18), color: "#7af0d2" });
  } else if (pattern === 1) {
    addBossEnemy("bird", boss, { x: bossSpawnX(boss), y: groundY - 168, vx: bossSpeed(4, 30), color: "#7af0d2" });
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 112), w: 50, h: 42, vx: bossSpeed(4, 36), color: "#5461b9" });
  } else {
    addBossObstacle("crate", boss, { x: bossSpawnX(boss), w: 50, h: 74, vx: bossSpeed(4, 20), color: "#5461b9" });
    addBossObstacle("laser", boss, { x: bossSpawnX(boss, 122), y: groundY - 136, w: 24, h: 90, vx: bossSpeed(4, 40), color: "#48bde7" });
  }
}

function spawnStarDragonPattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossEnemy("bird", boss, { x: bossSpawnX(boss), y: groundY - 178, vx: bossSpeed(5, 36), color: "#f1efff" });
    addBossEnemy("bird", boss, { x: bossSpawnX(boss, 96), y: groundY - 112, vx: bossSpeed(5, 20), color: "#b8c9ff" });
  } else if (pattern === 1) {
    addBossMeteor(boss, { w: 30, h: 30, color: "#f1efff", gravity: 88, travelTime: 1.18 });
    addBossObstacle("laser", boss, { x: bossSpawnX(boss, 90), y: groundY - 122, w: 22, h: 86, vx: bossSpeed(5, 28), color: "#b8c9ff" });
  } else {
    addBossObstacle("spike", boss, { x: bossSpawnX(boss), w: 48, h: 42, vx: bossSpeed(5, 34), color: "#7a7fa4" });
    addBossEnemy("bird", boss, { x: bossSpawnX(boss, 118), y: groundY - 150 - (volley % 2) * 35, vx: bossSpeed(5, 44), color: "#f1efff" });
  }
}

function spawnVoidEnginePattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossMeteor(boss, { w: 36, h: 36, color: "#b98cff", gravity: 90, travelTime: 1.12 });
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 112), w: 52, h: 44, vx: bossSpeed(6, 42), color: "#4c3b72" });
  } else if (pattern === 1) {
    addBossEnemy("bomb", boss, { x: bossSpawnX(boss), y: groundY - 40, vx: bossSpeed(6, 38), color: "#30214f" });
    addBossEnemy("bird", boss, { x: bossSpawnX(boss, 108), y: groundY - 162, vx: bossSpeed(6, 24), color: "#b98cff" });
  } else {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 140, w: 26, h: 102, vx: bossSpeed(6, 34), color: "#b98cff" });
    addBossMeteor(boss, { w: 32, h: 32, color: "#d7b8ff", gravity: 92, travelTime: 1.0 });
  }
}

function spawnAetherLordPattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 150, w: 24, h: 112, vx: bossSpeed(7, 28), color: "#fff1a5" });
    addBossEnemy("slime", boss, { x: bossSpawnX(boss, 110), y: groundY - 36, vx: bossSpeed(7, 48), color: "#fff1a5" });
  } else if (pattern === 1) {
    addBossEnemy("bird", boss, { x: bossSpawnX(boss), y: groundY - 178, vx: bossSpeed(7, 40), color: "#f4cc5f" });
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 120), w: 48, h: 42, vx: bossSpeed(7, 52), color: "#b99067" });
  } else {
    addBossMeteor(boss, { w: 32, h: 32, color: "#fff1a5", travelTime: 1.2 });
    addBossObstacle("laser", boss, { x: bossSpawnX(boss, 100), y: groundY - 124, w: 22, h: 84, vx: bossSpeed(7, 42), color: "#f4cc5f" });
  }
}

function spawnInfinityGatePattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 142, w: 24, h: 104, vx: bossSpeed(8, 36), color: "#4cc38a" });
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 94), w: 52, h: 44, vx: bossSpeed(8, 52), color: "#394859" });
  } else if (pattern === 1) {
    addBossEnemy("bird", boss, { x: bossSpawnX(boss), y: groundY - 184, vx: bossSpeed(8, 52), color: "#4cc38a" });
    addBossEnemy("bomb", boss, { x: bossSpawnX(boss, 104), y: groundY - 40, vx: bossSpeed(8, 36), color: "#24313a" });
  } else {
    addBossMeteor(boss, { w: 34, h: 34, color: "#4cc38a", startOffset: (volley % 2) * 120, travelTime: 1.0 });
    addBossObstacle("laser", boss, { x: bossSpawnX(boss, 125), y: groundY - 132, w: 24, h: 92, vx: bossSpeed(8, 60), color: "#8fffc6" });
  }
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
    id: `chest_${Date.now()}_${rng().toString(16).slice(2)}`,
    type: chestType,
    remaining: Math.ceil(def.seconds / speed)
  });
  run.sessionChests += 1;
  addMissionProgress("dailyChest", 1);
  logEvent(`${def.name}宝箱 GET`);
}

function activateItem(kind) {
  if (kind === "dash") {
    run.dashTimer = Math.max(run.dashTimer, 2.5);
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
    magnetBurst();
    logEvent("MAGNET BURST");
  } else if (kind === "time") {
    run.timeStop = Math.max(run.timeStop, 2.5);
    logEvent("TIME STOP");
  } else if (kind === "doubleJump") {
    player.jumpsUsed = Math.max(0, player.jumpsUsed - 1);
    logEvent("DOUBLE JUMP READY");
  }
  gainCombo(2);
}

function stockItem(kind) {
  if (!itemGuideDefs[kind]) return;
  run.stockedItem = kind;
  logEvent(`${itemName(kind)} STOCKED`);
  updateHud();
}

function useStockedItem() {
  if (isGameplayPaused()) return;
  if (run.gameOver || !run.stockedItem) return;
  const kind = run.stockedItem;
  run.stockedItem = null;
  activateItem(kind);
  updateHud();
}

function itemName(kind) {
  const names = {
    dash: { ja: "ダッシュ", en: "Dash" },
    shield: { ja: "無敵", en: "Invincible" },
    giant: { ja: "巨大化", en: "Giant" },
    magnet: { ja: "磁石", en: "Magnet" },
    time: { ja: "時間停止", en: "Time Stop" },
    doubleJump: { ja: "2段ジャンプ", en: "Double Jump" }
  };
  const entry = names[kind];
  return entry ? entry[currentLanguage] || entry.ja : kind || "-";
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
    { value: "silver", weight: 75 },
    { value: "gold", weight: 22 },
    { value: "rainbow", weight: 2.7 },
    { value: "god", weight: 0.3 }
  ]));
  if (obj.finalBoss) {
    completeAreaBoss(obj.areaIndex || 0);
  }
  logEvent(`BOSS CLEAR +${formatNumber(coinReward)} COIN`);
}

function completeAreaBoss(index) {
  state.areaBossClears = state.areaBossClears || {};
  state.defeatedAreaBosses = state.defeatedAreaBosses || {};
  state.areaBossClears[index] = true;
  state.defeatedAreaBosses[index] = true;
  run.lastBossResearchAudit = {
    areaIndex: index,
    required: [...(run.bossResearchRequired || [])],
    passed: { ...(run.bossResearchPassed || {}) },
    activeUsage: { ...(run.bossResearchUsage || {}) }
  };
  run.bossBattle = false;
  run.bossAreaIndex = -1;
  run.bossAttackTimer = 0;
  run.bossChargeTimer = 0;
  run.bossRetreating = false;
  run.bossPhase = "attack";
  run.bossPatternIndex = 0;
  run.bossVolley = 0;
  run.bossSoulMode = "red";
  run.bossModeTimer = 0;
  run.bossModePulse = 0;
  run.bossResearchCounters = {};
  run.webLane = 1;
  run.justiceCooldown = 0;
  run.echoActive = false;
  run.gravityFlip = false;
  run.gravityLandingGuard = false;
  run.nextSpawn = 0.4;
  run.lastPatternKey = "";
  run.eventCooldown = random(45, 85);
  state.currentPrestigeDistance = Math.max(state.currentPrestigeDistance || 0, run.distance);
  run.nextBossMark = nextAreaBossDistance(index + 1);
  run.nextChestMark = Math.max(
    run.nextChestMark || 0,
    Math.floor(run.distance / CHEST_DISTANCE_INTERVAL) * CHEST_DISTANCE_INTERVAL + CHEST_DISTANCE_INTERVAL
  );
  objects = objects.filter((entry) => entry.type !== "boss" && !entry.bossAttack);
  player.invulnerable = Math.max(player.invulnerable, 1);
  logEvent(`${localizedAreaName(areas[index])} CLEAR`);
}

function damagePlayer(options = {}) {
  if (!options.force && (player.invulnerable > 0 || run.skillShield > 0 || run.dashTimer > 0)) return;
  if (DEBUG_MODE) {
    const source = options.source || null;
    window.__irfLastDamage = {
      frame: tasState.frame,
      playbackFrame: tasState.playbackFrame,
      scenarioId: tasState.autoCurrentScenarioId || tasState.scenarioId || "",
      tracks: tasState.autoTracks.map((track) => ({
        scenarioId: track.scenarioId,
        frame: track.frame,
        length: track.frames?.length || 0
      })),
      distance: run.distance,
      hp: run.hp,
      player: { ...(options.playerRect || getPlayerRect()), vy: player.vy, y: player.y, slideTimer: player.slideTimer },
      input: {
        jump: inputState.jumpHolding,
        slide: inputState.slideHolding,
        block: inputState.blockDirection || "mid"
      },
      source: source ? {
        type: source.type,
        kind: source.kind,
        x: source.x,
        y: source.y,
        w: source.w,
        h: source.h,
        vx: source.vx || 0,
        vy: source.vy || 0,
        bossAttack: Boolean(source.bossAttack),
        soulRule: source.soulRule || null,
        researchTrialId: source.researchTrialId || null,
        attackVolley: Number.isFinite(source.attackVolley) ? source.attackVolley : null,
        webLane: Number.isFinite(source.webLane) ? source.webLane : null
      } : null
    };
  }
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
  run.dashCooldown = 0;
  run.activeSkillCooldowns = {};
  run.skillShield = 0;
  run.giantTimer = 0;
  run.timeStop = 0;
  run.gravityGuardTimer = 0;
  run.phasePinTimer = 0;
  run.chillTimer = 0;
  run.gravityFlip = false;
  run.gravityLandingGuard = false;
  run.echoActive = false;
  run.stockedItem = null;
  player.jumpsUsed = 0;
  player.slideTimer = 0;
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.jumpMaxVelocity = 0;
  inputState.jumpAppliedVelocity = 0;
  inputState.slideHolding = false;
  inputState.pointerSlideActive = false;
  inputState.pointerJumpActive = false;
  inputState.tasWantsJump = false;
  inputState.tasJumpRetry = false;
  inputState.blockDirection = "mid";
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
  if (tasState.autoEnabled) {
    debugMessage(`TAS AUTO END ${tasAutoScenarioElapsedSeconds().toFixed(1)}s ${formatNumber(run.distance)}m`);
  }
  saveState();
}

function restartFromButton() {
  if (isGameplayPaused()) return;
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
  run.activeSkillCooldowns = {};
  run.skillShield = 0;
  run.giantTimer = 0;
  run.timeStop = 0;
  run.gravityGuardTimer = 0;
  run.phasePinTimer = 0;
  run.chillTimer = 0;
  run.nextSpawn = 0.4;
  run.lastPatternKey = "";
  run.nextBossMark = nextAreaBossDistance(areaIndexForDistance(startDistance));
  run.nextChestMark = Math.floor(startDistance / CHEST_DISTANCE_INTERVAL) * CHEST_DISTANCE_INTERVAL + CHEST_DISTANCE_INTERVAL;
  run.bossBattle = false;
  run.bossAreaIndex = -1;
  run.bossAttackTimer = 0;
  run.bossChargeTimer = 0;
  run.bossRetreating = false;
  run.bossPhase = "attack";
  run.bossPatternIndex = 0;
  run.bossVolley = 0;
  run.bossSoulMode = "red";
  run.bossModeTimer = 0;
  run.bossModePulse = 0;
  run.bossResearchCounters = {};
  run.bossResearchRequired = [];
  run.bossResearchScheduled = {};
  run.bossResearchPassed = {};
  run.bossResearchUsage = {};
  run.lastBossResearchAudit = null;
  run.tasAreaIndex = null;
  run.tasDisabledResearchIds = [];
  run.webLane = 1;
  run.justiceCooldown = 0;
  run.echoActive = false;
  run.event = null;
  run.eventTimer = 0;
  run.eventCooldown = random(45, 85);
  run.gravityFlip = false;
  run.gravityLandingGuard = false;
  run.stockedItem = null;
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
  if (state.tutorial?.introComplete) {
    maybeExplainAreaTrait(areaIndexForDistance(startDistance));
  }
}

function startJumpHold(startedAt = gameNow()) {
  if (isGameplayPaused()) return false;
  musicScene = "run";
  unlockAudio();
  if (run.gameOver) {
    resetRun();
    return false;
  }
  if (inputState.jumpHolding) return false;
  if (!beginJump()) return false;
  inputState.jumpHolding = true;
  inputState.jumpStartedAt = startedAt;
  return true;
}

function retryTasJumpAfterLanding() {
  if (!isTasEnabled() || (!inputState.tasJumpRetry && !inputState.tasWantsJump) || inputState.jumpHolding || run.gameOver) return;
  if (startJumpHold(gameNow())) {
    inputState.tasJumpRetry = false;
  }
}

function releaseJumpHold() {
  if (isGameplayPaused()) return;
  if (!inputState.jumpHolding) return;
  const heldSeconds = (gameNow() - inputState.jumpStartedAt) / 1000;
  finishHeldJump(heldSeconds);
  inputState.jumpHolding = false;
}

function performJump(heldSeconds = MAX_JUMP_HOLD_SECONDS) {
  if (isGameplayPaused()) return;
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
  const maxJumps = 1 + (effectiveUpgradeLevel("jump") >= 8 ? 1 : 0);
  syncGroundedJumpState();
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

function syncGroundedJumpState() {
  const targetGround = run.gravityFlip ? PLAYER_CEILING_Y : groundY - getPlayerHeight();
  const closeToGround = run.gravityFlip
    ? player.y <= targetGround + 4 && player.vy <= 20
    : player.y >= targetGround - 4 && player.vy >= -20;
  if (!closeToGround) return;
  player.y = targetGround;
  player.vy = 0;
  player.jumpsUsed = 0;
}

function jumpVelocityCap(stats) {
  const upgradeVelocity = effectiveUpgradeLevel("jump") * JUMP_UPGRADE_VELOCITY + (stats.equipmentJump || 0);
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
  if (isGameplayPaused()) return;
  musicScene = "run";
  unlockAudio();
  if (run.gameOver) return;
  inputState.slideHolding = true;
  player.slideTimer = SLIDE_DURATION_FRAMES * TAS_STEP_SECONDS;
  restartPlayerAnimation("sliding");
  if (Math.abs(player.vy) < 1) {
    player.vy = run.gravityFlip ? -110 : 110;
  }
}

function cancelSlideHold() {
  inputState.slideHolding = false;
  player.slideTimer = 0;
}

function selectActiveSkill(id) {
  if (id === "none") {
    state.settings.activeSkill = "none";
    logEvent("NO ACTIVE SKILL");
    return;
  }
  const def = activeSkillDefs.find((entry) => entry.id === id);
  if (!def || researchLevel(id) <= 0 || !isResearchDiscovered(def)) return;
  state.settings.activeSkill = id;
  logEvent(`${activeSkillName(id)} SET`);
}

function unlockedActiveSkillDefs() {
  return activeSkillDefs.filter((def) => researchLevel(def.id) > 0 && isResearchDiscovered(def));
}

function cycleActiveSkill() {
  if (isGameplayPaused()) return;
  const unlocked = unlockedActiveSkillDefs();
  if (unlocked.length === 0) {
    state.settings.activeSkill = "none";
    logEvent("NO ACTIVE SKILL");
    updateHud();
    persistStateQuiet();
    return;
  }
  const current = state.settings.activeSkill || "none";
  const currentIndex = unlocked.findIndex((def) => def.id === current);
  const next = unlocked[(currentIndex + 1) % unlocked.length];
  selectActiveSkill(next.id);
  renderPanel();
  updateHud();
  persistStateQuiet();
}

function activeSkillName(id = state.settings.activeSkill) {
  const def = activeSkillDefs.find((entry) => entry.id === id);
  return def && researchLevel(id) > 0 && isResearchDiscovered(def) ? def.name : "スキルなし";
}

function activeSkillCooldown(id = state.settings.activeSkill) {
  const def = activeSkillDefs.find((entry) => entry.id === id);
  const baseCooldown = def?.cooldown || 0;
  if (!baseCooldown) return 0;
  const reduction = activeSkillCooldownReduction(effectiveUpgradeLevel("skillCooldown"));
  return Number((baseCooldown * (1 - reduction)).toFixed(2));
}

function activeSkillCooldownRemaining(id = state.settings.activeSkill) {
  const skillCooldown = Number(run.activeSkillCooldowns?.[id] || 0);
  return Math.max(0, Number(run.dashCooldown || 0), skillCooldown);
}

function updateActiveSkillCooldowns(dt) {
  run.activeSkillCooldowns = run.activeSkillCooldowns || {};
  for (const [id, remaining] of Object.entries(run.activeSkillCooldowns)) {
    const next = Math.max(0, Number(remaining || 0) - dt);
    if (next > 0) run.activeSkillCooldowns[id] = next;
    else delete run.activeSkillCooldowns[id];
  }
}

function activeSkillCooldownReduction(level) {
  const safeLevel = Math.max(0, Number(level || 0));
  return ACTIVE_SKILL_COOLDOWN_MAX_REDUCTION * safeLevel / (safeLevel + ACTIVE_SKILL_COOLDOWN_CURVE);
}

function selectedActiveSkillDef() {
  const id = state.settings.activeSkill || "none";
  const def = activeSkillDefs.find((entry) => entry.id === id);
  return def && researchLevel(id) > 0 && isResearchDiscovered(def) ? def : null;
}

function activateActiveSkill() {
  if (isGameplayPaused()) return;
  musicScene = "run";
  unlockAudio();
  const justiceMode = run.bossBattle && activeBossSoulMode() === "yellow";
  if (justiceMode) {
    fireJusticeShot();
  }
  if (run.gameOver) return;
  const def = selectedActiveSkillDef();
  if (!def) {
    if (!justiceMode) logEvent("NO ACTIVE SKILL");
    return;
  }
  if (justiceMode && !hasResolvableActiveResearchTrial(def.id)) return;
  if (activeSkillCooldownRemaining(def.id) > 0) return;
  const level = researchLevel(def.id);
  if (def.id === "sandBreaker") activateSandBreaker(level);
  if (def.id === "gravityAnchor") activateGravityAnchor(level);
  if (def.id === "phaseAnchor") activatePhasePin(level);
  run.activeSkillCooldowns = run.activeSkillCooldowns || {};
  run.activeSkillCooldowns[def.id] = activeSkillCooldown(def.id);
  if (run.bossBattle) {
    run.bossResearchUsage = run.bossResearchUsage || {};
    run.bossResearchUsage[def.id] = Number(run.bossResearchUsage[def.id] || 0) + 1;
  }
  updateHud();
}

function dash() {
  activateActiveSkill();
}

function fireJusticeShot() {
  if (run.justiceCooldown > 0 || run.gameOver) return;
  const rect = getPlayerRect();
  objects.push({
    type: "playerShot",
    x: rect.x + rect.w,
    y: rect.y + rect.h * 0.35,
    w: 18,
    h: 8,
    vx: 620,
    color: "#f2d24b",
    life: 1.2
  });
  run.justiceCooldown = 0.28;
  burst(rect.x + rect.w, rect.y + rect.h / 2, "#f2d24b", 5);
  logEvent("JUSTICE SHOT");
}

function activateSandBreaker(level) {
  const range = sandBreakerRange(level);
  const resolvedTrials = resolveActiveResearchTrials("sandBreaker", range);
  const playerCenter = {
    x: player.x + player.w / 2,
    y: player.y + getPlayerHeight() / 2
  };
  const targets = objects.filter((obj) => {
    if (obj.type !== "enemy" && obj.type !== "boss") return false;
    const dx = (obj.x + obj.w / 2) - playerCenter.x;
    const dy = (obj.y + obj.h / 2) - playerCenter.y;
    return Math.hypot(dx, dy) <= range;
  });
  if (targets.length === 0) {
    burst(player.x + player.w + range * 0.35, player.y + getPlayerHeight() / 2, "#d7b878", 8);
    logEvent(resolvedTrials > 0 ? "CORE BREAK TRIAL" : "CORE BREAK MISS");
    return;
  }
  const defeated = [];
  for (const target of targets) {
    if (target.armor > 0) target.armor -= 1;
    else if (target.shield > 0) target.shield -= 1;
    const damage = target.type === "boss" ? sandBreakerBossDamage(level) : sandBreakerNormalDamage(level);
    if (damage > 0) target.hp = Math.max(0, (target.hp || 1) - damage);
    target.hitCooldown = Math.max(target.hitCooldown || 0, 0.18);
    burst(target.x + target.w / 2, target.y + target.h / 2, "#d7b878", 10);
    if ((target.hp || 0) <= 0 && damage > 0) defeated.push(target);
  }
  for (const target of defeated) {
    if (target.type === "boss") {
      defeatBoss(target);
      if (!target.finalBoss) objects = objects.filter((entry) => entry !== target);
    } else {
      defeatEnemy(target);
      objects = objects.filter((entry) => entry !== target);
    }
  }
  logEvent(`SLIME CORE BREAK x${targets.length}`);
}

function sandBreakerBossDamage(level) {
  return level >= 5 ? Math.max(1, level - 4) : 0;
}

function sandBreakerNormalDamage(level) {
  return 1 + Math.max(0, level - 5);
}

function sandBreakerRange(level) {
  return 130 + Math.min(level, 5) * 8;
}

function activateGravityAnchor(level) {
  run.gravityGuardTimer = Math.max(run.gravityGuardTimer, 0.35 + level * 0.09);
  resolveActiveResearchTrials("gravityAnchor", researchTrialActivationRange("gravityAnchor", level));
  if (run.gravityFlip) {
    run.gravityFlip = false;
    run.gravityLandingGuard = shouldGuardGravityLanding();
    player.vy *= -0.2;
  }
  burst(player.x + player.w / 2, player.y + getPlayerHeight(), "#48bde7", 10);
  logEvent("GIANT ANCHOR");
}

function activatePhasePin(level) {
  run.phasePinTimer = Math.max(run.phasePinTimer, 0.3 + level * 0.08);
  resolveActiveResearchTrials("phaseAnchor", researchTrialActivationRange("phaseAnchor", level));
  for (const obj of objects) {
    if (obj.type === "boss" || obj.type === "enemy") obj.phased = false;
  }
  burst(player.x + player.w + 48, player.y + getPlayerHeight() / 2, "#b98cff", 10);
  logEvent("PHASE PIN");
}

function magnetBurst() {
  player.invulnerable = Math.max(player.invulnerable, 0.8);
  for (const obj of objects) {
    if (obj.type === "coin" || obj.type === "rare") obj.x = Math.min(obj.x, player.x + random(20, 70));
  }
}

function restartPlayerAnimation(key) {
  player.animationKey = key;
  player.animationStartedAt = gameNow();
}

function getStats() {
  const eq = equipmentBonuses();
  const idleMultiplier = 1 + (eq.idle || 0);
  return {
    speed: (5 * (1 + effectiveUpgradeLevel("speed") * 0.012) * (1 + state.permanent.speed * 0.02) * (1 + (eq.speed || 0))),
    jumpPower: (1 + effectiveUpgradeLevel("jump") * 0.03 + (eq.jump || 0)),
    equipmentJump: (eq.jump || 0) * BASE_JUMP_VELOCITY,
    maxHp: 1 + effectiveUpgradeLevel("hp") + Math.floor(eq.hp || 0),
    coinMultiplier: (1 + effectiveUpgradeLevel("coin") * 0.08) * (1 + state.permanent.coin * 0.05) * (1 + (eq.coin || 0)),
    directCoinMultiplier: 1 + runnerDirectCoinBonus(),
    magnetRadius: 44 + effectiveUpgradeLevel("magnet") * 8,
    maxCombo: 2 + effectiveUpgradeLevel("combo") * 0.08,
    regenEvery: effectiveUpgradeLevel("regen") > 0 ? Math.max(10, 32 - effectiveUpgradeLevel("regen") * 0.5) : 0,
    idleMultiplier
  };
}

function equipmentBonuses() {
  if (isTasEnabled()) return {};
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

function getPlayerEchoRect() {
  if (!run.echoActive) return null;
  const rect = getPlayerRect();
  const top = 34;
  const bottom = groundY;
  return {
    x: rect.x,
    y: top + bottom - rect.y - rect.h,
    w: rect.w,
    h: rect.h
  };
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
  if (obj.finalBoss && obj.vulnerable) {
    const rect = getPlayerRect();
    const sideInset = Math.min(14, obj.w * 0.18);
    const horizontalOverlap = rect.x + rect.w > obj.x + sideInset && rect.x < obj.x + obj.w - sideInset;
    if (!horizontalOverlap) return false;
    const contactBand = 16;
    if (run.gravityFlip) {
      const playerTop = rect.y;
      const bossBottom = obj.y + obj.h;
      return player.vy < -80 && playerTop <= bossBottom + 3 && playerTop >= bossBottom - contactBand;
    }
    const playerBottom = rect.y + rect.h;
    return player.vy > 80 && playerBottom >= obj.y - 3 && playerBottom <= obj.y + contactBand;
  }
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
  return BASE_UPGRADE_CAP + effectivePrestigeCount();
}

function factoryLevelCap() {
  return BASE_UPGRADE_CAP + effectivePrestigeCount();
}

function researchLevelCap() {
  return BASE_UPGRADE_CAP + effectivePrestigeCount();
}

function effectivePrestigeCount() {
  if (isTasEnabled() && Number.isFinite(run.tasAreaIndex)) {
    return Math.max(0, Math.floor(run.tasAreaIndex));
  }
  if (!isTasEnabled()) return Number(state.prestigeCount || 0);
  return areaIndexForDistance(Math.max(state.currentPrestigeDistance || 0, run.distance || 0));
}

function effectiveUpgradeLevel(id) {
  if (!isTasEnabled()) return Number(state.upgrades[id] || 0);
  if (id === "hp" || id === "regen") return 0;
  return normalUpgradeCap();
}

function researchLevel(id) {
  if (isTasEnabled()) {
    if (Array.isArray(run.tasDisabledResearchIds) && run.tasDisabledResearchIds.includes(id)) return 0;
    const def = researchDefs.find((entry) => entry.id === id);
    if (!def || !isResearchDiscovered(def)) return 0;
    return researchLevelCap();
  }
  return Number(state.researchTree[id] || 0);
}

function effectiveUpgradeTotal() {
  return upgradeDefs.reduce((sum, def) => sum + effectiveUpgradeLevel(def.id), 0);
}

function effectiveResearchTotal(defs = researchDefs) {
  return defs.reduce((sum, def) => sum + researchLevel(def.id), 0);
}

function applyTasBalanceOverrides() {
  if (!isTasEnabled()) return;
  const stats = getStats();
  run.hp = Math.min(Math.max(0, run.hp), stats.maxHp);
}

function isActiveResearch(id) {
  return Boolean(researchDefs.find((def) => def.id === id)?.active);
}

function passiveResearchLevel(id) {
  return isActiveResearch(id) ? 0 : researchLevel(id);
}

function researchChance(id, perLevel = 0.02) {
  const chance = passiveResearchLevel(id) * perLevel;
  if (chance <= 0) return false;
  if (!run.bossBattle) return rng() < chance;
  return deterministicBossChance(`research:${id}`, chance);
}

function researchReduction(id, perLevel = 0.02) {
  return Math.max(0.75, 1 - passiveResearchLevel(id) * perLevel);
}

function shouldShieldBlockHeal() {
  if (!run.bossBattle) return rng() < 0.18;
  return deterministicBossChance("shieldBlockHeal", 0.18);
}

function deterministicBossChance(key, chance) {
  run.bossResearchCounters = run.bossResearchCounters || {};
  const count = run.bossResearchCounters[key] || 0;
  run.bossResearchCounters[key] = count + 1;
  const period = Math.max(1, Math.ceil(1 / Math.max(0.001, chance)));
  const offset = String(key).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % period;
  return (count + offset + (run.bossPatternIndex || 0)) % period === 0;
}

function isResearchDiscovered(def) {
  return def.sourceAreaIndex === undefined || Boolean(state.defeatedAreaBosses?.[def.sourceAreaIndex]);
}

function visibleResearchDefs() {
  return researchDefs.filter(isResearchDiscovered);
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
  if (!isResearchDiscovered(def)) {
    logEvent("RESEARCH LOCKED");
    return;
  }
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
  if (state.coins < PRESTIGE_COIN_REQUIREMENT) return 0;
  const coinPart = Math.floor(Math.sqrt(state.coins / PRESTIGE_COIN_REQUIREMENT));
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
  state.areaBossClears = {};
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
  const typeBoost = { wood: 0, silver: 1.5, gold: 4, rainbow: 8, god: 12 }[chestType] || 0;
  const rarity = weightedPick(rarityDefs.map((rarityDef) => ({
    value: rarityDef,
    weight: Math.max(0.1, rarityDef.weight + typeBoost * Math.max(0, rarityDef.rank - 2))
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
    : Number((0.02 * rarity.rank + rng() * 0.015 * rarity.rank).toFixed(3));
  return {
    id: `eq_${Date.now()}_${rng().toString(16).slice(2)}`,
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
  const event = weightedPick(RANDOM_EVENT_DEFS);
  startEvent(event);
}

function startEvent(event, options = {}) {
  if (!RANDOM_EVENT_DEFS.some((def) => def.value === event)) return;
  const shouldGuardInterruptedGravity = run.event === "gravity" && run.gravityFlip && event !== "gravity";
  run.gravityFlip = event === "gravity";
  run.gravityLandingGuard = event === "gravity" ? false : shouldGuardInterruptedGravity && shouldGuardGravityLanding();
  run.event = event;
  run.eventTimer = event === "gravity" ? 12 : 14;
  if (options.resetCooldown) run.eventCooldown = random(55, 100);
  run.nextSpawn = Math.min(run.nextSpawn, 0.15);
  logEvent(`${eventName(event)} START`);
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
  if (isTasEnabled() && Number.isFinite(run.tasAreaIndex)) {
    return Math.max(0, Math.min(areas.length - 1, Math.floor(run.tasAreaIndex)));
  }
  return areaIndexForDistance(Math.max(state.currentPrestigeDistance || 0, run.distance || 0));
}

function areaIndexForDistance(distance) {
  let index = 0;
  for (let i = 0; i < areas.length; i++) {
    if (distance >= areas[i].start) index = i;
  }
  return index;
}

function nextAreaBossDistance(index) {
  const area = areas[index];
  if (!area) return Infinity;
  return Math.max(0, area.start + area.runDistance);
}

function isAreaBossCleared(index) {
  return Boolean(state.areaBossClears?.[index]);
}

function runStartDistance() {
  return areas[areaIndexForDistance(state.currentPrestigeDistance || 0)]?.start || 0;
}

function bossName(index) {
  return ["Slime King", "Sand Wyrm", "Frost Core", "Lava Golem", "Giant Robot", "Star Dragon", "Void Engine", "Aether Lord", "Infinity Gate"][index] || "Infinity Gate";
}

function bossSoulModeForArea(index) {
  return bossSoulModes[index]?.id || "rainbow";
}

function bossSoulModeDef(id = activeBossSoulMode()) {
  return bossSoulModes.find((entry) => entry.id === id) || bossSoulModes[0];
}

function activeBossSoulMode() {
  const boss = objects.find((obj) => obj.type === "boss" && obj.finalBoss);
  const baseMode = boss?.soulMode || run.bossSoulMode || "red";
  if (baseMode !== "rainbow") return baseMode;
  const cycle = ["cyan", "orange", "blue", "purple", "green", "yellow", "dual"];
  return cycle[run.bossPatternIndex % cycle.length] || "red";
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
  const totalLevel = isTasEnabled() ? effectiveUpgradeTotal() : sumValues(state.upgrades);
  const html = [
    panelHead("通常強化", `Lv合計 ${totalLevel} / 上限 Lv${cap}${isTasEnabled() ? " / TAS" : ""}`),
    renderActiveSkillSelector(),
    `<div class="list">`,
    ...upgradeDefs.map((def) => {
      const realLevel = state.upgrades[def.id] || 0;
      const level = isTasEnabled() ? effectiveUpgradeLevel(def.id) : realLevel;
      const tasForcedOff = isTasEnabled() && (def.id === "hp" || def.id === "regen");
      const capped = level >= cap;
      const cost = upgradeCost(def, realLevel);
      const meta = isTasEnabled()
        ? (tasForcedOff ? ["TAS fixed Lv0", "HP / Regen disabled"] : [`TAS cap Lv${cap}`, "Save data unchanged"])
        : (capped
          ? [`上限 Lv${cap}`, `転生で上限 +1`]
          : [`次 ${def.effect(level + 1)}`, `${formatCurrency(cost, def.currency)}`, `上限 Lv${cap}`]);
      return rowItem({
        title: `${def.name} Lv${level}`,
        desc: def.effect(level),
        meta,
        action: "buyUpgrade",
        id: def.id,
        disabled: isTasEnabled() || capped || (state[def.currency] || 0) < cost,
        label: isTasEnabled() ? "TAS" : (capped ? "上限" : "強化")
      });
    }),
    `</div>`
  ].join("");
  panelContent.innerHTML = html;
}

function renderActiveSkillSelector() {
  const current = state.settings.activeSkill || "none";
  const unlocked = unlockedActiveSkillDefs();
  const buttons = [
    `<button class="${current === "none" || unlocked.length === 0 ? "active" : ""}" data-action="selectActiveSkill" data-id="none" type="button">なし</button>`,
    ...unlocked.map((def) => (
      `<button class="${current === def.id ? "active" : ""}" data-action="selectActiveSkill" data-id="${def.id}" type="button">${def.name}</button>`
    ))
  ].join("");
  return `<div class="row-item">
    <div>
      <h3>研究アクティブ</h3>
      <p>研究で解放したボス由来スキルを画面下のスキルボタンにセットします。 現在: ${activeSkillName(current)}</p>
      <div class="meta"><span class="pill">解放 ${unlocked.length}/${activeSkillDefs.length}</span><span class="pill">クールダウン ${activeSkillCooldown(current) || "-"}${activeSkillCooldown(current) ? "s" : ""}</span></div>
    </div>
    <div class="filter-row skill-picker">${buttons}</div>
  </div>`;
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
  const progress = Math.min(1, state.coins / PRESTIGE_COIN_REQUIREMENT);
  const permanentList = permanentDefs.filter((def) => ADS_ENABLED || def.id !== "ad");
  const prestigeCount = effectivePrestigeCount();
  const html = [
    panelHead("Prestige", `転生 ${prestigeCount}回${isTasEnabled() ? " (TAS)" : ""}`),
    `<div class="section-stack">
      ${ADS_ENABLED ? `<div class="list">${renderAdRewards()}</div>` : ""}
      <div class="summary-band">
        <div><span>所持PR</span><strong>${formatNumber(state.prestigePoints)}</strong></div>
        <div><span>獲得予定</span><strong>${formatNumber(gain)}</strong></div>
      </div>
      ${debugScalarControl("prestigeCount", "Prestige Count", state.prestigeCount, 1)}
      <div class="row-item">
        <div>
          <h3>1000万コインで転生</h3>
          <p>コイン、通常強化、装備、宝箱、宝石、研究ポイントをリセットし、永続強化用のPRを得ます。転生ごとに通常強化・放置施設・研究上限が+1されます。</p>
          <div class="meta"><span class="pill">現在上限 Lv${normalUpgradeCap()}</span><span class="pill">転生後 Lv${normalUpgradeCap() + 1}</span></div>
          <div class="progress"><i style="width:${progress * 100}%"></i></div>
        </div>
        <button class="buy-button" data-action="prestige" ${isTasEnabled() || gain <= 0 ? "disabled" : ""}>${isTasEnabled() ? "TAS" : "転生"}</button>
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
    if (isTasEnabled()) return `<div><span>${slot}</span><strong>TAS unequipped</strong></div>`;
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
    panelHead("装備", `所持 ${state.equipment.length}${isTasEnabled() ? " / TAS unequipped" : ""}`),
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
  const openAllDescription = currentLanguage === "en"
    ? `Open ${readyCount} ready chests together.`
    : `待機時間が終わった宝箱 ${readyCount}個をまとめて開封します。`;
  const openAll = `<div class="row-item">
    <div>
      <h3>開封可能な宝箱を全開封</h3>
      <p>${openAllDescription}</p>
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
      const equipped = !isTasEnabled() && state.equipped[item.slot] === item.id;
      const valueText = item.stat === "hp" ? `+${item.value}` : `+${Math.round(item.value * 100)}%`;
      return `<div class="row-item">
        <div>
          <h3><span class="${item.rarityClass}">${escapeHtml(item.name)}</span></h3>
          <p>${item.slot} / ${statNames[item.stat]} ${valueText}</p>
          <div class="meta">
            <span class="pill">${item.rarity}</span>
            <span class="pill">${equipped ? "装備中" : "未装備"}</span>
          </div>
          ${debugEquipmentValueControl(item)}
        </div>
        <div class="row-actions">
          <button class="buy-button" data-action="equip" data-id="${item.id}" ${isTasEnabled() || equipped ? "disabled" : ""}>${isTasEnabled() ? "TAS" : (equipped ? "装備中" : "装備")}</button>
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
  const visibleDefs = visibleResearchDefs();
  const prestigeCount = effectivePrestigeCount();
  const totalLevel = isTasEnabled() ? effectiveResearchTotal(visibleDefs) : sumValues(state.researchTree);
  const unlockText = prestigeCount >= 100
    ? "ENDGAME ONLINE"
    : `本格研究まで ${Math.max(0, 100 - prestigeCount)}転生 / 上限 Lv${cap}${isTasEnabled() ? " / TAS" : ""}`;
  panelContent.innerHTML = [
    panelHead("研究ツリー", unlockText),
    `<div class="section-stack">
      <div class="summary-band">
        <div><span>研究ポイント</span><strong>${formatNumber(state.research)}</strong></div>
        <div><span>研究Lv合計</span><strong>${totalLevel}</strong></div>
      </div>
      <div class="list">
      ${visibleDefs.length ? visibleDefs.map((def) => {
        const realLevel = state.researchTree[def.id] || 0;
        const level = isTasEnabled() ? researchLevel(def.id) : realLevel;
        const capped = level >= cap;
        const cost = upgradeCost(def, realLevel);
        const typeMeta = def.active ? [`アクティブ`, `CD ${def.cooldown}s`] : [`パッシブ`];
        return rowItem({
          title: `${def.name} Lv${level}`,
          desc: `${def.description} 現在: ${def.effect(level)}`,
          meta: capped
            ? [...typeMeta, `上限 Lv${cap}`, `転生で上限 +1`]
            : [...typeMeta, `次 ${def.effect(level + 1)}`, `${formatNumber(cost)} LAB`, `上限 Lv${cap}`],
          action: "buyResearch",
          id: def.id,
          disabled: isTasEnabled() || capped || state.research < cost,
          label: isTasEnabled() ? "TAS" : (capped ? "上限" : "研究")
        });
      }).join("") : `<div class="row-item"><div><h3>研究候補なし</h3><p>エリア最終ボスを撃破すると、そのボスをもとにした次エリア攻略用の研究が見つかります。</p></div></div>`}
      </div>
    </div>`
  ].join("");
}

function panelHead(title, meta) {
  return `<div class="panel-head"><div><h2>${title}</h2><p>${meta}</p></div></div>`;
}

function rowItem({ title, desc, meta = [], action, id, disabled = false, label = "購入", progress = null }) {
  const progressHtml = progress === null ? "" : `<div class="progress"><i style="width:${Math.max(0, Math.min(1, progress)) * 100}%"></i></div>`;
  const debugHtml = debugRowControl(action, id);
  return `<div class="row-item">
    <div>
      <h3>${title}</h3>
      <p>${desc}</p>
      ${progressHtml}
      <div class="meta">${meta.map((entry) => `<span class="pill">${entry}</span>`).join("")}</div>
      ${debugHtml}
    </div>
    ${action ? `<button class="buy-button" data-action="${action}" data-id="${id}" ${disabled ? "disabled" : ""}>${label}</button>` : ""}
  </div>`;
}

function debugRowControl(action, id) {
  if (!DEBUG_MODE || !id) return "";
  const meta = debugControlMeta(action, id);
  if (!meta) return "";
  return `<label class="debug-inline">DEBUG ${meta.label}<input class="debug-inline-input" type="number" step="${meta.step}" data-debug-group="${meta.group}" data-debug-id="${id}" value="${meta.value}" oninput="handleDebugInlineTyping(this)" onchange="handleDebugInlineInput(this)" onblur="handleDebugInlineInput(this)" onkeydown="handleDebugInlineKey(event, this)"></label>`;
}

function debugControlMeta(action, id) {
  if (action === "buyUpgrade") return { group: "upgrades", label: "Lv", value: state.upgrades[id] || 0, step: 1 };
  if (action === "buyFactory") return { group: "factories", label: "Lv", value: state.factories[id] || 0, step: 1 };
  if (action === "buyPermanent") return { group: "permanent", label: "Lv", value: state.permanent[id] || 0, step: 1 };
  if (action === "buyResearch") return { group: "researchTree", label: "Lv", value: state.researchTree[id] || 0, step: 1 };
  if (action === "claimDaily") return { group: "dailyMission", label: "Progress", value: state.missions?.daily?.[id]?.progress || 0, step: 1 };
  if (action === "claimWeekly") return { group: "weeklyMission", label: "Progress", value: state.missions?.weekly?.[id]?.progress || 0, step: 1 };
  if (action === "claimAchievement") return { group: "achievement", label: "Done", value: state.achievements?.[id]?.unlocked ? 1 : 0, step: 1 };
  if (action === "openChest") {
    const chest = state.chests.find((entry) => entry.id === id);
    if (!chest) return null;
    return { group: "chests", label: "秒", value: Math.ceil(chest.remaining || 0), step: 1 };
  }
  return null;
}

function debugEquipmentValueControl(item) {
  if (!DEBUG_MODE || !item) return "";
  const isHp = item.stat === "hp";
  const scale = isHp ? 1 : 100;
  const value = isHp ? item.value : Math.round(item.value * scale);
  return `<label class="debug-inline">DEBUG Value<input class="debug-inline-input" type="number" step="1" data-debug-group="equipmentValue" data-debug-id="${item.id}" data-debug-scale="${scale}" value="${value}" oninput="handleDebugInlineTyping(this)" onchange="handleDebugInlineInput(this)" onblur="handleDebugInlineInput(this)" onkeydown="handleDebugInlineKey(event, this)"></label>`;
}

function debugScalarControl(id, label, value, step = 1) {
  if (!DEBUG_MODE) return "";
  return `<label class="debug-inline">DEBUG ${label}<input class="debug-inline-input" type="number" step="${step}" data-debug-group="scalar" data-debug-id="${id}" value="${value}" oninput="handleDebugInlineTyping(this)" onchange="handleDebugInlineInput(this)" onblur="handleDebugInlineInput(this)" onkeydown="handleDebugInlineKey(event, this)"></label>`;
}

function updateHud() {
  const stats = getStats();
  const area = currentArea();
  setDebugHudText("coinsStat", formatNumber(state.coins));
  setDebugHudText("gemsStat", formatNumber(state.gems, 1));
  setDebugHudText("researchStat", formatNumber(state.research, 1));
  setDebugHudText("prestigeStat", formatNumber(state.prestigePoints));
  setDebugHudText("distanceStat", `${formatNumber(run.distance)}m`);
  setDebugHudText("bestStat", `${formatNumber(state.bestDistance)}m`);
  setDebugHudText("hpStat", `${Math.max(0, run.hp)}/${stats.maxHp}`);
  setDebugHudText("comboStat", `x${(1 + Math.min(stats.maxCombo - 1, run.combo * 0.012)).toFixed(2)}`);
  setDebugHudText("levelStat", state.level);
  document.getElementById("areaName").textContent = `${localizedAreaName(area)} / ${area.line}`;
  const dashButton = document.getElementById("dashBtn");
  const cycleSkillButton = document.getElementById("cycleSkillBtn");
  const justiceMode = run.bossBattle && activeBossSoulMode() === "yellow";
  const selectedSkill = selectedActiveSkillDef();
  const selectedCooldown = selectedSkill ? activeSkillCooldownRemaining(selectedSkill.id) : 0;
  const justiceTrialReady = justiceMode && selectedSkill && hasResolvableActiveResearchTrial(selectedSkill.id);
  dashButton.disabled = run.gameOver || (justiceMode
    ? run.justiceCooldown > 0 && (!justiceTrialReady || selectedCooldown > 0)
    : !selectedSkill || selectedCooldown > 0);
  dashButton.textContent = justiceMode
    ? `${currentLanguage === "en" ? "Shot" : "ショット"}\nD`
    : run.dashCooldown > 0 ? `${Math.ceil(run.dashCooldown)}s\nD` : `${translateText(activeSkillName())}\nD`;
  if (!justiceMode && selectedCooldown > 0) dashButton.textContent = `${Math.ceil(selectedCooldown)}s\nD`;
  if (justiceTrialReady) dashButton.textContent = `${currentLanguage === "en" ? "Shot + Skill" : "SHOT + SKILL"}\nD`;
  if (cycleSkillButton) {
    const unlockedSkills = unlockedActiveSkillDefs();
    cycleSkillButton.disabled = unlockedSkills.length === 0;
    cycleSkillButton.textContent = `${currentLanguage === "en" ? "Cycle" : "切替"}\nQ`;
  }
  const stockItemButton = document.getElementById("stockItemBtn");
  if (stockItemButton) {
    stockItemButton.disabled = run.gameOver || !run.stockedItem || isTasEnabled();
    stockItemButton.textContent = `${run.stockedItem ? itemName(run.stockedItem) : (currentLanguage === "en" ? "Item" : "アイテム")}\nE`;
  }
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
  drawBossModeGuides();
  drawObjects();
  drawMiniRobots();
  drawPlayer();
  drawParticles();
  drawTasHitboxes();
  drawForeground(area);
  drawAssetSceneOverlay();
  drawTasOverlay();
}

function drawAssetSceneOverlay() {
  if (!isAssetSceneActive() || !assetSceneState.entry) return;
  const title = `${assetSceneState.selectedIndex + 1}/${assetSceneState.catalog.length}  ${assetSceneState.entry.item}`;
  const description = assetSceneState.description || "ASSET SCENE";
  ctx.save();
  ctx.fillStyle = "rgba(10, 13, 18, 0.88)";
  roundRect(12, canvasHeight - 64, canvasWidth - 24, 50, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(242, 184, 75, 0.82)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#f2b84b";
  ctx.font = "700 13px Segoe UI, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(assetSceneCanvasText(title, canvasWidth - 130), 24, canvasHeight - 56);
  ctx.fillStyle = "#dfe6ee";
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.fillText(assetSceneCanvasText(description, canvasWidth - 52), 24, canvasHeight - 35);
  ctx.fillStyle = "#bff0d2";
  ctx.font = "700 11px Consolas, monospace";
  ctx.textAlign = "right";
  ctx.fillText("PAUSED", canvasWidth - 24, canvasHeight - 56);
  ctx.restore();
}

function assetSceneCanvasText(text, maxWidth) {
  const source = String(text || "");
  if (ctx.measureText(source).width <= maxWidth) return source;
  let output = source;
  while (output.length > 1 && ctx.measureText(`${output}...`).width > maxWidth) output = output.slice(0, -1);
  return `${output}...`;
}

function drawBossModeGuides() {
  if (!run.bossBattle) return;
  const mode = activeBossSoulMode();
  if (mode === "purple" && run.bossPhase === "attack") {
    ctx.save();
    ctx.strokeStyle = "rgba(185,140,255,0.52)";
    ctx.lineWidth = 2;
    for (let lane = 0; lane < 3; lane += 1) {
      const y = webLaneY(lane) + getPlayerHeight() / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawTasOverlay() {
  if (!isTasEnabled()) return;
  const lines = [];
  if (debugSettings.tasShowFrame) {
    lines.push(`F ${tasState.frame} ${tasState.paused ? "PAUSE" : `x${tasSpeedMultiplier()}`}`);
    if (tasState.recording) lines.push("REC");
    if (tasState.playing) lines.push(`PLAY ${tasState.playbackFrame}/${tasState.inputFrames.length}`);
    if (tasState.autoEnabled) lines.push(`AUTO ${tasAutoScenarioElapsedSeconds().toFixed(1)}s ${tasState.autoCurrentScenarioId || "wait"} tracks:${tasState.autoTracks.length} miss:${tasState.autoMissCount}`);
  }
  if (debugSettings.tasShowKinematics) {
    lines.push(`P x:${player.x.toFixed(1)} y:${player.y.toFixed(1)} vy:${player.vy.toFixed(1)}`);
    lines.push(`D ${run.distance.toFixed(2)} HP ${run.hp}/${getStats().maxHp}`);
  }
  if (debugSettings.tasShowRng) {
    lines.push(`RNG ${tasState.rngState >>> 0} #${tasState.rngCalls} last:${tasState.rngLast.toFixed(6)}`);
  }
  if (debugSettings.tasShowWatch) {
    lines.push(`OBJ ${objects.length} EVT ${run.event || "none"} ${Math.max(0, run.eventTimer || 0).toFixed(2)}`);
    lines.push(`BOSS ${run.bossBattle ? `${run.bossPhase} p${run.bossPatternIndex} v${run.bossVolley}` : "none"}`);
    lines.push(`TAS PR ${effectivePrestigeCount()} UP ${effectiveUpgradeTotal()} RES ${effectiveResearchTotal(visibleResearchDefs())}`);
    lines.push(`INPUT J:${Number(inputState.jumpHolding)} S:${Number(inputState.slideHolding)} B:${inputState.blockDirection}`);
  }
  if (!lines.length) return;
  ctx.save();
  ctx.font = "12px Consolas, monospace";
  ctx.textBaseline = "top";
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 16;
  const height = lines.length * 16 + 12;
  ctx.fillStyle = "rgba(10, 14, 18, 0.78)";
  roundRect(10, 10, width, height, 6);
  ctx.fill();
  ctx.fillStyle = "#d8f6ff";
  lines.forEach((line, index) => ctx.fillText(line, 18, 18 + index * 16));
  ctx.restore();
}

function drawTasHitboxes() {
  if (!isTasEnabled() || !debugSettings.tasShowHitboxes) return;
  ctx.save();
  ctx.lineWidth = 1;
  drawTasRect(getPlayerRect(), "#48bde7");
  for (const obj of objects) {
    if (obj.type === "coin" || obj.type === "rare") drawTasRect(obj, "#f2d24b");
    else if (obj.type === "item" || obj.type === "chest") drawTasRect(obj, "#4cc38a");
    else if (obj.type === "playerShot") drawTasRect(obj, "#ffffff");
    else if (isHazardObject(obj)) drawTasRect(obj, obj.bossAttack ? "#ef6b65" : "#ff9f3d");
  }
  ctx.restore();
}

function drawTasRect(rect, color) {
  if (!rect) return;
  ctx.strokeStyle = color;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
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
  } else if (run.bossBattle) {
    ctx.fillStyle = area.accent;
    const mode = bossSoulModeDef();
    ctx.fillText(`FINAL BOSS ${bossName(run.bossAreaIndex)} / ${mode.name}`, Math.max(130, canvasWidth - 360), 14);
  }
}

function drawPlayer() {
  const rect = getPlayerAnchorRect();
  const blink = player.invulnerable > 0 && Math.floor(gameNow() / 80) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.55;
  const accent = run.dashTimer > 0 ? "#f2b84b" : run.skillShield > 0 ? "#48bde7" : "#e8edf5";

  if (drawPlayerSprite(rect, accent)) {
    drawPlayerEcho();
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
  drawPlayerEcho();
}

function drawPlayerEcho() {
  const echo = getPlayerEchoRect();
  if (!echo) return;
  ctx.save();
  ctx.globalAlpha = 0.46;
  ctx.fillStyle = "rgba(239,95,107,0.22)";
  ctx.strokeStyle = "#65d6ff";
  roundRect(echo.x, echo.y, echo.w, echo.h, 7);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawMiniRobots() {
  const activeRunnerFactories = factoryDefs
    .filter((def) => def.category === "runner" && (state.factories[def.id] || 0) > 0)
    .sort((a, b) => a.unlockOrder - b.unlockOrder);
  if (activeRunnerFactories.length === 0) return;

  const rect = getPlayerAnchorRect();
  const bobTime = gameNow() / 220;
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

function syncPlayerAnimationState() {
  const animation = playerAnimationKey();
  if (player.animationKey !== animation) restartPlayerAnimation(animation);
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
  if (run.bossBattle && animation === "running") {
    return frames[0] || frames[frames.length - 1];
  }
  const def = playerAnimationDefs[animation] || playerAnimationDefs.running;
  const elapsed = Math.max(0, (gameNow() - player.animationStartedAt) / 1000);
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
    else if (obj.type === "playerShot") drawPlayerShot(obj);
    else if (obj.type === "enemy") drawEnemy(obj);
    else if (obj.type === "boss") drawBoss(obj);
    else drawObstacle(obj);
  }
}

function drawPlayerShot(obj) {
  ctx.fillStyle = obj.color || "#f2d24b";
  roundRect(obj.x, obj.y, obj.w, obj.h, 4);
  ctx.fill();
}

function drawCoin(obj) {
  ctx.fillStyle = obj.value >= 50 ? "#ffd96a" : "#f2b84b";
  ctx.beginPath();
  ctx.ellipse(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2, obj.h / 2, Math.sin(gameNow() / 160) * 0.4, 0, Math.PI * 2);
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
    doubleJump: "#eef3f7",
    wallRun: "#ff9f3d",
    clone: "#65d6ff"
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
  if (obj.kind === "researchGate") {
    drawResearchTrialGate(obj);
    return;
  }
  if (obj.soulRule === "patience") obj.color = "#65d6ff";
  if (obj.soulRule === "bravery") obj.color = "#ff9f3d";
  if (obj.soulRule === "shield") obj.color = "#60d878";
  if (obj.shootable) obj.color = "#f2d24b";
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

function drawResearchTrialGate(obj) {
  const pulse = 0.48 + Math.sin(gameNow() / 120) * 0.16;
  const active = Boolean(obj.researchTrialActive);
  ctx.save();
  ctx.globalAlpha = obj.researchTrialResolved ? 0.22 : 1;
  ctx.fillStyle = `rgba(8, 12, 18, ${Math.max(0.22, pulse)})`;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  ctx.strokeStyle = obj.color || "#eef3f7";
  ctx.lineWidth = 3;
  ctx.strokeRect(obj.x + 1.5, obj.y + 1.5, obj.w - 3, obj.h - 3);
  for (let y = obj.y + 12; y < obj.y + obj.h; y += 28) {
    ctx.fillStyle = obj.color || "#eef3f7";
    ctx.fillRect(obj.x + 6, y, obj.w - 12, 5);
  }
  ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#101217";
  ctx.fillRect(-78, -10, 156, 20);
  ctx.fillStyle = obj.color || "#eef3f7";
  ctx.font = "700 10px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${active ? "D" : "P"} / ${researchTrialShortLabel(obj.researchTrialId)}`, 0, 0);
  ctx.restore();
}

function researchTrialShortLabel(id) {
  return {
    sandBreaker: "CORE",
    frostInsulation: "FROST",
    heatPlating: "HEAT",
    shieldPiercer: "SHIELD",
    gravityAnchor: "ANCHOR",
    voidTether: "TETHER",
    aetherSeal: "SEAL",
    phaseAnchor: "PHASE"
  }[id] || "RESEARCH";
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
  drawEnemyTraitIndicator(obj, obj.h);
  ctx.restore();
}

function drawBoss(obj) {
  ctx.save();
  if (obj.phased) ctx.globalAlpha = 0.42;
  const drawH = obj.finalBoss && obj.vulnerable ? finalBossVulnerableHeight(obj) : obj.h;
  ctx.fillStyle = obj.color;
  roundRect(obj.x, obj.y, obj.w, drawH, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(obj.x + 18, obj.y + Math.min(26, drawH * 0.36), 10, 10);
  ctx.fillRect(obj.x + obj.w - 28, obj.y + Math.min(26, drawH * 0.36), 10, 10);
  ctx.fillStyle = "#101217";
  ctx.fillRect(obj.x, obj.y - 12, obj.w, 6);
  ctx.fillStyle = "#ef6b65";
  ctx.fillRect(obj.x, obj.y - 12, obj.w * Math.max(0, obj.hp / obj.maxHp), 6);
  if (obj.finalBoss && obj.vulnerable) {
    ctx.strokeStyle = "#f2b84b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(obj.x + obj.w / 2, obj.y - 20, obj.w * 0.36, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (obj.armor > 0 || obj.shield > 0) {
    ctx.strokeStyle = obj.shield > 0 ? "#48bde7" : "#d7b878";
    ctx.lineWidth = 3;
    ctx.strokeRect(obj.x - 3, obj.y - 3, obj.w + 6, drawH + 6);
  }
  drawEnemyTraitIndicator(obj, drawH);
  ctx.restore();
}

function drawEnemyTraitIndicator(obj, drawH) {
  if (!obj.trait || obj.trait === "plain") return;
  const colors = {
    sandArmor: "#d7b878",
    frostAura: "#9fd9ff",
    burning: "#ff8b38",
    energyShield: "#48bde7",
    gravityPulse: "#b98cff",
    voidPull: obj.voidPolarity > 0 ? "#b98cff" : "#65d6ff",
    regen: "#fff1a5",
    phase: "#8fffc6"
  };
  ctx.save();
  ctx.globalAlpha = obj.traitWarning ? 0.92 : 0.34;
  ctx.strokeStyle = colors[obj.trait] || "#ffffff";
  ctx.lineWidth = obj.traitWarning ? 4 : 2;
  const pulse = obj.traitWarning ? 5 + Math.sin(gameNow() / 70) * 3 : 2;
  ctx.beginPath();
  ctx.ellipse(
    obj.x + obj.w / 2,
    obj.y + drawH / 2,
    obj.w / 2 + 7 + pulse,
    drawH / 2 + 7 + pulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
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
    const bossBattleBurst = run.bossBattle;
    const angle = bossBattleBurst ? (i * 2.39996 + count * 0.21) : 0;
    particles.push({
      x,
      y,
      vx: bossBattleBurst ? Math.cos(angle) * (70 + (i % 5) * 22) : random(-160, 160),
      vy: bossBattleBurst ? -60 - Math.abs(Math.sin(angle)) * (80 + (i % 4) * 26) : random(-220, -40),
      size: bossBattleBurst ? 3 + (i % 5) : random(3, 7),
      life: bossBattleBurst ? 0.38 + (i % 6) * 0.08 : random(0.35, 0.9),
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
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

function rng() {
  tasState.rngState = (Math.imul(1664525, tasState.rngState >>> 0) + 1013904223) >>> 0;
  tasState.rngCalls += 1;
  tasState.rngLast = tasState.rngState / 4294967296;
  return tasState.rngLast;
}

function random(min, max) {
  return rng() * (max - min) + min;
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
