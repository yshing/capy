import * as THREE from 'three';
import {
  createToonMaterial,
  addOutline,
  createAnimeWaterMaterial,
  createProceduralTexture,
} from './toonShader.js';
import { createYuzuMesh } from './capybara.js';

const sharedWoodTex = createProceduralTexture('wood');
const sharedGrassTex = createProceduralTexture('grass');
const sharedSteamTex = createProceduralTexture('steam');
const onsenSignTex = createProceduralTexture('onsenSign');

/**
 * 建立一棵盛開的 3渲2 動漫櫻花樹（彎曲樹幹＋多層粉嫩花團）
 */
function createSakuraTree() {
  const tree = new THREE.Group();

  const barkMat = createToonMaterial({
    color: '#7a5241',
    midColor: '#613e31',
    shadowColor: '#422823',
    map: sharedWoodTex,
    uvRepeat: [1.5, 3],
    rimStrength: 0.25,
  });

  // 主樹幹（微向右傾，自然探向溫泉池上方）
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(-0.08, 0.85, 0.05),
    new THREE.Vector3(0.18, 1.85, 0.12),
    new THREE.Vector3(0.75, 2.75, 0.28),
    new THREE.Vector3(1.55, 3.18, 0.45),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 22, 0.22, 10, false);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  addOutline(trunk, 0.02);
  tree.add(trunk);

  // 樹根膨大感
  const rootBase = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.65, 10), barkMat);
  rootBase.position.y = 0.22;
  addOutline(rootBase, 0.018);
  tree.add(rootBase);

  // 左側分支
  const branchCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, 1.75, 0.1),
    new THREE.Vector3(-0.45, 2.45, -0.1),
    new THREE.Vector3(-1.05, 2.82, -0.25),
  ]);
  const branch1 = new THREE.Mesh(
    new THREE.TubeGeometry(branchCurve1, 14, 0.12, 8, false),
    barkMat
  );
  addOutline(branch1, 0.015);
  tree.add(branch1);

  // 前向分支
  const branchCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.55, 2.55, 0.22),
    new THREE.Vector3(0.85, 2.95, 0.88),
    new THREE.Vector3(1.25, 3.05, 1.35),
  ]);
  const branch2 = new THREE.Mesh(
    new THREE.TubeGeometry(branchCurve2, 12, 0.095, 8, false),
    barkMat
  );
  addOutline(branch2, 0.014);
  tree.add(branch2);

  // 多層次動漫粉櫻花團（三種粉嫩色階交錯）
  const sakuraMats = [
    createToonMaterial({
      color: '#ffd1e0',
      midColor: '#f9abc4',
      shadowColor: '#d97b9e',
      rimStrength: 0.45,
    }),
    createToonMaterial({
      color: '#ffb7cf',
      midColor: '#f08fae',
      shadowColor: '#c76488',
      rimStrength: 0.4,
    }),
    createToonMaterial({
      color: '#ffe5ee',
      midColor: '#ffc2d6',
      shadowColor: '#df8ba8',
      rimStrength: 0.5,
    }),
  ];

  const blossomClusters = [
    [0.85, 3.45, 0.35, 1.12, 0],
    [1.68, 3.22, 0.52, 0.96, 2],
    [2.18, 2.95, 0.45, 0.72, 1],
    [0.12, 3.25, 0.15, 0.98, 1],
    [-0.65, 3.02, -0.15, 0.95, 0],
    [-1.25, 2.82, -0.32, 0.76, 2],
    [1.22, 3.12, 1.28, 0.82, 0],
    [0.62, 3.22, 1.05, 0.78, 2],
    [1.32, 3.72, 0.12, 0.85, 2],
    [-0.15, 3.65, -0.25, 0.84, 0],
    [0.45, 2.95, -0.45, 0.76, 1],
    [1.55, 2.75, 0.95, 0.64, 1],
  ];

  const puffGeo = new THREE.DodecahedronGeometry(0.85, 2);
  blossomClusters.forEach(([x, y, z, s, matIdx]) => {
    const puff = new THREE.Mesh(puffGeo, sakuraMats[matIdx]);
    puff.position.set(x, y, z);
    puff.scale.set(s * 1.12, s * 0.78, s * 1.06);
    puff.rotation.set(x * 0.5, y * 0.7, z * 0.4);
    addOutline(puff, 0.022, '#7d4458');
    tree.add(puff);
  });

  return tree;
}

/**
 * 建立日式竹籬笆（沿著溫泉池後方弧形排列）
 */
