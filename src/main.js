import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { globalToonUniforms, createAnimeSky } from './toonShader.js';
import { createCapybara } from './capybara.js';
import { createOnsenEnvironment } from './environment.js';
import { TRANSLATIONS, detectInitialLanguage, saveLanguage } from './i18n.js';

// === 場景與渲染器初始化 ===
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  140
);
camera.position.set(3.55, 2.38, 5.25);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// === 軌道視角控制 ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.target.set(0.05, 0.72, 0.08);
controls.minDistance = 2.8;
controls.maxDistance = 11.5;
controls.minPolarAngle = 0.25;
controls.maxPolarAngle = Math.PI * 0.475;

// === 建立天空、溫泉環境、大卡皮巴拉與小卡皮巴拉寶寶 ===
const sky = createAnimeSky();
scene.add(sky.mesh);

const environment = createOnsenEnvironment();
scene.add(environment.group);

const capybara = createCapybara({ isBaby: false, withTowel: true });
capybara.root.position.set(-0.18, 0, 0.05);
capybara.root.rotation.y = 0.18;
scene.add(capybara.root);

const babyCapybara = createCapybara({ isBaby: true, withTowel: false });
babyCapybara.root.position.set(1.18, 0.02, 0.62);
babyCapybara.root.rotation.y = -0.45;
scene.add(babyCapybara.root);

// === 2D 動漫風飄浮愛心與星星粒子系統 ===
function createEmojiSpriteTexture(symbol, color = '#ff6f91') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#4a2f22';
  ctx.strokeText(symbol, 64, 68);
  ctx.fillStyle = color;
  ctx.fillText(symbol, 64, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const heartTex = createEmojiSpriteTexture('♥', '#ff6b93');
const sparkleTex = createEmojiSpriteTexture('✦', '#ffcf40');
const noteTex = createEmojiSpriteTexture('♪', '#69d2e7');
const activeParticles = [];

function spawnReactionParticles(origin, count = 6) {
  const textures = [heartTex, sparkleTex, noteTex];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: textures[i % textures.length],
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(origin).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.75,
        0.55 + Math.random() * 0.35,
        (Math.random() - 0.5) * 0.55
      )
    );
    const scale = 0.24 + Math.random() * 0.16;
    sprite.scale.set(scale, scale, 1);
    scene.add(sprite);

    activeParticles.push({
      sprite,
      mat,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.75,
        0.9 + Math.random() * 0.65,
        (Math.random() - 0.5) * 0.55
      ),
      age: 0,
      maxAge: 1.1 + Math.random() * 0.5,
      baseScale: scale,
    });
  }
}

// === 三種時段光影預設（晨光 / 夕陽 / 星夜）===
const TIME_PRESETS = [
  {
    icon: '☀️',
    lightDir: new THREE.Vector3(0.55, 0.82, 0.55).normalize(),
    lightColor: new THREE.Color('#fffaf0'),
    ambientColor: new THREE.Color('#e2eeff'),
    rimColor: new THREE.Color('#fff6d6'),
    outlineColor: new THREE.Color('#4a2f22'),
    skyTop: new THREE.Color('#6db8f7'),
    skyMid: new THREE.Color('#bce6ff'),
    skyHorizon: new THREE.Color('#fff1d6'),
    sunColor: new THREE.Color('#fff9dc'),
    starIntensity: 0.0,
    waterShallow: new THREE.Color('#8ee8ea'),
    waterDeep: new THREE.Color('#57c6d4'),
    lanternGlow: 0.15,
  },
  {
    icon: '🌇',
    lightDir: new THREE.Vector3(-0.78, 0.36, -0.52).normalize(),
    lightColor: new THREE.Color('#ffc48f'),
    ambientColor: new THREE.Color('#dbb0cc'),
    rimColor: new THREE.Color('#ffe09e'),
    outlineColor: new THREE.Color('#452522'),
    skyTop: new THREE.Color('#4e4d8c'),
    skyMid: new THREE.Color('#df7c8c'),
    skyHorizon: new THREE.Color('#ffd08a'),
    sunColor: new THREE.Color('#ffdf9e'),
    starIntensity: 0.25,
    waterShallow: new THREE.Color('#92cfd4'),
    waterDeep: new THREE.Color('#5f92ab'),
    lanternGlow: 0.65,
  },
  {
    icon: '🌙',
    lightDir: new THREE.Vector3(0.45, 0.72, -0.55).normalize(),
    lightColor: new THREE.Color('#bfd2ff'),
    ambientColor: new THREE.Color('#7386ba'),
    rimColor: new THREE.Color('#a8d8ff'),
    outlineColor: new THREE.Color('#201930'),
    skyTop: new THREE.Color('#131936'),
    skyMid: new THREE.Color('#25335e'),
    skyHorizon: new THREE.Color('#495c8a'),
    sunColor: new THREE.Color('#eef4ff'),
    starIntensity: 1.0,
    waterShallow: new THREE.Color('#62a8bf'),
    waterDeep: new THREE.Color('#31607d'),
    lanternGlow: 1.45,
  },
];

