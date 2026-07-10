"use strict";

const STORAGE_KEY = "infinite_runner_factory_save_v1";
const SAVE_VERSION = 1;
const ASSET_ROOT = "asset/";
const MUSIC_ROOT = `${ASSET_ROOT}music/loop/`;
const REWARD_AD_URL = "https://omg10.com/4/11245499";
const LANGUAGE_STORAGE_KEY = "irf_language_v1";
const LANGUAGE_MODE = document.documentElement.dataset.languageMode || "auto";
const ADS_ENABLED = (document.documentElement.dataset.adMode || "reward") !== "none";
const DEBUG_MODE = document.documentElement.dataset.debugMode === "true";
const MAX_JUMP_HOLD_SECONDS = 1;
const MIN_JUMP_HOLD_SECONDS = 0.1;
const BASE_JUMP_VELOCITY = 380;
const JUMP_UPGRADE_VELOCITY = 26;
const BASE_UPGRADE_CAP = 5;
const PRESTIGE_COIN_REQUIREMENT = 10000000;
const CHEST_DISTANCE_INTERVAL = 500;
const HAZARD_MIN_GAP = 190;
const ITEM_MIN_GAP = 960;
const FINAL_BOSS_OFFSET = 100;
const FINAL_BOSS_ATTACK_PATTERNS = 3;

const upgradeDefs = [
  { id: "speed", name: "スピード", base: 10, growth: 2, currency: "coins", effect: (lv) => `速度 +${(lv * 1.2).toFixed(1)}%` },
  { id: "jump", name: "ジャンプ", base: 15, growth: 1.85, currency: "coins", effect: (lv) => `跳躍 +${Math.round(lv * 3)}%` },
  { id: "hp", name: "HP", base: 50, growth: 2.1, currency: "coins", effect: (lv) => `最大HP ${1 + lv}` },
  { id: "coin", name: "コイン倍率", base: 25, growth: 2, currency: "coins", effect: (lv) => `獲得 +${Math.round(lv * 8)}%` },
  { id: "magnet", name: "磁石", base: 80, growth: 1.95, currency: "coins", effect: (lv) => `吸収範囲 +${lv * 8}` },
  { id: "dash", name: "ダッシュ", base: 120, growth: 2.05, currency: "coins", effect: (lv) => `持続 +${(lv * 0.18).toFixed(1)}秒` },
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
      ja: "ジャンプはSpace/↑長押しで飛距離が伸びます。スライドは↓長押しで、キーやボタンを離すと早めに解除できます。スキルは研究後にセットし、Dキーでも使えます。",
      en: "Hold Space/↑ to jump farther. Hold ↓ to slide, then release to cancel early. Set a researched skill and trigger it with D."
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
    text: { ja: "一定時間だけ高速で走り、接触にも強くなります。ボス戦では移動ではなく、短い攻撃チャンスとして働きます。", en: "Temporarily boosts speed and contact strength. In boss battles, it works more like a short attack window than movement." }
  },
  shield: {
    title: { ja: "特殊アイテム: 無敵", en: "Special Item: Invincible" },
    text: { ja: "短い間ダメージを受けにくくなります。危険な攻撃が重なった時の保険になります。", en: "Briefly protects you from damage. It is useful when several threats overlap." }
  },
  giant: {
    title: { ja: "特殊アイテム: 巨大化", en: "Special Item: Giant" },
    text: { ja: "ロボットが大きくなり、当たりも強くなります。見た目も判定も大きくなるので、足場感覚が少し変わります。", en: "Your robot grows larger and stronger. Its visual size and collision feel both change for a while." }
  },
  magnet: {
    title: { ja: "特殊アイテム: 磁石", en: "Special Item: Magnet" },
    text: { ja: "近くのコインや報酬を一気に引き寄せます。取り逃しを減らして強化速度を上げられます。", en: "Pulls nearby coins and rewards toward you, reducing misses and speeding up upgrades." }
  },
  time: {
    title: { ja: "特殊アイテム: 時間停止", en: "Special Item: Time Stop" },
    text: { ja: "一部の敵や障害物の動きを止めます。止まっている間に位置関係を立て直せます。", en: "Stops some enemies and hazards briefly, giving you time to reset positioning." }
  },
  doubleJump: {
    title: { ja: "特殊アイテム: 2段ジャンプ", en: "Special Item: Double Jump" },
    text: { ja: "空中で使えるジャンプ回数を少し戻します。連続した障害物やボス攻撃への立て直しに役立ちます。", en: "Restores a bit of jump control in midair, helping you recover from chained hazards or boss attacks." }
  }
};