function createBambooFence() {
  const fence = new THREE.Group();

  const bambooMat = createToonMaterial({
    color: '#c7b887',
    midColor: '#ae9d6d',
    shadowColor: '#7d6e4c',
    rimStrength: 0.22,
  });
  const ropeMat = createToonMaterial({
    color: '#4a3529',
    shadowColor: '#2b1d16',
    rimStrength: 0.1,
  });

  const radius = 3.72;
  const startAngle = -Math.PI * 0.88;
  const endAngle = -Math.PI * 0.14;
  const count = 24;

  const poleGeo = new THREE.CylinderGeometry(0.055, 0.062, 1.45, 8);
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const angle = startAngle + (endAngle - startAngle) * t;
    const heightVar = 1.0 + Math.sin(i * 1.9) * 0.05;
    const pole = new THREE.Mesh(poleGeo, bambooMat);
    pole.position.set(Math.cos(angle) * radius, 0.46 * heightVar, Math.sin(angle) * radius);
    pole.scale.y = heightVar;
    addOutline(pole, 0.01);
    fence.add(pole);
  }

  // 兩道橫向竹條＋黑繩綁結
  [0.32, 0.86].forEach((y) => {
    const curvePts = [];
    for (let i = 0; i <= 12; i++) {
      const a = startAngle + ((endAngle - startAngle) * i) / 12;
      curvePts.push(new THREE.Vector3(Math.cos(a) * (radius - 0.06), y, Math.sin(a) * (radius - 0.06)));
    }
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 24, 0.042, 8, false),
      bambooMat
    );
    addOutline(rail, 0.009);
    fence.add(rail);

    for (let i = 1; i < 12; i += 2) {
      const a = startAngle + ((endAngle - startAngle) * i) / 12;
      const knot = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 6, 10), ropeMat);
      knot.position.set(Math.cos(a) * (radius - 0.05), y, Math.sin(a) * (radius - 0.05));
      knot.rotation.y = -a;
      fence.add(knot);
    }
  });

  return fence;
}

/**
 * 建立檜木浴桶＋摺疊白毛巾＋木勺（放在池邊增添生活感）
 */
function createHinokiBucketProp() {
  const group = new THREE.Group();

  const woodMat = createToonMaterial({
    color: '#e3b882',
    midColor: '#ca9a64',
    shadowColor: '#91663f',
    map: sharedWoodTex,
    rimStrength: 0.25,
  });
  const hoopMat = createToonMaterial({
    color: '#c79244',
    shadowColor: '#855c24',
    rimStrength: 0.2,
  });

  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.26, 16), woodMat);
  bucket.position.y = 0.13;
  addOutline(bucket, 0.012);
  group.add(bucket);

  // 兩道銅箍
  [0.08, 0.2].forEach((y) => {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.258 + y * 0.08, 0.014, 8, 20), hoopMat);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = y;
    group.add(hoop);
  });

  // 內部水面
  const innerWater = new THREE.Mesh(
    new THREE.CircleGeometry(0.245, 16),
    new THREE.MeshBasicMaterial({ color: '#8ee8ea' })
  );
  innerWater.rotation.x = -Math.PI / 2;
  innerWater.position.y = 0.24;
  group.add(innerWater);

  // 斜靠在桶邊的小木勺
  const ladle = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.42, 8), woodMat);
  handle.rotation.z = -0.95;
  handle.position.set(0.18, 0.34, 0);
  addOutline(handle, 0.006);
  ladle.add(handle);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.085, 10), woodMat);
  cup.position.set(0.01, 0.24, 0);
  addOutline(cup, 0.008);
  ladle.add(cup);
  group.add(ladle);

  return group;
}

/**
 * 建立漂浮在水上的日式木托盤（抹茶杯＋三色花見團子 🍡）
 */
function createFloatingTeaTray() {
  const tray = new THREE.Group();

  const trayWoodMat = createToonMaterial({
    color: '#c98850',
    midColor: '#aa6c3b',
    shadowColor: '#754424',
    map: sharedWoodTex,
    rimStrength: 0.25,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.055, 20), trayWoodMat);
  addOutline(base, 0.012);
  tray.add(base);

  // 抹茶茶碗
  const cupMat = createToonMaterial({
    color: '#f2eadc',
    midColor: '#dbd0bd',
    shadowColor: '#a69a88',
    rimStrength: 0.25,
  });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.072, 0.13, 14), cupMat);
  cup.position.set(-0.1, 0.09, 0.03);
  addOutline(cup, 0.009);
  tray.add(cup);

  const tea = new THREE.Mesh(
    new THREE.CircleGeometry(0.078, 14),
    new THREE.MeshBasicMaterial({ color: '#78b856' })
  );
  tea.rotation.x = -Math.PI / 2;
  tea.position.set(-0.1, 0.152, 0.03);
  tray.add(tea);

  // 三色花見團子（粉、白、抹茶綠）
  const dangoColors = ['#ff9fb5', '#fff8ee', '#82c464'];
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.34, 6),
    trayWoodMat
  );
  stick.rotation.z = Math.PI / 2 - 0.18;
  stick.position.set(0.11, 0.08, -0.05);
  tray.add(stick);

  dangoColors.forEach((col, i) => {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 12, 10),
      createToonMaterial({ color: col, rimStrength: 0.35 })
    );
    ball.position.set(0.02 + i * 0.085, 0.072 + i * 0.015, -0.05);
    addOutline(ball, 0.007);
    tray.add(ball);
  });

  return tray;
}

