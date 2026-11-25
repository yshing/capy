import * as THREE from 'three';
import {
  globalToonUniforms,
  createToonMaterial,
  addOutline,
  createProceduralTexture,
} from './toonShader.js';

const sharedBlushTex = createProceduralTexture('blush');

/**
 * 專為「奶油圓潤 Q 版動漫卡皮巴拉」打造的 3渲2 噴槍漸層卡通材質
 * - 支援局部座標平滑漸層（吻部棕色噴槍暈染、耳尖與小腳掌漸層）
 * - 結合柔和賽璐璐光影與溫暖奶黃色調，消除雜亂筆觸與生硬接縫
 */
function createCapyAirbrushToonMaterial({
  baseColor = '#f4c78a',
  midColor = '#e4af72',
  shadowColor = '#c48758',
  gradientMode = 0, // 0: 身體, 1: 頭部(方圓吻部噴槍漸層), 2: 耳朵/小爪(末端漸層)
  tipColor = '#6b4e40',
  rimStrength = 0.36,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(baseColor) },
      uMidColor: { value: new THREE.Color(midColor) },
      uShadowColor: { value: new THREE.Color(shadowColor) },
      uTipColor: { value: new THREE.Color(tipColor) },
      uSnoutEdgeColor: { value: new THREE.Color('#c88d68') },
      uGradientMode: { value: gradientMode },
      uLightDir: globalToonUniforms.uLightDir,
      uLightColor: globalToonUniforms.uLightColor,
      uAmbientColor: globalToonUniforms.uAmbientColor,
      uRimColor: globalToonUniforms.uRimColor,
      uRimStrength: { value: rimStrength },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;

      void main() {
        vLocalPos = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseColor;
      uniform vec3 uMidColor;
      uniform vec3 uShadowColor;
      uniform vec3 uTipColor;
      uniform vec3 uSnoutEdgeColor;
      uniform int uGradientMode;
      uniform vec3 uLightDir;
      uniform vec3 uLightColor;
      uniform vec3 uAmbientColor;
      uniform vec3 uRimColor;
      uniform float uRimStrength;

      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 L = normalize(uLightDir);
        vec3 V = normalize(cameraPosition - vWorldPos);

        // 柔和 3渲2 賽璐璐光影（保留 Q 版模型滑順粉嫩的立體感）
        float ndotl = dot(N, L);
        float softHalfLambert = ndotl * 0.5 + 0.5;
        float band1 = smoothstep(0.32, 0.52, softHalfLambert);
        float band2 = smoothstep(0.62, 0.78, softHalfLambert);

        vec3 base = uBaseColor;
        vec3 mid = uMidColor;
        vec3 shadow = uShadowColor;

        if (uGradientMode == 1) {
          // === 頭部招牌方圓吻部噴槍漸層（M 字柔邊＋中央深棕霧面暈染）===
          float frontMask = smoothstep(0.46, 0.72, vLocalPos.z);
          // 頂部微微隆起的小山峰形狀（呼應參考圖鼻樑邊緣）
          float ridgeY = 0.14 - abs(vLocalPos.x) * 0.36 + 0.055 * exp(-pow(vLocalPos.x * 5.2, 2.0));
          float verticalMask = smoothstep(ridgeY + 0.06, ridgeY - 0.05, vLocalPos.y);
          float sideMask = smoothstep(0.44, 0.28, abs(vLocalPos.x));
          float snoutArea = frontMask * verticalMask * sideMask;

          // 中央較深的柔焦漸層
          vec2 snoutCenter = vec2(vLocalPos.x / 0.34, (vLocalPos.y + 0.09) / 0.28);
          float centerDist = length(snoutCenter);
          float deepMask = snoutArea * smoothstep(1.05, 0.18, centerDist);

          base = mix(base, uSnoutEdgeColor, snoutArea * 0.65);
          base = mix(base, uTipColor, deepMask * 0.92);

          mid = mix(mid, uSnoutEdgeColor * 0.9, snoutArea * 0.65);
          mid = mix(mid, uTipColor * 0.85, deepMask * 0.92);

          shadow = mix(shadow, uTipColor * 0.72, deepMask * 0.92);
        } else if (uGradientMode == 2) {
          // === 耳尖與小腳掌末端的柔和棕色漸層 ===
          float tipMask = smoothstep(0.02, 0.22, vLocalPos.z + vLocalPos.y * 0.6);
          base = mix(base, uTipColor, tipMask * 0.78);
          mid = mix(mid, uTipColor * 0.88, tipMask * 0.78);
          shadow = mix(shadow, uTipColor * 0.75, tipMask * 0.78);
        }

        vec3 celColor = mix(shadow, mid, band1);
        celColor = mix(celColor, base, band2);

        // 柔和明亮的環境光融合（避免暗部髒黑）
        vec3 lightingTint = mix(uAmbientColor * 0.96, uLightColor, 0.62 + 0.38 * band1);
        vec3 color = celColor * lightingTint;

        // 柔滑動漫邊緣高光
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);
        float rimMask = smoothstep(0.42, 0.64, fresnel) * smoothstep(-0.2, 0.4, ndotl);
        color += uRimColor * rimMask * uRimStrength;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

/**
 * 建立一顆超飽滿圓潤的 3渲2 柚子（滑順柑橘質感＋可愛蒂頭小葉）
 */
export function createYuzuMesh(scale = 1.0) {
  const group = new THREE.Group();

  const yuzuMat = createToonMaterial({
    color: '#ffb933',
    midColor: '#f79c1d',
    shadowColor: '#d97614',
    rimStrength: 0.42,
    specularStrength: 0.45,
    specularSize: 0.92,
  });

  const bodyGeo = new THREE.SphereGeometry(0.2, 24, 18);
  bodyGeo.scale(1.12, 0.86, 1.12);
  const body = new THREE.Mesh(bodyGeo, yuzuMat);
  addOutline(body, 0.015, '#593318');
  group.add(body);

  const nubGeo = new THREE.SphereGeometry(0.045, 10, 8);
  nubGeo.scale(1.0, 0.6, 1.0);
  const nub = new THREE.Mesh(nubGeo, yuzuMat);
  nub.position.y = 0.16;
  group.add(nub);

  const stemMat = createToonMaterial({
    color: '#6ec251',
    shadowColor: '#3f7a2f',
    rimStrength: 0.22,
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.052, 8), stemMat);
  stem.position.y = 0.195;
  group.add(stem);

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.08, 0.075, 0.17, 0.01);
  leafShape.quadraticCurveTo(0.08, -0.06, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.012,
    bevelEnabled: false,
  });
  const leaf = new THREE.Mesh(leafGeo, stemMat);
  leaf.position.set(0.01, 0.195, -0.006);
  leaf.rotation.set(0.32, 0.2, 0.35);
  addOutline(leaf, 0.006, '#385c27');
  group.add(leaf);

  group.scale.setScalar(scale);
  return group;
}