/**
 * 依訪客當地時間自動決定時段：
 * 06:00–16:59 晨光溫泉 / 05:00–05:59 與 17:00–18:59 夕陽黃昏 / 19:00–04:59 星夜溫泉
 */
function getAutoTimePresetIndex() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 17) return 0;
  if ((hour >= 17 && hour < 19) || hour === 5) return 1;
  return 2;
}

let currentPresetIndex = getAutoTimePresetIndex();

function applyTimePresetImmediate(index) {
  const target = TIME_PRESETS[index];
  globalToonUniforms.uLightDir.value.copy(target.lightDir);
  globalToonUniforms.uLightColor.value.copy(target.lightColor);
  globalToonUniforms.uAmbientColor.value.copy(target.ambientColor);
  globalToonUniforms.uRimColor.value.copy(target.rimColor);
  globalToonUniforms.uOutlineColor.value.copy(target.outlineColor);

  sky.material.uniforms.uTopColor.value.copy(target.skyTop);
  sky.material.uniforms.uMidColor.value.copy(target.skyMid);
  sky.material.uniforms.uHorizonColor.value.copy(target.skyHorizon);
  sky.material.uniforms.uSunColor.value.copy(target.sunColor);
  sky.material.uniforms.uStarIntensity.value = target.starIntensity;

  environment.waterMat.uniforms.uShallowColor.value.copy(target.waterShallow);
  environment.waterMat.uniforms.uDeepColor.value.copy(target.waterDeep);
  environment.lanternGlowMat.uniforms.uEmissiveStrength.value = target.lanternGlow;
}

function lerpTimePreset(dt) {
  const target = TIME_PRESETS[currentPresetIndex];
  const speed = Math.min(1, dt * 3.2);

  globalToonUniforms.uLightDir.value.lerp(target.lightDir, speed).normalize();
  globalToonUniforms.uLightColor.value.lerp(target.lightColor, speed);
  globalToonUniforms.uAmbientColor.value.lerp(target.ambientColor, speed);
  globalToonUniforms.uRimColor.value.lerp(target.rimColor, speed);
  globalToonUniforms.uOutlineColor.value.lerp(target.outlineColor, speed);

  sky.material.uniforms.uTopColor.value.lerp(target.skyTop, speed);
  sky.material.uniforms.uMidColor.value.lerp(target.skyMid, speed);
  sky.material.uniforms.uHorizonColor.value.lerp(target.skyHorizon, speed);
  sky.material.uniforms.uSunColor.value.lerp(target.sunColor, speed);
  sky.material.uniforms.uStarIntensity.value +=
    (target.starIntensity - sky.material.uniforms.uStarIntensity.value) * speed;

  environment.waterMat.uniforms.uShallowColor.value.lerp(target.waterShallow, speed);
  environment.waterMat.uniforms.uDeepColor.value.lerp(target.waterDeep, speed);
  environment.lanternGlowMat.uniforms.uEmissiveStrength.value +=
    (target.lanternGlow - environment.lanternGlowMat.uniforms.uEmissiveStrength.value) * speed;
}