const traitGuideDefs = {
  sandArmor: {
    title: { ja: "このエリアの敵: 砂装甲", en: "Area Trait: Sand Armor" },
    text: { ja: "この先の敵は、最初の一撃を装甲で受け止めることがあります。踏む・スキルで削ってから本体を狙いましょう。", en: "Enemies here may absorb the first hit with armor. Chip it away with stomps or skills before going for the body." }
  },
  frostAura: {
    title: { ja: "このエリアの敵: 凍結オーラ", en: "Area Trait: Frost Aura" },
    text: { ja: "近づくと動きが少し鈍る敵が出ます。距離を取り、遅くなる前提でジャンプを早めに入力しましょう。", en: "Some enemies slow you when you get close. Keep distance and jump a bit earlier." }
  },
  burning: {
    title: { ja: "このエリアの敵: 灼熱", en: "Area Trait: Burning" },
    text: { ja: "被弾時の痛みが増す敵がいます。HPに余裕がない時ほど接触を避けましょう。", en: "Some enemies make hits more painful. Avoid contact carefully when HP is low." }
  },
  energyShield: {
    title: { ja: "このエリアの敵: エネルギー盾", en: "Area Trait: Energy Shield" },
    text: { ja: "盾で攻撃を受け流す敵がいます。連続で踏める位置取りや、研究スキルが重要になります。", en: "Some enemies deflect attacks with shields. Positioning for repeated hits and research skills matter more here." }
  },
  gravityPulse: {
    title: { ja: "このエリアの敵: 重力波", en: "Area Trait: Gravity Pulse" },
    text: { ja: "近距離で重力が乱れることがあります。画面の上下感覚を崩されても、着地点を見て動きましょう。", en: "Gravity can distort at close range. Watch your landing spot even when up and down feel wrong." }
  },
  voidPull: {
    title: { ja: "このエリアの敵: 吸引", en: "Area Trait: Pull" },
    text: { ja: "近くの敵に引き寄せられます。早めに距離を作り、吸われる前にラインを外しましょう。", en: "Nearby enemies can pull you in. Create distance early before the pull sets up danger." }
  },
  regen: {
    title: { ja: "このエリアの敵: 再生", en: "Area Trait: Regeneration" },
    text: { ja: "時間をかけると回復する敵がいます。攻める時は短い間隔で削る意識が必要です。", en: "Some enemies heal over time. When you attack, try to keep pressure on them." }
  },
  phase: {
    title: { ja: "このエリアの敵: 位相化", en: "Area Trait: Phasing" },
    text: { ja: "一瞬だけ攻撃が通りにくくなる敵がいます。光り方や動きを見て、当たるタイミングを待ちましょう。", en: "Some enemies briefly become hard to hit. Watch their motion and wait for the opening." }
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
  ["研究で解放したボス由来スキルを画面下のスキルボタンにセットします。", "Set a boss-derived skill unlocked by research to the skill button below."],
  ["スキルなし", "No Skill"],
  ["未解放", "Locked"],
  ["解放", "Unlocked"],
  ["アクティブ", "Active"],
  ["パッシブ", "Passive"],
  ["現在:", "Current:"],
  ["クールダウン", "Cooldown"],
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
let languageSelectionActive = false;

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
  webLane: 1,
  justiceCooldown: 0,
  echoActive: false,
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
  state.lastSavedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initDebugMode() {
  if (!DEBUG_MODE) return;
  debugPanel?.classList.remove("hidden");
  debugResetSave?.addEventListener("click", resetDebugSave);
  debugMaxUpgrades?.addEventListener("click", setDebugUpgradesToCap);
  configureDebugHudInputs();
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
  return languageSelectionActive || isGuideActive();
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
  if (guideState.active) {
    guideState.queue.push(entry);
    return;
  }
  beginGuide(entry);
}

function beginGuide(entry) {
  guideState.active = true;
  guideState.steps = entry.steps;
  guideState.index = 0;
  guideState.onComplete = entry.onComplete;
  showGuideStep();
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
  guideNext.textContent = currentLanguage === "en"
    ? guideState.index >= guideState.steps.length - 1 ? "Close" : "Next"
    : guideState.index >= guideState.steps.length - 1 ? "閉じる" : "次へ";
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
      bgmEnabled: true,
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
      seenTraits: {}
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
  targetState.upgrades = normalizeDefObject(targetState.upgrades, upgradeDefs);
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
  window.addEventListener("resize", () => {
    if (guideState.active) showGuideStep();
  });
  window.addEventListener("scroll", () => {
    if (guideState.active) updateGuideHighlight(guideState.currentTarget);
  }, { passive: true });
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  document.addEventListener("keydown", (event) => {
    const gameplayKey = event.code === "Space"
      || event.code === "ArrowUp"
      || event.code === "ArrowDown"
      || event.code === "ArrowLeft"
      || event.code === "ArrowRight"
      || event.code === "KeyD";
    if (gameplayKey) event.preventDefault();
    if (event.repeat) return;
    if (event.code === "Space" || event.code === "ArrowUp") {
      inputState.blockDirection = "high";
    } else if (event.code === "ArrowDown") {
      inputState.blockDirection = "low";
    }
    if (run.bossBattle && run.bossPhase === "attack" && activeBossSoulMode() === "purple") {
      if (event.code === "Space" || event.code === "ArrowUp") shiftWebLane(-1);
      if (event.code === "ArrowDown") shiftWebLane(1);
      if (event.code !== "KeyD") return;
    }
    if (event.code === "Space" || event.code === "ArrowUp") {
      startJumpHold();
    }
    if (event.code === "ArrowDown") {
      startSlideHold();
    }
    if (event.code === "KeyD") {
      dash();
    }
  });

  document.addEventListener("keyup", (event) => {
    const gameplayKey = event.code === "Space"
      || event.code === "ArrowUp"
      || event.code === "ArrowDown"
      || event.code === "ArrowLeft"
      || event.code === "ArrowRight"
      || event.code === "KeyD";
    if (gameplayKey) event.preventDefault();
    if ((event.code === "Space" || event.code === "ArrowUp") && inputState.blockDirection === "high") {
      inputState.blockDirection = "mid";
    }
    if (event.code === "ArrowDown" && inputState.blockDirection === "low") {
      inputState.blockDirection = "mid";
    }
    if (event.code === "Space" || event.code === "ArrowUp") {
      releaseJumpHold();
    }
    if (event.code === "ArrowDown") {
      cancelSlideHold();
    }
  });

  bindHoldButton(document.getElementById("jumpBtn"), startJumpHold, releaseJumpHold);
  bindHoldButton(document.getElementById("slideBtn"), startSlideHold, cancelSlideHold);
  document.getElementById("dashBtn").addEventListener("click", activateActiveSkill);
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
  if (isGameplayPaused()) {
    if (messageTimer > 0) messageTimer -= dt;
    syncBgm();
    return;
  }
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
      run.nextSpawn = random(0.6, Math.max(1.05, 1.48 - Math.min(0.45, stats.speed / 48)));
    }
  }

  updatePlayer(dt, stats);
  updateObjects(dt, scrollSpeed, stats);
  updateParticles(dt);
  if (!run.bossBattle) updateEvent(dt);

  if (run.dashTimer > 0) run.dashTimer -= dt;
  if (run.dashCooldown > 0) run.dashCooldown -= dt;
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
      obj.x -= scrollSpeed * dt;
    }
    checkHazardGuideTrigger(obj);
    checkItemGuideTrigger(obj);
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
        if (handleSoulObstacleCollision(obj, removed)) {
          // Soul-mode rule handled this collision.
        } else if (isInvincible() || run.event === "clearPath") {
          burst(obj.x, obj.y, "#f2b84b", 9);
          removed.add(obj);
          gainCombo(1);
        } else {
          damagePlayer();
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
          damagePlayer({ source: obj });
          obj.x -= 85;
        }
      } else if (obj.type === "boss") {
        const finalBossClosed = obj.finalBoss && !obj.vulnerable;
        const finalBossOpen = obj.finalBoss && obj.vulnerable;
        if (finalBossClosed) {
          if (!isInvincible() && run.skillShield <= 0 && player.invulnerable <= 0.05) {
            damagePlayer({ source: obj });
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
            damagePlayer({ source: obj });
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
          damagePlayer({ source: obj });
          obj.x -= 90;
        }
      }
    }
  }

  objects = objects.filter((obj) => obj.x > -220 && !removed.has(obj));
}