/**
 * 雕塑「動物星球／心寬體胖」風格的招牌方圓寬頰大頭：
 * - 圓滾飽滿的大頭＋平緩前伸的寬平吻部（像一顆軟綿綿的方形小吐司）
 * - 正面微平、臉頰圓鼓、沒有突兀球狀鼻頭
 */
function deformHeadPoint(v) {
  // 寬圓飽滿的大頭基礎比例
  v.x *= 1.02;
  v.y *= 0.88;
  v.z *= 1.16;

  // 頭頂微微圓平（方便穩穩頂住柚子）
  if (v.y > 0.38) {
    v.y = 0.38 + (v.y - 0.38) * 0.72;
  }

  // 往前延伸出招牌「方平圓潤大吻部」
  if (v.z > 0.08) {
    const t = Math.min(1, (v.z - 0.08) / 0.66);
    const smooth = t * t * (3 - 2 * t);
    v.z += smooth * 0.26;
    // 吻部微微下垂
    v.y -= smooth * 0.11;
    // 吻部微收但保留寬厚方圓感
    v.x *= 1.0 - smooth * 0.16;

    // 讓最前端呈現柔和方平鼻面（像軟膠公仔的鈍平吻部）
    if (v.z > 0.74) {
      const flatT = (v.z - 0.74) / 0.26;
      v.z = 0.74 + Math.tanh(flatT * 1.4) * 0.11;
    }
  }

  // 兩頰下方圓鼓鼓的嬰兒肥（超療癒的胖臉頰）
  if (v.y < 0.08 && v.z > -0.15 && v.z < 0.48) {
    const cheek =
      Math.exp(-Math.pow((v.z - 0.12) / 0.3, 2)) *
      Math.exp(-Math.pow((v.y + 0.12) / 0.26, 2));
    v.x *= 1.0 + cheek * 0.15;
  }

  // 下巴柔和平緩
  if (v.y < -0.36) {
    v.y = -0.36 + (v.y + 0.36) * 0.58;
  }

  return v;
}