// 立即套用當地時段光影，避免開站瞬間閃爍
applyTimePresetImmediate(currentPresetIndex);

// === 多語言（中／英自動偵測與切換）===
let currentLang = detectInitialLanguage();

const controlDockEl = document.getElementById('control-dock');
const petBtn = document.getElementById('btn-pet');
const petLabelEl = document.getElementById('pet-label');
const timeBtn = document.getElementById('btn-time');
const timeIconEl = document.getElementById('time-icon');
const timeLabelEl = document.getElementById('time-label');
const petalsBtn = document.getElementById('btn-petals');
const petalsLabelEl = document.getElementById('petals-label');
const soundBtn = document.getElementById('btn-sound');
const soundIconEl = document.getElementById('sound-icon');
const soundLabelEl = document.getElementById('sound-label');
const langBtn = document.getElementById('btn-lang');
const langLabelEl = document.getElementById('lang-label');
const toggleUiBtn = document.getElementById('btn-toggle-ui');
const loadingTextEl = document.getElementById('loading-text');

function t() {
  return TRANSLATIONS[currentLang];
}

function updateToggleUiLabel() {
  const hidden = document.body.classList.contains('ui-hidden');
  toggleUiBtn.textContent = hidden ? t().showUi : t().hideUi;
}

function updateTimeButtonLabel() {
  const preset = TIME_PRESETS[currentPresetIndex];
  timeIconEl.textContent = preset.icon;
  timeLabelEl.textContent = t().timeNames[currentPresetIndex];
}

function applyLanguage(lang) {
  currentLang = lang;
  const dict = t();
  document.documentElement.lang = dict.htmlLang;
  document.title = dict.pageTitle;

  controlDockEl.setAttribute('aria-label', dict.navAria);
  petBtn.title = dict.petTitle;
  petLabelEl.textContent = dict.petBtn;
  timeBtn.title = dict.timeTitle;
  petalsBtn.title = dict.petalsTitle;
  petalsLabelEl.textContent = dict.petalsBtn;
  soundBtn.title = dict.soundTitle;
  soundLabelEl.textContent = dict.soundBtn;
  langBtn.title = dict.langTitle;
  langLabelEl.textContent = dict.langBtn;
  toggleUiBtn.title = dict.toggleUiTitle;
  loadingTextEl.textContent = dict.loadingText;

  updateTimeButtonLabel();
  updateToggleUiLabel();
}

applyLanguage(currentLang);

// === 溫柔療癒 Web Audio 合成音效 ===
let soundEnabled = true;
let audioCtx = null;

function playChime(type = 'pet') {
  if (!soundEnabled) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const notes =
    type === 'pet'
      ? [523.25, 659.25, 783.99]
      : type === 'baby'
      ? [659.25, 783.99, 1046.5]
      : type === 'yuzu'
      ? [587.33, 880.0]
      : [440.0, 554.37];

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.065);
    gain.gain.setValueAtTime(0.001, now + i * 0.065);
    gain.gain.exponentialRampToValueAtTime(0.09, now + i * 0.065 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.065 + 0.28);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.065);
    osc.stop(now + i * 0.065 + 0.3);
  });
}

// === 心情提示氣泡 ===
const toastEl = document.getElementById('mood-toast');
let toastTimeout = null;

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2100);
}

// === 互動動作 ===
function petCapybara() {
  capybara.triggerPetReaction();
  spawnReactionParticles(new THREE.Vector3(-0.18, 1.0, 0.35), 7);
  playChime('pet');
  const msgs = t().petMessages;
  showToast(msgs[Math.floor(Math.random() * msgs.length)]);
}

function petBabyCapybara() {
  babyCapybara.triggerPetReaction();
  spawnReactionParticles(new THREE.Vector3(1.18, 0.55, 0.72), 5);
  playChime('baby');
  showToast(t().babyPetMessage);
}

function handleStackYuzu(targetCapy, origin, isBaby = false) {
  const { count, overflowed } = targetCapy.stackYuzu();
  spawnReactionParticles(origin, 4);
  playChime('yuzu');
  showToast(overflowed ? t().yuzuOverflow(isBaby) : t().yuzuStack(isBaby, count));
}