function handlePlayerShotCollision(shot, removed) {
  const target = objects.find((obj) => {
    if (obj === shot || removed.has(obj)) return false;
    if (obj.type !== "obstacle" && obj.type !== "enemy" && obj.type !== "boss") return false;
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
      damagePlayer();
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
      damagePlayer();
      obj.x -= 80;
    }
    return true;
  }
  if (obj.soulRule === "shield") {
    if (shieldDirection() === obj.shieldLane) {
      removed.add(obj);
      burst(obj.x + obj.w / 2, obj.y + obj.h / 2, "#60d878", 8);
      if (run.hp < getStats().maxHp && Math.random() < 0.18) run.hp += 1;
      gainCombo(1);
    } else {
      damagePlayer();
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
      if (run.gravityGuardTimer <= 0) {
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
    obj.phased = run.phasePinTimer <= 0 && Math.sin(obj.phaseTimer * 2.4) > 0.62;
  }
  if (obj.type === "boss") {
    updateBossGimmick(obj, dt, distance);
  }
}

function updateBossGimmick(obj, dt, distance) {
  if (run.bossBattle && obj.finalBoss) {
    updateFinalBossGimmick(obj, dt);
    return;
  }
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
    boss.gimmickTimer = 0.75;
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
    addBossEnemy("slime", boss, { x: boss.x - 18, y: groundY - 30, w: 28, h: 28, vx: bossSpeed(index, 44), color: "#75d05e" });
    boss.gimmickTimer = 1.35;
  }

  if (boss.bossGimmick === "sandBurrow") {
    boss.phased = run.bossChargeTimer > finalBossAttackDuration(index) - 0.75;
    boss.y = groundY - boss.h + (boss.phased ? 48 : Math.sin(performance.now() / 180) * 8);
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
    if (!boss.gimmickUsed) {
      boss.shield = Math.max(boss.shield || 0, 1);
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
    if (boss.hp < boss.maxHp) boss.hp = Math.min(boss.maxHp, boss.hp + 1);
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, "#fff1a5", 8);
    boss.gimmickTimer = Math.max(1.25, 1.9 - researchLevel("aetherSeal") * 0.12);
  }

  if (boss.bossGimmick === "infinitePhase") {
    boss.phased = run.phasePinTimer <= 0 && Math.sin(performance.now() / 130) > -0.1;
    if (boss.gimmickTimer <= 0) {
      addBossEnemy("bird", boss, { x: bossSpawnX(boss, random(50, 140)), y: groundY - random(116, 184), vx: bossSpeed(index, 62), color: "#8fffc6" });
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

  if (roll > 0.23 && roll < 0.68) {
    spawnObstacleOrEnemy(baseX + random(120, 220), area);
  }

  const itemChance = 0.025 + state.upgrades.item * 0.002;
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

function canSpawnHazardAt(x, gap = HAZARD_MIN_GAP) {
  return !objects.some((obj) => isHazardObject(obj) && Math.abs(obj.x - x) < gap);
}

function isHazardObject(obj) {
  return obj.type === "obstacle" || obj.type === "enemy" || obj.type === "boss";
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
  run.bossBattle = true;
  run.bossAreaIndex = index;
  run.bossAttackTimer = 0.55;
  run.bossChargeTimer = finalBossAttackDuration(index);
  run.bossRetreating = true;
  run.bossPhase = "attack";
  run.bossPatternIndex = 0;
  run.bossVolley = 0;
  run.bossSoulMode = bossSoulModeForArea(index);
  run.bossModeTimer = 0;
  run.bossModePulse = 0.85;
  run.webLane = 1;
  run.justiceCooldown = 0;
  run.echoActive = false;
  run.event = null;
  run.eventTimer = 0;
  run.gravityFlip = false;
  run.nextSpawn = 999;
  objects = [];
  const hp = (index === 0 ? 3 : 6 + index * 2) + Math.floor((state.prestigeCount || 0) / 4);
  spawnBoss(index, { finalBoss: true, x: canvasWidth + 90, hp });
  restartPlayerAnimation("running");
  logEvent(`AREA BOSS ${bossName(index).toUpperCase()}`);
  maybeExplainBoss(index);
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
    boss.y = finalBossVulnerableY(boss) - Math.abs(Math.sin(performance.now() / 460)) * 3;
    const playerRect = getPlayerRect();
    const passedPlayer = boss.x + boss.w < playerRect.x - 16;
    if (run.bossChargeTimer <= 0 || passedPlayer) {
      switchBossPhase(boss, "attack");
    }
    return;
  }

  boss.vx = 0;
  boss.x += (anchorX - boss.x) * Math.min(1, dt * 2.2);
  boss.y = groundY - boss.h - Math.abs(Math.sin(performance.now() / 560)) * 13;

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
  if (phase === "attack") {
    clearBossAttackObjects();
    run.bossPatternIndex = (run.bossPatternIndex + 1) % FINAL_BOSS_ATTACK_PATTERNS;
    boss.attackPattern = run.bossPatternIndex;
    run.bossModePulse = 0.85;
    run.bossChargeTimer = finalBossAttackDuration(index);
    run.bossAttackTimer = 0.7;
    logEvent(`${bossName(index).toUpperCase()} PATTERN ${boss.attackPattern + 1}`);
  } else {
    clearBossAttackObjects();
    resetBossSoulModeMovement(mode);
    run.bossModePulse = 0.4;
    run.bossChargeTimer = finalBossVulnerableDuration(index);
    run.bossAttackTimer = 99;
    boss.x = finalBossApproachStartX(boss);
    boss.y = finalBossVulnerableY(boss);
    boss.vx = finalBossApproachVelocity(boss, index);
    burst(boss.x + boss.w / 2, boss.y + 12, boss.color, 12);
    logEvent("BOSS OPEN");
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
  if (mode === "blue" || mode === "purple" || mode === "dual" || mode === "rainbow") {
    run.gravityFlip = false;
    run.webLane = 1;
    player.y = groundY - getPlayerHeight();
    player.vy = 0;
    player.jumpsUsed = 0;
    player.slideTimer = 0;
    inputState.jumpHolding = false;
    inputState.jumpActive = false;
    inputState.slideHolding = false;
  }
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

function bossSpeed(index, add = 0) {
  return -(165 + index * 14 + add);
}

function bossSpawnX(boss, offset = 0) {
  return Math.min(canvasWidth + 140, boss.x + boss.w / 2 + offset);
}

function addBossMeteor(boss, options = {}) {
  return addBossObstacle("meteor", boss, aimedBossMeteorOptions(boss, options));
}

function aimedBossMeteorOptions(boss, options = {}) {
  const index = boss.areaIndex || 0;
  const w = options.w || 34;
  const h = options.h || 34;
  const playerRect = getPlayerRect();
  const startOffset = options.startOffset || 0;
  const startX = options.x ?? playerRect.x + playerRect.w + random(230, 410) + startOffset;
  const startY = options.y ?? Math.max(30, groundY - random(245, 315));
  const targetX = options.targetX ?? playerRect.x - random(26, 96);
  const minTargetY = Math.max(46, playerRect.y - 58);
  const maxTargetY = Math.min(groundY - h * 0.5, playerRect.y + playerRect.h + 46);
  const targetY = options.targetY ?? random(minTargetY, Math.max(minTargetY + 1, maxTargetY));
  const travelTime = options.travelTime ?? Math.max(0.82, 1.16 - index * 0.025 + random(-0.1, 0.12));
  const gravity = options.gravity ?? (112 + index * 7);
  const startCenterX = startX + w / 2;
  const startCenterY = startY + h / 2;
  const vx = (targetX - startCenterX) / travelTime;
  const vy = (targetY - startCenterY - 0.5 * gravity * travelTime * travelTime) / travelTime;
  return { ...options, x: startX, y: startY, w, h, vx, vy, gravity };
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
    color: options.color || boss.color
  };
  applyBossSoulRule(obj, boss, options);
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
    color: options.color || (kind === "slime" ? "#75d05e" : boss.color)
  }, boss.areaIndex || 0);
  applyBossSoulRule(obj, boss, options);
  objects.push(obj);
  tagLatestHazardForGuide(kind);
  return obj;
}

function applyBossSoulRule(obj, boss, options = {}) {
  const mode = activeBossSoulMode();
  obj.soulMode = mode;
  if (mode === "cyan") obj.soulRule = "patience";
  if (mode === "orange") obj.soulRule = "bravery";
  if (mode === "green") {
    obj.soulRule = "shield";
    obj.shieldLane = options.shieldLane || inferShieldLane(obj);
  }
  if (mode === "yellow") obj.shootable = true;
  if (mode === "dual") obj.dualHazard = true;
  if ((boss?.soulMode || run.bossSoulMode) === "rainbow") {
    obj.rainbowRule = mode;
  }
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
    if (volley % 2 === 1) addBossEnemy("slime", boss, { x: bossSpawnX(boss, 86), y: groundY - 62, w: 28, h: 28, vx: bossSpeed(0, 26), vy: -70, gravity: 170 });
  } else if (pattern === 1) {
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 0), w: 46, h: 40, color: "#75d05e", vx: bossSpeed(0, 18) });
    addBossEnemy("slime", boss, { x: bossSpawnX(boss, 92), w: 30, h: 30, vx: bossSpeed(0, 34) });
  } else {
    addBossEnemy("bird", boss, { x: bossSpawnX(boss, 20), y: groundY - 132 - (volley % 2) * 28, vx: bossSpeed(0, 22), color: "#a8ee78" });
    addBossEnemy("slime", boss, { x: bossSpawnX(boss, 112), w: 32, h: 32, vx: bossSpeed(0, 38) });
  }
}