/**
 * 建立日式「ゆ」柚子溫泉木牌
 */
function createOnsenSignpost() {
  const sign = new THREE.Group();

  const postMat = createToonMaterial({
    color: '#9c6844',
    midColor: '#7d4f33',
    shadowColor: '#543322',
    map: sharedWoodTex,
    rimStrength: 0.2,
  });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.35, 10), postMat);
  post.position.y = 0.62;
  addOutline(post, 0.012);
  sign.add(post);

  // 可愛小瓦片屋簷
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.07, 0.28), postMat);
  roof.position.set(0, 1.32, 0);
  addOutline(roof, 0.012);
  sign.add(roof);

  // 正反面帶「ゆ 柚子溫泉」手繪貼圖的木牌
  const boardGeo = new THREE.BoxGeometry(0.72, 0.66, 0.07);
  const faceMat = createToonMaterial({
    color: '#ffffff',
    midColor: '#f2e6d5',
    shadowColor: '#cbbba8',
    map: onsenSignTex,
    rimStrength: 0.15,
  });
  const board = new THREE.Mesh(boardGeo, [postMat, postMat, postMat, postMat, faceMat, faceMat]);
  board.position.set(0, 0.96, 0.03);
  addOutline(board, 0.014);
  sign.add(board);

  return sign;
}

/**
 * 建立遠景動漫群山與富士山（消除空曠背景，營造完整日本溫泉鄉氣氛）
 */
function createDistantMountains() {
  const group = new THREE.Group();

  const farMountainMat = createToonMaterial({
    color: '#88b3c9',
    midColor: '#749db8',
    shadowColor: '#5a7f9e',
    rimStrength: 0.12,
  });

  const midHillMat = createToonMaterial({
    color: '#79b88c',
    midColor: '#63a078',
    shadowColor: '#487a60',
    rimStrength: 0.12,
  });

  // 遠方富士山
  const fujiGroup = new THREE.Group();
  fujiGroup.position.set(-14, -3.5, -26);
  const fujiBody = new THREE.Mesh(new THREE.ConeGeometry(12.5, 11.5, 24), farMountainMat);
  fujiBody.position.y = 5.5;
  fujiGroup.add(fujiBody);

  const fujiSnow = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 3.8, 24),
    createToonMaterial({
      color: '#ffffff',
      midColor: '#eaf3ff',
      shadowColor: '#c3d6f0',
      rimStrength: 0.2,
    })
  );
  fujiSnow.position.y = 9.45;
  fujiGroup.add(fujiSnow);
  group.add(fujiGroup);

  // 環繞地平線的柔美山丘剪影
  const hillConfigs = [
    { pos: [16, -4.2, -24], r: 11, h: 7.2, mat: farMountainMat },
    { pos: [28, -4.5, -6], r: 12, h: 6.4, mat: midHillMat },
    { pos: [-26, -4.5, -8], r: 11, h: 6.8, mat: midHillMat },
    { pos: [2, -4.4, -29], r: 14, h: 7.5, mat: farMountainMat },
    { pos: [18, -4.8, 22], r: 12, h: 5.5, mat: farMountainMat },
    { pos: [-18, -4.8, 20], r: 11, h: 5.2, mat: midHillMat },
  ];

  hillConfigs.forEach((cfg) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(cfg.r, cfg.h, 18), cfg.mat);
    hill.position.set(...cfg.pos);
    hill.position.y += cfg.h * 0.45;
    hill.scale.set(1.3, 1.0, 0.85);
    group.add(hill);
  });

  return group;
}

/**
 * 建立完整的日式露天柚子溫泉場景
 */