// === 滑鼠點擊與懸停光線投射 ===
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointermove', (e) => {
  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    [
      ...capybara.yuzuHitTargets,
      ...babyCapybara.yuzuHitTargets,
      ...capybara.hitTargets,
      ...babyCapybara.hitTargets,
      ...environment.yuzuHitTargets,
    ],
    false
  );
  container.classList.toggle('hover-capy', hits.length > 0);
});

renderer.domElement.addEventListener('pointerup', (e) => {
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 6) return;

  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);

  // 優先偵測點擊頭頂柚子（觸發疊柚子）
  if (raycaster.intersectObjects(capybara.yuzuHitTargets, false).length > 0) {
    handleStackYuzu(capybara, new THREE.Vector3(-0.18, 1.4, 0.4), false);
    return;
  }

  if (raycaster.intersectObjects(babyCapybara.yuzuHitTargets, false).length > 0) {
    handleStackYuzu(babyCapybara, new THREE.Vector3(1.18, 0.85, 0.72), true);
    return;
  }

  if (raycaster.intersectObjects(capybara.hitTargets, false).length > 0) {
    petCapybara();
    return;
  }

  if (raycaster.intersectObjects(babyCapybara.hitTargets, false).length > 0) {
    petBabyCapybara();
    return;
  }

  const yuzuHits = raycaster.intersectObjects(environment.yuzuHitTargets, false);
  if (yuzuHits.length > 0) {
    const idx = yuzuHits[0].object.userData.floatingIndex;
    environment.bounceFloatingYuzu(idx);
    playChime('splash');
    showToast(t().floatingYuzuSplash);
  }
});

// === UI 按鈕事件 ===
let showPetals = true;

petBtn.addEventListener('click', () => {
  petCapybara();
  babyCapybara.triggerPetReaction();
});

timeBtn.addEventListener('click', () => {
  currentPresetIndex = (currentPresetIndex + 1) % TIME_PRESETS.length;
  updateTimeButtonLabel();
  const preset = TIME_PRESETS[currentPresetIndex];
  showToast(t().timeSwitched(t().timeNames[currentPresetIndex], preset.icon));
});

petalsBtn.addEventListener('click', () => {
  showPetals = !showPetals;
  petalsBtn.classList.toggle('active', showPetals);
});

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundIconEl.textContent = soundEnabled ? '🔊' : '🔇';
  soundBtn.classList.toggle('active', soundEnabled);
  if (soundEnabled) playChime('pet');
});

langBtn.addEventListener('click', () => {
  const nextLang = currentLang === 'zh' ? 'en' : 'zh';
  saveLanguage(nextLang);
  applyLanguage(nextLang);
});

toggleUiBtn.addEventListener('click', () => {
  document.body.classList.toggle('ui-hidden');
  updateToggleUiLabel();
});

// === 視窗縮放 ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === 主動畫迴圈 ===
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  globalToonUniforms.uTime.value = elapsed;

  lerpTimePreset(dt);
  capybara.update(dt, elapsed);
  babyCapybara.update(dt, elapsed);
  environment.update(dt, elapsed, showPetals);

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.age += dt;
    const progress = p.age / p.maxAge;
    if (progress >= 1) {
      scene.remove(p.sprite);
      p.mat.dispose();
      activeParticles.splice(i, 1);
      continue;
    }
    p.sprite.position.addScaledVector(p.vel, dt);
    p.vel.y *= 0.985;
    const popScale = p.baseScale * (0.7 + Math.sin(progress * Math.PI) * 0.55);
    p.sprite.scale.set(popScale, popScale, 1);
    p.mat.opacity = 1 - Math.pow(progress, 2);
  }

  controls.update();
  renderer.render(scene, camera);
}

const loadingOverlay = document.getElementById('loading-overlay');
requestAnimationFrame(() => {
  setTimeout(() => loadingOverlay.classList.add('hidden'), 320);
});

animate();