function spawnSandWyrmPattern(boss, pattern, volley) {
  if (pattern === 0) {
    addBossObstacle("spike", boss, { x: bossSpawnX(boss), w: 52, h: 44, vx: bossSpeed(1, 18), color: "#d6a15c" });
    addBossObstacle("spike", boss, { x: bossSpawnX(boss, 105), w: 40, h: 34, vx: bossSpeed(1, 4), color: "#d6a15c" });
  } else if (pattern === 1) {
    addBossEnemy("bomb", boss, { x: bossSpawnX(boss), y: groundY - 38, vx: bossSpeed(1, 24), color: "#6b5640" });
    addBossObstacle("crate", boss, { x: bossSpawnX(boss, 120), w: 48, h: 60, vx: bossSpeed(1, 8), color: "#9c6a32" });
  } else {
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 128, w: 24, h: 92, vx: bossSpeed(1, 20), color: "#f2b84b" });
    if (volley % 2 === 0) addBossObstacle("spike", boss, { x: bossSpawnX(boss, 108), w: 48, h: 42, vx: bossSpeed(1, 28), color: "#d6a15c" });
  }
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
    addBossObstacle("laser", boss, { x: bossSpawnX(boss), y: groundY - 142, w: 26, h: 100, vx: bossSpeed(3, 16), color: "#ff7b44" });
    addBossMeteor(boss, { w: 32, h: 32, color: "#ffb238", startOffset: 70 });
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
  run.webLane = 1;
  run.justiceCooldown = 0;
  run.echoActive = false;
  run.gravityFlip = false;
  run.nextSpawn = 0.4;
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
  run.gravityGuardTimer = 0;
  run.phasePinTimer = 0;
  run.chillTimer = 0;
  run.gravityFlip = false;
  run.echoActive = false;
  player.jumpsUsed = 0;
  player.slideTimer = 0;
  inputState.jumpHolding = false;
  inputState.jumpActive = false;
  inputState.jumpMaxVelocity = 0;
  inputState.jumpAppliedVelocity = 0;
  inputState.slideHolding = false;
  inputState.pointerSlideActive = false;
  inputState.pointerJumpActive = false;
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
  run.skillShield = 0;
  run.giantTimer = 0;
  run.timeStop = 0;
  run.gravityGuardTimer = 0;
  run.phasePinTimer = 0;
  run.chillTimer = 0;
  run.nextSpawn = 0.4;
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
  run.webLane = 1;
  run.justiceCooldown = 0;
  run.echoActive = false;
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
  if (state.tutorial?.introComplete) {
    maybeExplainAreaTrait(areaIndexForDistance(startDistance));
  }
}

