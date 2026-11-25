import * as THREE from 'three';

/**
 * 全域 3渲2 光照 uniform，切換晨光／夕陽／星夜時會同步更新所有卡通材質
 */
export const globalToonUniforms = {
  uLightDir: { value: new THREE.Vector3(0.55, 0.82, 0.55).normalize() },
  uLightColor: { value: new THREE.Color('#fffaf0') },
  uAmbientColor: { value: new THREE.Color('#e2eeff') },
  uRimColor: { value: new THREE.Color('#fff6d6') },
  uOutlineColor: { value: new THREE.Color('#4a2f22') },
  uTime: { value: 0 },
};

/**
 * 產生動漫手繪感紋理（毛髮筆觸、木紋、草地噪點、柔和蒸氣等）
 */
export function createProceduralTexture(type = 'fur') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (type === 'fur') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 650; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const len = 8 + Math.random() * 14;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(215, 195, 175, 0.28)' : 'rgba(255, 250, 240, 0.25)';
      ctx.lineWidth = 1.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y + len);
      ctx.stroke();
    }
  } else if (type === 'wood') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const y = (i / 60) * 256;
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(155, 105, 65, 0.22)' : 'rgba(190, 140, 95, 0.14)';
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(85, y + (Math.random() - 0.5) * 10, 170, y + (Math.random() - 0.5) * 10, 256, y);
      ctx.stroke();
    }
  } else if (type === 'grass') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 420; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 3 + Math.random() * 11;
      ctx.fillStyle = Math.random() > 0.45 ? 'rgba(185, 225, 155, 0.25)' : 'rgba(240, 255, 200, 0.22)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'steam') {
    ctx.clearRect(0, 0, 256, 256);
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
    grad.addColorStop(0.0, 'rgba(255, 252, 246, 0.72)');
    grad.addColorStop(0.45, 'rgba(255, 250, 242, 0.36)');
    grad.addColorStop(0.78, 'rgba(255, 250, 242, 0.08)');
    grad.addColorStop(1.0, 'rgba(255, 250, 242, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  } else if (type === 'blush') {
    ctx.clearRect(0, 0, 256, 256);
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 118);
    grad.addColorStop(0.0, 'rgba(255, 130, 154, 0.85)');
    grad.addColorStop(0.55, 'rgba(255, 148, 168, 0.45)');
    grad.addColorStop(1.0, 'rgba(255, 155, 175, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  } else if (type === 'onsenSign') {
    // 經典日式溫泉符號（♨️）手繪木牌貼圖（純圖案、無文字）
    ctx.fillStyle = '#e7bd84';
    ctx.fillRect(0, 0, 256, 256);

    // 木牌深棕色外框
    ctx.strokeStyle = '#5c3824';
    ctx.lineWidth = 14;
    ctx.strokeRect(12, 12, 232, 232);

    // 經典朱紅色日本溫泉標誌 ♨（下半圓弧浴池＋三條優雅上升蒸氣波紋）
    ctx.strokeStyle = '#cf3f38';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 下方橢圓浴池弧線（左右微上揚、上方開口）
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.ellipse(128, 166, 68, 30, 0, -Math.PI * 0.14, Math.PI * 1.14, false);
    ctx.stroke();

    // 三條波浪狀溫泉蒸氣（中間略高、左右對稱）
    const drawSteamWave = (cx, topY, bottomY, amp) => {
      const h = bottomY - topY;
      ctx.beginPath();
      ctx.moveTo(cx, bottomY);
      ctx.bezierCurveTo(
        cx - amp,
        bottomY - h * 0.34,
        cx + amp,
        topY + h * 0.34,
        cx,
        topY
      );
      ctx.stroke();
    };

    ctx.lineWidth = 13;
    drawSteamWave(84, 72, 152, 16);
    drawSteamWave(128, 52, 154, 18);
    drawSteamWave(172, 72, 152, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (type === 'fur' || type === 'wood' || type === 'grass') {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  return tex;
}

const defaultWhiteTex = (() => {
  const data = new Uint8Array([255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 1, 1);
  tex.needsUpdate = true;
  return tex;
})();

/**
 * 建立 3渲2 動漫卡通著色材質（支援 3 階賽璐璐明暗、手繪紋理、菲涅爾邊緣光、高光圓斑）
 */
export function createToonMaterial({
  color = '#d8aa7e',
  shadowColor = null,
  midColor = null,
  map = null,
  uvRepeat = [1, 1],
  rimStrength = 0.34,
  rimPower = 2.8,
  specularStrength = 0.0,
  specularSize = 0.94,
  emissive = '#000000',
  emissiveStrength = 0.0,
  doubleSided = false,
  transparent = false,
  opacity = 1.0,
} = {}) {
  const baseCol = new THREE.Color(color);
  const autoShadow = baseCol.clone().multiply(new THREE.Color('#806678'));
  const autoMid = baseCol.clone().lerp(autoShadow, 0.32);

  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: baseCol },
      uMidColor: { value: midColor ? new THREE.Color(midColor) : autoMid },
      uShadowColor: { value: shadowColor ? new THREE.Color(shadowColor) : autoShadow },
      uMap: { value: map || defaultWhiteTex },
      uUvRepeat: { value: new THREE.Vector2(uvRepeat[0], uvRepeat[1]) },
      uLightDir: globalToonUniforms.uLightDir,
      uLightColor: globalToonUniforms.uLightColor,
      uAmbientColor: globalToonUniforms.uAmbientColor,
      uRimColor: globalToonUniforms.uRimColor,
      uRimStrength: { value: rimStrength },
      uRimPower: { value: rimPower },
      uSpecStrength: { value: specularStrength },
      uSpecSize: { value: specularSize },
      uEmissive: { value: new THREE.Color(emissive) },
      uEmissiveStrength: { value: emissiveStrength },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
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
      uniform sampler2D uMap;
      uniform vec2 uUvRepeat;
      uniform vec3 uLightDir;
      uniform vec3 uLightColor;
      uniform vec3 uAmbientColor;
      uniform vec3 uRimColor;
      uniform float uRimStrength;
      uniform float uRimPower;
      uniform float uSpecStrength;
      uniform float uSpecSize;
      uniform vec3 uEmissive;
      uniform float uEmissiveStrength;
      uniform float uOpacity;

      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 L = normalize(uLightDir);
        vec3 V = normalize(cameraPosition - vWorldPos);

        float ndotl = dot(N, L);
        float lightBand1 = smoothstep(-0.12, -0.02, ndotl);
        float lightBand2 = smoothstep(0.28, 0.38, ndotl);

        vec3 texColor = texture2D(uMap, vUv * uUvRepeat).rgb;
        vec3 celColor = mix(uShadowColor, uMidColor, lightBand1);
        celColor = mix(celColor, uBaseColor, lightBand2);
        celColor *= texColor;

        // 柔和的動漫環境光混合，避免暗部發黑
        vec3 lightingTint = mix(uAmbientColor, uLightColor, 0.58 + 0.42 * lightBand1);
        vec3 color = celColor * lightingTint;

        // 柔和受光邊緣光
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), uRimPower);
        float rimMask = smoothstep(0.42, 0.56, fresnel) * smoothstep(-0.15, 0.35, ndotl);
        color += uRimColor * rimMask * uRimStrength;

        // 卡通高光圓斑
        if (uSpecStrength > 0.001) {
          vec3 H = normalize(L + V);
          float spec = smoothstep(uSpecSize, uSpecSize + 0.015, dot(N, H));
          color += vec3(1.0, 0.99, 0.96) * spec * uSpecStrength;
        }

        color += uEmissive * uEmissiveStrength;
        gl_FragColor = vec4(color, uOpacity);
      }
    `,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    transparent,
  });
}

/**
 * 反面膨脹（Inverted Hull）動漫輪廓線材質
 */
export function createOutlineMaterial(thickness = 0.02, colorOverride = null) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uOutlineColor: colorOverride
        ? { value: new THREE.Color(colorOverride) }
        : globalToonUniforms.uOutlineColor,
    },
    vertexShader: /* glsl */ `
      uniform float uThickness;
      void main() {
        vec3 expanded = position + normalize(normal) * uThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(expanded, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uOutlineColor;
      void main() {
        gl_FragColor = vec4(uOutlineColor, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
}

/**
 * 為 Mesh 加上精緻溫暖的動漫描邊
 */
export function addOutline(mesh, thickness = 0.02, colorOverride = null) {
  const outlineMat = createOutlineMaterial(thickness, colorOverride);
  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
  outlineMesh.name = `${mesh.name || 'mesh'}_outline`;
  outlineMesh.renderOrder = -1;
  mesh.add(outlineMesh);
  return outlineMesh;
}

/**
 * 動漫風格溫泉水面著色器（溫柔淺青綠水色、雙層卡通波紋、岸邊泡沫與閃光）
 */
export function createAnimeWaterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: globalToonUniforms.uTime,
      uShallowColor: { value: new THREE.Color('#8ee8ea') },
      uDeepColor: { value: new THREE.Color('#57c6d4') },
      uFoamColor: { value: new THREE.Color('#ffffff') },
      uHighlightColor: { value: new THREE.Color('#e3fdff') },
      uRippleOrigin: { value: new THREE.Vector2(-0.08, 0.08) },
      uSpoutOrigin: { value: new THREE.Vector2(-1.42, -0.92) },
      uPoolRadius: { value: 2.38 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vLocalPos;

      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 2.4 + uTime * 1.6) * 0.014 + cos(pos.y * 2.2 - uTime * 1.3) * 0.014;
        vLocalPos = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uShallowColor;
      uniform vec3 uDeepColor;
      uniform vec3 uFoamColor;
      uniform vec3 uHighlightColor;
      uniform vec2 uRippleOrigin;
      uniform vec2 uSpoutOrigin;
      uniform float uPoolRadius;

      varying vec2 vUv;
      varying vec3 vLocalPos;

      void main() {
        vec2 p = vLocalPos.xy;
        float distCenter = length(p);

        float depthBand = smoothstep(0.52, 0.62, distCenter / uPoolRadius);
        vec3 col = mix(uDeepColor, uShallowColor, depthBand);

        // 主角卡皮巴拉周圍波紋
        float dCapy = length(p - uRippleOrigin);
        float capyRing = sin(dCapy * 13.0 - uTime * 2.3);
        float capyMask = smoothstep(0.83, 0.89, capyRing) * smoothstep(1.65, 0.55, dCapy) * smoothstep(0.32, 0.48, dCapy);
        col = mix(col, uFoamColor, capyMask * 0.72);

        // 竹筒落水處漣漪
        float dSpout = length(p - uSpoutOrigin);
        float spoutRing = sin(dSpout * 22.0 - uTime * 5.2);
        float spoutMask = smoothstep(0.75, 0.84, spoutRing) * smoothstep(0.78, 0.08, dSpout);
        col = mix(col, uFoamColor, spoutMask * 0.9);

        // 溫泉池緣白色波沫
        float edgeWave = sin(atan(p.y, p.x) * 12.0 + uTime * 1.5) * 0.03;
        float edgeFoam = smoothstep(uPoolRadius - 0.14 + edgeWave, uPoolRadius - 0.07 + edgeWave, distCenter);
        col = mix(col, uFoamColor, edgeFoam * 0.85);

        // 柔和手繪光斑
        float shimmer = sin(p.x * 4.2 + p.y * 2.6 + uTime * 1.1) * cos(p.y * 4.8 - uTime * 0.85);
        float sparkle = smoothstep(0.76, 0.82, shimmer);
        col = mix(col, uHighlightColor, sparkle * 0.58);

        gl_FragColor = vec4(col, 0.88);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

/**
 * 動漫漸層天空球體（支援日夜星辰與柔和地平線光暈）
 */
export function createAnimeSky() {
  const skyGeo = new THREE.SphereGeometry(65, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      uTopColor: { value: new THREE.Color('#6db8f7') },
      uMidColor: { value: new THREE.Color('#bce6ff') },
      uHorizonColor: { value: new THREE.Color('#fff1d6') },
      uSunDir: globalToonUniforms.uLightDir,
      uSunColor: { value: new THREE.Color('#fff9dc') },
      uStarIntensity: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uStarIntensity;

      varying vec3 vDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
        col = mix(col, uTopColor, smoothstep(0.24, 0.82, h));

        float sunAmt = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        float sunDisc = smoothstep(0.992, 0.996, sunAmt);
        float sunGlow = pow(sunAmt, 12.0) * 0.36;
        col += uSunColor * (sunDisc * 0.92 + sunGlow);

        if (uStarIntensity > 0.01 && h > 0.08) {
          vec3 grid = floor(normalize(vDir) * 95.0);
          float s = hash(grid);
          float star = smoothstep(0.992, 0.998, s) * smoothstep(0.08, 0.35, h);
          col += vec3(1.0, 0.98, 0.88) * star * uStarIntensity;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(skyGeo, skyMat);
  mesh.name = 'anime_sky';
  return { mesh, material: skyMat };
}