export function createOnsenEnvironment() {
  const group = new THREE.Group();
  group.name = 'onsen_environment';

  // === 1. 柔和浮島草地底座（去除生硬粗黑圓框，改為自然圓潤草丘＋石崖底座）===
  const grassMat = createToonMaterial({
    color: '#8fd173',
    midColor: '#75ba5c',
    shadowColor: '#4f8a47',
    map: sharedGrassTex,
    uvRepeat: [4, 4],
    rimStrength: 0.22,
  });

  const earthMat = createToonMaterial({
    color: '#a38063',
    midColor: '#85654d',
    shadowColor: '#5c4236',
    rimStrength: 0.12,
  });

  const grassDisk = new THREE.Mesh(new THREE.CylinderGeometry(4.45, 4.65, 0.46, 48), grassMat);
  grassDisk.position.y = -0.35;
  addOutline(grassDisk, 0.018, '#4e6e3f');
  group.add(grassDisk);

  const islandBase = new THREE.Mesh(new THREE.CylinderGeometry(4.56, 2.45, 1.38, 32), earthMat);
  islandBase.position.y = -1.22;
  addOutline(islandBase, 0.022, '#5c3f31');
  group.add(islandBase);

  // === 2. 地面豐富細節：飛石步道、48 叢手繪感草叢、粉白黃小野花 ===
  const stepStoneMat = createToonMaterial({
    color: '#b7b9bd',
    midColor: '#989ca3',
    shadowColor: '#6b707d',
    rimStrength: 0.22,
  });
  const steppingStones = [
    [0.05, -0.09, 3.05, 0.48, 0.34, 0.2],
    [0.45, -0.09, 3.68, 0.42, 0.3, -0.35],
    [-0.52, -0.09, 3.55, 0.38, 0.28, 0.5],
    [2.75, -0.09, 1.85, 0.42, 0.32, -0.2],
    [-2.85, -0.09, 1.55, 0.4, 0.3, 0.4],
  ];
  steppingStones.forEach(([x, y, z, sx, sz, ry]) => {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.05, 0.1, 10), stepStoneMat);
    st.position.set(x, y, z);
    st.scale.set(sx, 1, sz);
    st.rotation.y = ry;
    addOutline(st, 0.012);
    group.add(st);
  });

  // 可愛小草叢與野花（填滿草地空曠感！）
  const tuftMat = createToonMaterial({
    color: '#79c25b',
    midColor: '#5ea646',
    shadowColor: '#3f7836',
    rimStrength: 0.22,
    doubleSided: true,
  });
  const flowerColors = ['#fff9db', '#ffafc7', '#ffd666', '#ffffff'];
  const flowerMats = flowerColors.map((c) => createToonMaterial({ color: c, rimStrength: 0.3 }));
  const bladeGeo = new THREE.ConeGeometry(0.05, 0.26, 5);

  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2 + (i % 3) * 0.08;
    const dist = 2.85 + (i % 5) * 0.28 + Math.sin(i * 3.1) * 0.18;
    if (dist > 4.22) continue;

    const gx = Math.cos(angle) * dist;
    const gz = Math.sin(angle) * dist;

    // 避開正前方飛石區域
    if (Math.hypot(gx - 0.1, gz - 3.35) < 0.72) continue;

    const clump = new THREE.Group();
    clump.position.set(gx, -0.11, gz);
    clump.rotation.y = angle;

    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(bladeGeo, tuftMat);
      blade.position.set((b - 1) * 0.055, 0.11, (b % 2) * 0.03);
      blade.rotation.z = (b - 1) * 0.26;
      blade.scale.y = 0.78 + (b % 2) * 0.35;
      clump.add(blade);
    }

    // 約四成草叢加上小朵野花
    if (i % 2 === 0) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.052, 8, 6),
        flowerMats[i % flowerMats.length]
      );
      flower.scale.set(1.1, 0.55, 1.1);
      flower.position.set(0.02, 0.22, 0.02);
      clump.add(flower);
    }

    group.add(clump);
  }

  // === 3. 溫泉池底、圓潤檜木圍邊與動漫水面 ===
  const basinMat = createToonMaterial({
    color: '#4e7580',
    shadowColor: '#2c4a54',
    rimStrength: 0.05,
  });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.36, 2.25, 0.16, 40), basinMat);
  basin.position.y = -0.18;
  group.add(basin);

  const woodMat = createToonMaterial({
    color: '#e0af79',
    midColor: '#c6915b',
    shadowColor: '#8c5c38',
    map: sharedWoodTex,
    rimStrength: 0.26,
  });

  // 圓潤無銳利縫隙的環形檜木池緣
  const rimTorus = new THREE.Mesh(new THREE.TorusGeometry(2.44, 0.22, 14, 48), woodMat);
  rimTorus.rotation.x = Math.PI / 2;
  rimTorus.scale.set(1, 1, 1.15);
  rimTorus.position.y = 0.0;
  addOutline(rimTorus, 0.018);
  group.add(rimTorus);

  // 3渲2 動漫溫泉水面
  const waterMat = createAnimeWaterMaterial();
  const waterMesh = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.06;
  waterMesh.name = 'onsen_water';
  group.add(waterMesh);

  // === 4. 動漫造景苔石群 ===
  const rockMat = createToonMaterial({
    color: '#9aa4ad',
    midColor: '#7d8894',
    shadowColor: '#535c6b',
    rimStrength: 0.26,
  });
  const mossMat = createToonMaterial({
    color: '#7ec462',
    midColor: '#63a64b',
    shadowColor: '#43783b',
    rimStrength: 0.25,
  });

  const rockConfigs = [
    { pos: [-2.42, 0.22, -1.35], scale: [0.95, 0.72, 0.85], rot: [0.2, 0.6, 0.1], moss: true },
    { pos: [-2.95, 0.08, -0.52], scale: [0.62, 0.48, 0.58], rot: [0.1, 1.2, 0.2], moss: false },
    { pos: [2.42, 0.26, -1.45], scale: [1.05, 0.82, 0.9], rot: [0.15, -0.5, 0.08], moss: true },
    { pos: [2.88, 0.08, -0.35], scale: [0.68, 0.45, 0.62], rot: [0.2, 0.4, 0.1], moss: false },
    { pos: [1.78, 0.08, 2.35], scale: [0.74, 0.44, 0.56], rot: [0.1, 0.9, 0.1], moss: true },
    { pos: [-1.85, 0.09, 2.22], scale: [0.78, 0.48, 0.6], rot: [0.2, -0.8, 0.05], moss: false },
    { pos: [0.2, 0.34, -2.85], scale: [1.35, 0.92, 0.88], rot: [0.1, 0.3, 0.05], moss: true },
  ];

  const rockGeo = new THREE.DodecahedronGeometry(0.68, 1);
  rockConfigs.forEach((cfg) => {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(...cfg.pos);
    rock.scale.set(...cfg.scale);
    rock.rotation.set(...cfg.rot);
    addOutline(rock, 0.02);
    group.add(rock);

    if (cfg.moss) {
      const moss = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 10), mossMat);
      moss.scale.set(cfg.scale[0] * 0.96, cfg.scale[1] * 0.34, cfg.scale[2] * 0.92);
      moss.position.set(cfg.pos[0], cfg.pos[1] + cfg.scale[1] * 0.45, cfg.pos[2]);
      group.add(moss);
    }
  });

  // === 5. 盛開櫻花樹、竹籬笆、「ゆ」木牌、檜木水桶 ===
  const sakuraTree = createSakuraTree();
  sakuraTree.position.set(-2.95, -0.1, -1.95);
  sakuraTree.rotation.y = 0.25;
  group.add(sakuraTree);

  const bambooFence = createBambooFence();
  group.add(bambooFence);

  const signPost = createOnsenSignpost();
  signPost.position.set(2.92, -0.12, 1.38);
  signPost.rotation.y = -0.58;
  group.add(signPost);

  const hinokiBucket = createHinokiBucketProp();
  hinokiBucket.position.set(-2.58, -0.12, 1.65);
  hinokiBucket.rotation.y = 0.7;
  group.add(hinokiBucket);

  // 漂浮抹茶團子木盤
  const floatingTray = createFloatingTeaTray();
  floatingTray.position.set(-1.15, 0.08, 1.18);
  group.add(floatingTray);

  // === 6. 日式竹筒溫泉出水口（添水）===
  const bambooGreenMat = createToonMaterial({
    color: '#7ec05c',
    midColor: '#62a146',
    shadowColor: '#3f702f',
    rimStrength: 0.3,
  });

  const spoutGroup = new THREE.Group();
  spoutGroup.position.set(-1.95, 0.1, -1.35);
  spoutGroup.rotation.y = Math.PI * 0.24;
  group.add(spoutGroup);

  [-0.22, 0.22].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.072, 1.35, 12), bambooGreenMat);
    post.position.set(x, 0.58, 0);
    addOutline(post, 0.013);
    spoutGroup.add(post);
  });

  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.1, 1.25, 14), bambooGreenMat);
  pipe.rotation.x = Math.PI / 2 + 0.16;
  pipe.position.set(0, 0.95, 0.22);
  addOutline(pipe, 0.015);
  spoutGroup.add(pipe);

  const streamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.85, 0.8),
    new THREE.Vector3(0, 0.65, 0.98),
    new THREE.Vector3(0, 0.32, 1.06),
    new THREE.Vector3(0, -0.02, 1.08),
  ]);
  const waterStream = new THREE.Mesh(
    new THREE.TubeGeometry(streamCurve, 18, 0.048, 10, false),
    new THREE.MeshBasicMaterial({ color: '#e2fdff', transparent: true, opacity: 0.88 })
  );
  spoutGroup.add(waterStream);

  // === 7. 日式石燈籠 ===
  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(2.42, 0.0, -1.92);
  lanternGroup.rotation.y = -0.5;
  group.add(lanternGroup);

  const lanternStoneMat = createToonMaterial({
    color: '#b8b8b2',
    midColor: '#9a9a94',
    shadowColor: '#696c73',
    rimStrength: 0.25,
  });

  const lanternGlowMat = createToonMaterial({
    color: '#fff1c1',
    midColor: '#ffda79',
    shadowColor: '#f0b143',
    emissive: '#ffaa33',
    emissiveStrength: 0.15,
    rimStrength: 0.1,
  });

  const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.24, 6), lanternStoneMat);
  lBase.position.y = 0.12;
  addOutline(lBase, 0.015);
  lanternGroup.add(lBase);

  const lPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.68, 8), lanternStoneMat);
  lPillar.position.y = 0.56;
  addOutline(lPillar, 0.014);
  lanternGroup.add(lPillar);

  const lMid = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.22, 0.16, 6), lanternStoneMat);
  lMid.position.y = 0.96;
  addOutline(lMid, 0.014);
  lanternGroup.add(lMid);

  const lCore = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.34, 6), lanternGlowMat);
  lCore.position.y = 1.2;
  addOutline(lCore, 0.012);
  lanternGroup.add(lCore);

  const lRoof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.32, 6), lanternStoneMat);
  lRoof.position.y = 1.5;
  addOutline(lRoof, 0.015);
  lanternGroup.add(lRoof);

  const lTip = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), lanternStoneMat);
  lTip.position.y = 1.69;
  addOutline(lTip, 0.01);
  lanternGroup.add(lTip);

  // === 8. 漂浮在池中的可愛柚子（含水面碰撞避讓物理，絕不穿過零食盤或卡皮巴拉）===
  const floatingYuzus = [];
  const yuzuHitTargets = [];
  const waterObstacles = [
    { x: -1.15, z: 1.18, r: 0.44 }, // 漂浮抹茶團子木盤
    { x: -0.2, z: -0.1, r: 1.06 },  // 大卡皮巴拉身體
    { x: -0.08, z: 0.52, r: 0.72 }, // 大卡皮巴拉頭部與前掌
    { x: 1.18, z: 0.62, r: 0.56 },  // 小卡皮巴拉寶寶
    { x: -1.42, z: -0.92, r: 0.34 }, // 竹筒落水處
  ];

  const floatingConfigs = [
    { x: 0.42, z: 1.78, dir: 1, scale: 0.84 },
    { x: -1.78, z: 0.25, dir: -1, scale: 0.78 },
    { x: -0.68, z: -1.68, dir: 1, scale: 0.82 },
    { x: 0.88, z: -1.58, dir: 1, scale: 0.88 },
    { x: 1.85, z: -0.58, dir: -1, scale: 0.75 },
    { x: 1.48, z: 1.45, dir: 1, scale: 0.72 },
  ];

  floatingConfigs.forEach((cfg, idx) => {
    const yuzu = createYuzuMesh(cfg.scale);
    yuzu.userData.floatingIndex = idx;
    group.add(yuzu);

    yuzu.traverse((child) => {
      if (child.isMesh && !child.name.endsWith('_outline')) {
        child.userData.floatingIndex = idx;
        yuzuHitTargets.push(child);
      }
    });

    const colRadius = 0.23 * cfg.scale;
    floatingYuzus.push({
      mesh: yuzu,
      x: cfg.x,
      z: cfg.z,
      vx: 0,
      vz: 0,
      dir: cfg.dir,
      colRadius,
      phase: idx * 1.4,
      bounceVel: 0,
      bounceY: 0,
    });
  });

  function bounceFloatingYuzu(index) {
    const item = floatingYuzus[index];
    if (item) {
      item.bounceVel = 2.6;
      item.vx += (Math.random() - 0.5) * 0.5;
      item.vz += (Math.random() - 0.5) * 0.5;
    }
  }

  // === 9. 柔和手繪感溫泉蒸氣（改用徑向柔焦精靈，告別生硬白圓球）===
  const steamGroup = new THREE.Group();
  group.add(steamGroup);

  const steamPuffs = [];
  for (let i = 0; i < 14; i++) {
    const mat = new THREE.SpriteMaterial({
      map: sharedSteamTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const angle = Math.random() * Math.PI * 2;
    const r = 0.4 + Math.random() * 1.55;
    steamPuffs.push({
      sprite,
      mat,
      baseX: Math.cos(angle) * r,
      baseZ: Math.sin(angle) * r,
      life: Math.random(),
      speed: 0.16 + Math.random() * 0.12,
      sway: 0.5 + Math.random() * 0.7,
      baseScale: 0.85 + Math.random() * 0.75,
    });
    steamGroup.add(sprite);
  }

  // === 10. 飄落櫻花花瓣 ===
  const petalsGroup = new THREE.Group();
  group.add(petalsGroup);

  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.05, 0.05, 0.07, 0.14, 0.015, 0.17);
  petalShape.lineTo(0, 0.135);
  petalShape.lineTo(-0.015, 0.17);
  petalShape.bezierCurveTo(-0.07, 0.14, -0.05, 0.05, 0, 0);

  const petalGeo = new THREE.ShapeGeometry(petalShape, 6);
  const petalMat = new THREE.MeshBasicMaterial({
    color: '#ffb7cc',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });

  const petals = [];
  for (let i = 0; i < 48; i++) {
    const mesh = new THREE.Mesh(petalGeo, petalMat);
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      Math.random() * 5.8 + 0.3,
      (Math.random() - 0.5) * 10
    );
    mesh.scale.setScalar(0.65 + Math.random() * 0.55);
    petalsGroup.add(mesh);
    petals.push({
      mesh,
      fallSpeed: 0.3 + Math.random() * 0.34,
      driftSpeed: 0.25 + Math.random() * 0.35,
      spinX: (Math.random() - 0.5) * 2.2,
      spinY: (Math.random() - 0.5) * 2.5,
      spinZ: (Math.random() - 0.5) * 2.0,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // === 11. 遠景群山、富士山與動漫膨鬆白雲 ===
  const mountains = createDistantMountains();
  group.add(mountains);

  const cloudsGroup = new THREE.Group();
  group.add(cloudsGroup);

  const cloudMat = createToonMaterial({
    color: '#ffffff',
    midColor: '#f2f6ff',
    shadowColor: '#d0def2',
    rimStrength: 0.25,
  });

  const cloudPositions = [
    { pos: [-12, 8.2, -18], scale: 1.55 },
    { pos: [13, 9.0, -20], scale: 1.75 },
    { pos: [19, 6.8, -4], scale: 1.3 },
    { pos: [-17, 7.2, 8], scale: 1.35 },
    { pos: [2, 9.6, 19], scale: 1.4 },
  ];

  const clouds = [];
  cloudPositions.forEach((cfg, idx) => {
    const cGroup = new THREE.Group();
    const puffs = [
      [0, 0, 0, 1.3],
      [-1.05, -0.18, 0.1, 0.95],
      [1.08, -0.15, -0.05, 1.0],
      [0.35, 0.45, 0.15, 0.85],
    ];
    puffs.forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), cloudMat);
      m.position.set(x, y, z);
      m.scale.y = 0.78;
      cGroup.add(m);
    });
    cGroup.position.set(...cfg.pos);
    cGroup.scale.setScalar(cfg.scale);
    cloudsGroup.add(cGroup);
    clouds.push({ group: cGroup, basePos: new THREE.Vector3(...cfg.pos), phase: idx * 1.2 });
  });

  // === 更新動畫 ===
  function update(dt, elapsed, showPetals) {
    // 漂浮柚子輕柔水流漂移＋即時碰撞避讓（零食木盤、大小卡皮巴拉、池緣與彼此）
    const poolMaxR = 2.12;
    for (let i = 0; i < floatingYuzus.length; i++) {
      const item = floatingYuzus[i];
      const distFromCenter = Math.hypot(item.x, item.z) || 0.001;
      const tx = (-item.z / distFromCenter) * item.dir;
      const tz = (item.x / distFromCenter) * item.dir;
      const targetSpeed = 0.24;
      item.vx += (tx * targetSpeed - item.vx) * Math.min(1, dt * 1.8);
      item.vz += (tz * targetSpeed - item.vz) * Math.min(1, dt * 1.8);
      item.vx += Math.sin(elapsed * 0.9 + item.phase) * 0.05 * dt;
      item.vz += Math.cos(elapsed * 0.8 + item.phase) * 0.05 * dt;

      item.x += item.vx * dt;
      item.z += item.vz * dt;

      // 避開零食木盤、大小卡皮巴拉與落水口
      for (const obs of waterObstacles) {
        const dx = item.x - obs.x;
        const dz = item.z - obs.z;
        const d = Math.hypot(dx, dz) || 0.0001;
        const minDist = obs.r + item.colRadius;
        if (d < minDist) {
          const nx = dx / d;
          const nz = dz / d;
          item.x = obs.x + nx * minDist;
          item.z = obs.z + nz * minDist;
          const vn = item.vx * nx + item.vz * nz;
          if (vn < 0) {
            item.vx -= 1.45 * vn * nx;
            item.vz -= 1.45 * vn * nz;
          }
        }
      }

      // 保持在溫泉池內側
      const curR = Math.hypot(item.x, item.z) || 0.0001;
      const maxR = poolMaxR - item.colRadius;
      if (curR > maxR) {
        const nx = item.x / curR;
        const nz = item.z / curR;
        item.x = nx * maxR;
        item.z = nz * maxR;
        const vn = item.vx * nx + item.vz * nz;
        if (vn > 0) {
          item.vx -= 1.4 * vn * nx;
          item.vz -= 1.4 * vn * nz;
        }
      }
    }

    // 柚子之間互相柔和彈開
    for (let i = 0; i < floatingYuzus.length; i++) {
      for (let j = i + 1; j < floatingYuzus.length; j++) {
        const a = floatingYuzus[i];
        const b = floatingYuzus[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d = Math.hypot(dx, dz) || 0.0001;
        const minDist = a.colRadius + b.colRadius + 0.04;
        if (d < minDist) {
          const nx = dx / d;
          const nz = dz / d;
          const overlap = (minDist - d) * 0.5;
          a.x -= nx * overlap;
          a.z -= nz * overlap;
          b.x += nx * overlap;
          b.z += nz * overlap;
          const rvx = b.vx - a.vx;
          const rvz = b.vz - a.vz;
          const vn = rvx * nx + rvz * nz;
          if (vn < 0) {
            const imp = -0.65 * vn;
            a.vx -= imp * nx;
            a.vz -= imp * nz;
            b.vx += imp * nx;
            b.vz += imp * nz;
          }
        }
      }
    }

    floatingYuzus.forEach((item) => {
      if (item.bounceY > 0 || item.bounceVel !== 0) {
        item.bounceVel -= 9.2 * dt;
        item.bounceY += item.bounceVel * dt;
        if (item.bounceY <= 0) {
          item.bounceY = 0;
          item.bounceVel = Math.abs(item.bounceVel) > 0.6 ? -item.bounceVel * 0.42 : 0;
        }
      }
      const bob = Math.sin(elapsed * 2.2 + item.phase) * 0.025;
      item.mesh.position.set(item.x, 0.04 + bob + item.bounceY, item.z);
      item.mesh.rotation.y = elapsed * 0.35 + item.phase;
      item.mesh.rotation.z = Math.sin(elapsed * 1.8 + item.phase) * 0.1;
    });

    // 漂浮抹茶團子木盤緩慢微晃
    floatingTray.position.y = 0.075 + Math.sin(elapsed * 1.9 + 0.8) * 0.02;
    floatingTray.rotation.z = Math.sin(elapsed * 1.5) * 0.045;
    floatingTray.rotation.y = 0.4 + Math.sin(elapsed * 0.4) * 0.12;

    // 櫻花樹枝微風輕輕搖曳
    sakuraTree.rotation.z = Math.sin(elapsed * 0.9) * 0.018;

    // 竹筒水流微抖動
    waterStream.scale.x = 1.0 + Math.sin(elapsed * 18.0) * 0.08;
    waterStream.scale.z = 1.0 + Math.cos(elapsed * 15.0) * 0.08;

    // 柔和蒸氣上升
    steamPuffs.forEach((p) => {
      p.life += p.speed * dt;
      if (p.life > 1) p.life -= 1;
      const t = p.life;
      p.sprite.position.set(
        p.baseX + Math.sin(elapsed * p.sway + t * 4.5) * 0.18,
        0.25 + t * 2.4,
        p.baseZ + Math.cos(elapsed * p.sway + t * 3.8) * 0.14
      );
      const scale = p.baseScale * (0.65 + t * 1.25);
      p.sprite.scale.set(scale, scale, 1);
      p.mat.opacity = Math.sin(t * Math.PI) * 0.55;
    });

    // 櫻花花瓣飄落
    petalsGroup.visible = showPetals;
    if (showPetals) {
      petals.forEach((p) => {
        p.mesh.position.y -= p.fallSpeed * dt;
        p.mesh.position.x += Math.sin(elapsed * 1.1 + p.phase) * p.driftSpeed * dt + 0.18 * dt;
        p.mesh.position.z += Math.cos(elapsed * 0.9 + p.phase) * p.driftSpeed * dt;
        p.mesh.rotation.x += p.spinX * dt;
        p.mesh.rotation.y += p.spinY * dt;
        p.mesh.rotation.z += p.spinZ * dt;

        if (p.mesh.position.y < -0.4) {
          p.mesh.position.y = 4.6 + Math.random() * 1.6;
          p.mesh.position.x = -2.2 + (Math.random() - 0.35) * 8.0;
          p.mesh.position.z = -1.5 + (Math.random() - 0.35) * 8.0;
        }
      });
    }

    clouds.forEach((c) => {
      c.group.position.y = c.basePos.y + Math.sin(elapsed * 0.35 + c.phase) * 0.35;
      c.group.rotation.y = Math.sin(elapsed * 0.12 + c.phase) * 0.08;
    });
  }

  return {
    group,
    waterMat,
    lanternGlowMat,
    yuzuHitTargets,
    bounceFloatingYuzu,
    update,
  };
}