function startJumpHold(startedAt = performance.now()) {
  if (isGameplayPaused()) return;
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
  if (isGameplayPaused()) return;
  if (!inputState.jumpHolding) return;
  const heldSeconds = (performance.now() - inputState.jumpStartedAt) / 1000;
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
  if (isGameplayPaused()) return;
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

function activeSkillName(id = state.settings.activeSkill) {
  const def = activeSkillDefs.find((entry) => entry.id === id);
  return def && researchLevel(id) > 0 && isResearchDiscovered(def) ? def.name : "スキルなし";
}

function activeSkillCooldown(id = state.settings.activeSkill) {
  const def = activeSkillDefs.find((entry) => entry.id === id);
  return def?.cooldown || 0;
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
  if (run.bossBattle && activeBossSoulMode() === "yellow") {
    fireJusticeShot();
    return;
  }
  if (run.gameOver || run.dashCooldown > 0) return;
  const def = selectedActiveSkillDef();
  if (!def) {
    logEvent("NO ACTIVE SKILL");
    return;
  }
  const level = researchLevel(def.id);
  if (def.id === "sandBreaker") activateSandBreaker(level);
  if (def.id === "gravityAnchor") activateGravityAnchor(level);
  if (def.id === "phaseAnchor") activatePhasePin(level);
  run.dashCooldown = activeSkillCooldown(def.id);
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
    logEvent("CORE BREAK MISS");
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
  if (run.gravityFlip) {
    run.gravityFlip = false;
    player.vy *= -0.2;
  }
  burst(player.x + player.w / 2, player.y + getPlayerHeight(), "#48bde7", 10);
  logEvent("GIANT ANCHOR");
}

function activatePhasePin(level) {
  run.phasePinTimer = Math.max(run.phasePinTimer, 0.3 + level * 0.08);
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
  player.animationStartedAt = performance.now();
}

function getStats() {
  const eq = equipmentBonuses();
  const idleMultiplier = 1 + (eq.idle || 0);
  return {
    speed: (5 * (1 + state.upgrades.speed * 0.012) * (1 + state.permanent.speed * 0.02) * (1 + (eq.speed || 0))),
    jumpPower: (1 + state.upgrades.jump * 0.03 + (eq.jump || 0)),
    equipmentJump: (eq.jump || 0) * BASE_JUMP_VELOCITY,
    maxHp: 1 + state.upgrades.hp + Math.floor(eq.hp || 0),
    coinMultiplier: (1 + state.upgrades.coin * 0.08) * (1 + state.permanent.coin * 0.05) * (1 + (eq.coin || 0)),
    directCoinMultiplier: 1 + runnerDirectCoinBonus(),
    magnetRadius: 44 + state.upgrades.magnet * 8,
    maxCombo: 2 + state.upgrades.combo * 0.08,
    regenEvery: state.upgrades.regen > 0 ? Math.max(10, 32 - state.upgrades.regen * 0.5) : 0,
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

function isActiveResearch(id) {
  return Boolean(researchDefs.find((def) => def.id === id)?.active);
}

function passiveResearchLevel(id) {
  return isActiveResearch(id) ? 0 : researchLevel(id);
}

function researchChance(id, perLevel = 0.02) {
  return Math.random() < passiveResearchLevel(id) * perLevel;
}

function researchReduction(id, perLevel = 0.02) {
  return Math.max(0.75, 1 - passiveResearchLevel(id) * perLevel);
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
      x: canvasWidth + 150 + i * HAZARD_MIN_GAP,
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

function nextAreaBossDistance(index) {
  const nextArea = areas[index + 1];
  if (!nextArea) return Infinity;
  return Math.max(0, nextArea.start - FINAL_BOSS_OFFSET);
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
  const html = [
    panelHead("通常強化", `Lv合計 ${sumValues(state.upgrades)} / 上限 Lv${cap}`),
    renderActiveSkillSelector(),
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

function renderActiveSkillSelector() {
  const current = state.settings.activeSkill || "none";
  const unlocked = activeSkillDefs.filter((def) => researchLevel(def.id) > 0 && isResearchDiscovered(def));
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
  const html = [
    panelHead("Prestige", `転生 ${state.prestigeCount}回`),
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
          ${debugEquipmentValueControl(item)}
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
  const visibleDefs = visibleResearchDefs();
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
      ${visibleDefs.length ? visibleDefs.map((def) => {
        const level = state.researchTree[def.id] || 0;
        const capped = level >= cap;
        const cost = upgradeCost(def, level);
        const typeMeta = def.active ? [`アクティブ`, `CD ${def.cooldown}s`] : [`パッシブ`];
        return rowItem({
          title: `${def.name} Lv${level}`,
          desc: `${def.description} 現在: ${def.effect(level)}`,
          meta: capped
            ? [...typeMeta, `上限 Lv${cap}`, `転生で上限 +1`]
            : [...typeMeta, `次 ${def.effect(level + 1)}`, `${formatNumber(cost)} LAB`, `上限 Lv${cap}`],
          action: "buyResearch",
          id: def.id,
          disabled: capped || state.research < cost,
          label: capped ? "上限" : "研究"
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
  const justiceMode = run.bossBattle && activeBossSoulMode() === "yellow";
  dashButton.disabled = run.gameOver || (justiceMode ? run.justiceCooldown > 0 : (run.dashCooldown > 0 || !selectedActiveSkillDef()));
  dashButton.textContent = justiceMode
    ? `${currentLanguage === "en" ? "Shot" : "ショット"}\nD`
    : run.dashCooldown > 0 ? `${Math.ceil(run.dashCooldown)}s\nD` : `${translateText(activeSkillName())}\nD`;
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
  drawForeground(area);
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
  const blink = player.invulnerable > 0 && Math.floor(performance.now() / 80) % 2 === 0;
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
  if (run.bossBattle && animation === "running") {
    return frames[0] || frames[frames.length - 1];
  }
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