function getHeadSurfaceTransform(dx, dy, dz, offset = 0.018) {
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  const pos = deformHeadPoint(dir.clone().multiplyScalar(0.62));
  const normal = pos.clone().normalize();
  pos.addScaledVector(normal, offset);
  return { pos, normal };
}

function createCuteChibiHeadGeometry() {
  const geo = new THREE.SphereGeometry(0.62, 44, 34);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    deformHeadPoint(v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * 雕塑圓胖流線的「麵包團」身體，自然銜接在寬大頭部後方
 */
function createCuteChibiBodyGeometry() {
  const geo = new THREE.SphereGeometry(0.84, 40, 30);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x *= 1.04;
    v.y *= 0.8;
    v.z *= 1.2;

    // 背部飽滿微拱，呈現趴在溫泉裡的懶洋洋曲線
    if (v.z < 0.1) {
      const back = Math.min(1, (0.1 - v.z) / 1.1);
      v.x *= 1.0 + back * 0.08;
      v.y += Math.sin(back * Math.PI) * 0.06;
    }

    if (v.y < -0.32) {
      v.y = -0.32 + (v.y + 0.32) * 0.5;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * 建立「動物星球 Q 版軟萌 3渲2 動漫風格」卡皮巴拉
 */
export function createCapybara({ isBaby = false, withTowel = true } = {}) {
  const root = new THREE.Group();
  root.name = isBaby ? 'baby_capybara_root' : 'capybara_root';

  const rig = new THREE.Group();
  root.add(rig);

  // === 奶油杏黃＋柔和焦糖漸層材質 ===
  const bodyMat = createCapyAirbrushToonMaterial({
    baseColor: isBaby ? '#f7d29c' : '#f4c78a',
    midColor: isBaby ? '#e8bc80' : '#e4af72',
    shadowColor: isBaby ? '#cd9865' : '#c48758',
    gradientMode: 0,
    rimStrength: 0.34,
  });

  const headMat = createCapyAirbrushToonMaterial({
    baseColor: isBaby ? '#f7d29c' : '#f4c78a',
    midColor: isBaby ? '#e8bc80' : '#e4af72',
    shadowColor: isBaby ? '#cd9865' : '#c48758',
    tipColor: '#5c4237',
    gradientMode: 1,
    rimStrength: 0.36,
  });

  const tipGradMat = createCapyAirbrushToonMaterial({
    baseColor: isBaby ? '#f7d29c' : '#f4c78a',
    midColor: '#dfa76d',
    shadowColor: '#b97e54',
    tipColor: '#7a5a4b',
    gradientMode: 2,
    rimStrength: 0.26,
  });

  const darkFeatureMat = createToonMaterial({
    color: '#3b261d',
    midColor: '#2d1c15',
    shadowColor: '#1f120d',
    rimStrength: 0.1,
    specularStrength: 0.18,
    specularSize: 0.95,
  });

  const earInnerMat = createToonMaterial({
    color: '#9c6c5a',
    shadowColor: '#694438',
    rimStrength: 0.08,
  });

  const towelMat = createToonMaterial({
    color: '#fffdf7',
    midColor: '#f2ede2',
    shadowColor: '#cfc7bc',
    rimStrength: 0.22,
  });

  const blushMat = new THREE.MeshBasicMaterial({
    map: sharedBlushTex,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });

  const hitTargets = [];

  // === 1. 圓滾滾趴湯身體 ===
  const body = new THREE.Mesh(createCuteChibiBodyGeometry(), bodyMat);
  body.position.set(0, 0.16, -0.14);
  body.name = 'capy_body';
  addOutline(body, 0.02, '#472c1e');
  rig.add(body);
  hitTargets.push(body);

  // 背上摺疊日式小溫泉毛巾（依背部弧度彎曲貼合，避免穿模）
  if (withTowel && !isBaby) {
    const towelGroup = new THREE.Group();
    towelGroup.position.set(0, 0.9, -0.46);
    towelGroup.rotation.set(-0.22, 0.04, 0.02);

    const bendTowelGeo = (geo, zOffset = 0) => {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i) + zOffset;
        const drop = 0.42 * vx * vx + 0.26 * vz * vz;
        pos.setY(i, vy - drop);
      }
      geo.computeVertexNormals();
      return geo;
    };

    const towelGeo = bendTowelGeo(new THREE.BoxGeometry(0.62, 0.068, 0.4, 12, 2, 10));
    const towel = new THREE.Mesh(towelGeo, towelMat);
    addOutline(towel, 0.011, '#5e493e');
    towelGroup.add(towel);

    const stripeMat = createToonMaterial({ color: '#8ac5df', shadowColor: '#5c8ea8', rimStrength: 0.1 });
    [-0.12, 0.12].forEach((zOff) => {
      const stripeGeo = bendTowelGeo(new THREE.BoxGeometry(0.626, 0.074, 0.042, 12, 2, 2), zOff);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.z = zOff;
      towelGroup.add(stripe);
    });
    rig.add(towelGroup);
  }

  // 兩隻短胖可愛前掌（帶軟膠漸層棕小蹄爪，自然趴在前方）
  const pawGeo = new THREE.SphereGeometry(0.18, 18, 14);
  pawGeo.scale(0.95, 0.64, 1.35);
  [-0.44, 0.44].forEach((x) => {
    const paw = new THREE.Mesh(pawGeo, tipGradMat);
    paw.position.set(x, 0.14, 0.78);
    paw.rotation.y = x > 0 ? -0.22 : 0.22;
    addOutline(paw, 0.014, '#472c1e');
    rig.add(paw);
    hitTargets.push(paw);
  });

  // === 2. 超萌方圓寬臉大頭（平滑融入身體，無生硬黑環）===
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.64, 0.44);
  rig.add(headGroup);

  const headMesh = new THREE.Mesh(createCuteChibiHeadGeometry(), headMat);
  headMesh.name = 'capy_head';
  addOutline(headMesh, 0.019, '#472c1e');
  headGroup.add(headMesh);
  hitTargets.push(headMesh);

  // === 3. 招牌小巧雙鼻孔（完全比照參考圖：兩個寬距微彎暗棕小鼻孔，無大黑鼻球）===
  [-0.145, 0.145].forEach((x) => {
    const sign = Math.sign(x);
    const nostril = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.048, 6, 10),
      darkFeatureMat
    );
    nostril.rotation.z = Math.PI / 2 + sign * 0.24;
    nostril.rotation.y = sign * 0.18;
    nostril.position.set(x, 0.015, 0.845);
    headGroup.add(nostril);
  });

  // 鼻下超柔和的小小嘴縫（隱約可愛的倒 Y 小嘴）
  const mouthCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.15, 0.835),
    new THREE.Vector3(0, -0.21, 0.815),
    new THREE.Vector3(-0.065, -0.235, 0.785),
  ]);
  const mouthCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.21, 0.815),
    new THREE.Vector3(0.065, -0.235, 0.785),
  ]);
  const mouthL = new THREE.Mesh(new THREE.TubeGeometry(mouthCurveL, 10, 0.011, 6, false), darkFeatureMat);
  const mouthR = new THREE.Mesh(new THREE.TubeGeometry(mouthCurveR, 10, 0.011, 6, false), darkFeatureMat);
  headGroup.add(mouthL, mouthR);

  // === 4. 參考圖招牌「極簡佛系細彎閉眼」vs「開心 ^ ^ 彎彎眼」（精準貼合頭殼表面）===
  const chillEyesGroup = new THREE.Group();
  const happyEyesGroup = new THREE.Group();
  happyEyesGroup.visible = false;
  headGroup.add(chillEyesGroup, happyEyesGroup);

  [-1, 1].forEach((sign) => {
    const { pos: eyePos, normal: eyeNormal } = getHeadSurfaceTransform(
      sign * 0.68,
      0.34,
      0.64,
      0.016
    );

    // 淡定閉眼錨點（緊貼臉部曲面切線）
    const chillAnchor = new THREE.Group();
    chillAnchor.position.copy(eyePos);
    chillAnchor.lookAt(eyePos.clone().add(eyeNormal));
    chillAnchor.rotateZ(-sign * 0.18);

    const closedEyeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.095, 0.022, -0.008),
      new THREE.Vector3(0, -0.016, 0.012),
      new THREE.Vector3(0.095, 0.014, -0.008),
    ]);
    const closedEye = new THREE.Mesh(
      new THREE.TubeGeometry(closedEyeCurve, 16, 0.021, 8, false),
      darkFeatureMat
    );
    chillAnchor.add(closedEye);
    chillEyesGroup.add(chillAnchor);

    // 開心 ^ ^ 笑眼錨點
    const happyAnchor = new THREE.Group();
    happyAnchor.position.copy(eyePos);
    happyAnchor.lookAt(eyePos.clone().add(eyeNormal));
    happyAnchor.rotateZ(-sign * 0.06);

    const happyArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.02, 8, 18, Math.PI * 0.84),
      darkFeatureMat
    );
    happyArc.position.y = -0.025;
    happyArc.rotation.z = Math.PI * 0.08;
    happyAnchor.add(happyArc);
    happyEyesGroup.add(happyAnchor);
  });

  // === 5. 柔和淡粉腮紅（精準貼合臉頰曲面，摸摸頭時自然透紅）===
  const blushPlaneGeo = new THREE.PlaneGeometry(0.24, 0.15);
  [-1, 1].forEach((sign) => {
    const { pos: blushPos, normal: blushNormal } = getHeadSurfaceTransform(
      sign * 0.78,
      0.04,
      0.62,
      0.016
    );
    const blush = new THREE.Mesh(blushPlaneGeo, blushMat);
    blush.position.copy(blushPos);
    blush.lookAt(blushPos.clone().add(blushNormal));
    headGroup.add(blush);
  });

  // === 6. 小巧圓尖耳（帶淡淡棕色耳尖漸層，寬距立在頭頂兩側）===
  const ears = [];
  [-1, 1].forEach((sign) => {
    const earPivot = new THREE.Group();
    earPivot.position.set(sign * 0.45, 0.38, -0.04);
    earPivot.rotation.set(-0.14, sign * 0.38, -sign * 0.36);
    headGroup.add(earPivot);

    const earGeo = new THREE.SphereGeometry(0.13, 16, 12);
    earGeo.scale(0.8, 1.12, 0.52);
    const earOuter = new THREE.Mesh(earGeo, tipGradMat);
    earOuter.position.set(0, 0.055, 0);
    addOutline(earOuter, 0.013, '#472c1e');
    earPivot.add(earOuter);

    const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), earInnerMat);
    earInner.scale.set(0.7, 0.9, 0.32);
    earInner.position.set(0, 0.045, 0.044);
    earPivot.add(earInner);

    ears.push({ pivot: earPivot, baseRotZ: earPivot.rotation.z, sign });
  });

  // === 7. 頭頂柚子堆疊塔（像參考圖那樣穩穩圓潤坐落在頭頂）===
  const yuzuTowerPivot = new THREE.Group();
  yuzuTowerPivot.position.set(0, 0.47, 0.04);
  headGroup.add(yuzuTowerPivot);

  const MAX_YUZU = 4;
  const yuzuHitTargets = [];
  function rebuildYuzuStack(count) {
    while (yuzuTowerPivot.children.length > 0) {
      yuzuTowerPivot.remove(yuzuTowerPivot.children[0]);
    }
    yuzuHitTargets.length = 0;

    let currentY = 0.14;
    for (let i = 0; i < count; i++) {
      const s = isBaby ? 0.72 : Math.max(0.68, 1.02 - i * 0.11);
      const yuzu = createYuzuMesh(s);
      yuzu.position.set(
        i === 0 ? 0 : Math.sin(i * 2.1) * 0.014,
        currentY,
        i === 0 ? 0 : Math.cos(i * 1.7) * 0.014
      );
      yuzu.rotation.y = i * 1.15;
      yuzu.traverse((child) => {
        if (child.isMesh && !child.name.endsWith('_outline')) {
          yuzuHitTargets.push(child);
        }
      });
      yuzuTowerPivot.add(yuzu);
      currentY += 0.295 * s;
    }
  }

  let yuzuCount = 1;
  rebuildYuzuStack(yuzuCount);

  if (isBaby) {
    root.scale.setScalar(0.48);
  }

  // === 動畫狀態 ===
  let happyTimer = 0;
  let squashVel = 0;
  let squashOffset = 0;
  let wobbleAngleX = 0;
  let wobbleAngleZ = 0;
  let wobbleVelX = 0;
  let wobbleVelZ = 0;
  let nextTwitchTime = 2.8 + Math.random() * 3.0;
  let twitchTimer = 0;
  let twitchEarIndex = 0;
  const phaseOffset = isBaby ? 1.7 : 0;

  function triggerPetReaction() {
    happyTimer = 2.9;
    squashVel = 2.8;
    wobbleVelZ += (Math.random() > 0.5 ? 1 : -1) * 2.5;
    wobbleVelX += 1.6;
  }

  function stackYuzu() {
    let overflowed = false;
    if (yuzuCount >= MAX_YUZU) {
      yuzuCount = 1;
      overflowed = true;
      wobbleVelZ += 3.5;
    } else {
      yuzuCount += 1;
      wobbleVelZ += (Math.random() > 0.5 ? 1 : -1) * 2.1;
      wobbleVelX -= 1.4;
    }
    squashVel = 1.9;
    rebuildYuzuStack(yuzuCount);
    return { count: yuzuCount, overflowed };
  }

  function update(dt, elapsed) {
    const t = elapsed + phaseOffset;
    const floatY = Math.sin(t * 1.5) * (isBaby ? 0.02 : 0.03);
    const breath = Math.sin(t * 2.1) * 0.016;
    rig.position.y = floatY;

    const springK = 85;
    const damping = 9.2;
    squashVel += (-springK * squashOffset - damping * squashVel) * dt;
    squashOffset += squashVel * dt;

    const scaleY = 1.0 + breath - squashOffset * 0.14;
    const scaleXZ = 1.0 - breath * 0.5 + squashOffset * 0.1;
    rig.scale.set(scaleXZ, scaleY, scaleXZ);

    const isHappy = happyTimer > 0;
    if (isHappy) {
      happyTimer = Math.max(0, happyTimer - dt);
      headGroup.rotation.z = Math.sin(t * 9.5) * 0.085;
      headGroup.rotation.x = -0.06 + Math.sin(t * 6.0) * 0.04;
    } else {
      headGroup.rotation.z = Math.sin(t * 0.85) * 0.032;
      headGroup.rotation.x = Math.sin(t * 1.1) * 0.03;
    }

    chillEyesGroup.visible = !isHappy;
    happyEyesGroup.visible = isHappy;

    const targetBlush = isHappy ? 0.85 : 0.22;
    blushMat.opacity += (targetBlush - blushMat.opacity) * Math.min(1, dt * 8);

    if (isHappy) {
      ears.forEach((e) => {
        e.pivot.rotation.z = e.baseRotZ + Math.sin(t * 16.0) * 0.18 * e.sign;
      });
    } else {
      nextTwitchTime -= dt;
      if (nextTwitchTime <= 0 && twitchTimer <= 0) {
        twitchTimer = 0.32;
        twitchEarIndex = Math.random() > 0.5 ? 1 : 0;
        nextTwitchTime = 3.0 + Math.random() * 4.5;
      }
      ears.forEach((e, idx) => {
        if (twitchTimer > 0 && idx === twitchEarIndex) {
          e.pivot.rotation.z = e.baseRotZ + Math.sin(twitchTimer * 35.0) * 0.22 * e.sign;
        } else {
          e.pivot.rotation.z += (e.baseRotZ - e.pivot.rotation.z) * Math.min(1, dt * 10);
        }
      });
      if (twitchTimer > 0) twitchTimer = Math.max(0, twitchTimer - dt);
    }

    wobbleVelX += (-42 * wobbleAngleX - 4.6 * wobbleVelX) * dt;
    wobbleVelZ += (-42 * wobbleAngleZ - 4.6 * wobbleVelZ) * dt;
    wobbleAngleX += wobbleVelX * dt;
    wobbleAngleZ += wobbleVelZ * dt;

    yuzuTowerPivot.rotation.x = wobbleAngleX * 0.22;
    yuzuTowerPivot.rotation.z = wobbleAngleZ * 0.22 + Math.sin(t * 1.6) * 0.025;
  }

  return {
    root,
    hitTargets,
    yuzuHitTargets,
    triggerPetReaction,
    stackYuzu,
    update,
  };
}
