import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

interface MoonObject {
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  orbitSpeed: number;
  selfRotationSpeed: number;
}

interface PlanetObject {
  orbitGroup: THREE.Group;
  tiltGroup: THREE.Group;
  mesh: THREE.Mesh;
  atmosphereMesh?: THREE.Mesh;
  ringMesh?: THREE.Mesh;
  orbitLine: THREE.LineLoop;
  orbitRadius: number;
  orbitSpeed: number;
  selfRotationSpeed: number;
  moons: MoonObject[];
}

// ایجاد تکسچر رویه‌ای برای سطح خورشید
function createSunSurfaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#fff7ed');
  grad.addColorStop(0.25, '#fde047');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(0.75, '#fbbf24');
  grad.addColorStop(1, '#ea580c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // گرانول‌های پلاسمایی خورشیدی
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 4 + Math.random() * 24;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (i % 2 === 0) {
      g.addColorStop(0, 'rgba(255, 255, 240, 0.45)');
      g.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else {
      g.addColorStop(0, 'rgba(234, 88, 12, 0.35)');
      g.addColorStop(1, 'rgba(234, 88, 12, 0)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ایجاد تکسچر هاله درخشان خورشید (مناسب برای هر دو تم روشن و تاریک)
function createSunGlowTexture(isLightMode: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 126);
  if (isLightMode) {
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
    grad.addColorStop(0.24, 'rgba(245, 158, 11, 0.55)');
    grad.addColorStop(0.55, 'rgba(14, 165, 233, 0.16)');
    grad.addColorStop(1, 'rgba(248, 250, 252, 0)');
  } else {
    grad.addColorStop(0, 'rgba(255, 251, 235, 1)');
    grad.addColorStop(0.2, 'rgba(251, 191, 36, 0.78)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.28)');
    grad.addColorStop(0.8, 'rgba(6, 182, 212, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ایجاد تکسچر رویه‌ای برای سیارات و قمرها
function createPlanetTexture(
  type: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'moon',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (type === 'mercury' || type === 'moon') {
    const base = type === 'moon' ? '#cbd5e1' : '#94a3b8';
    const dark = type === 'moon' ? '#64748b' : '#475569';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ناهمواری‌ها و دهانه‌های برخوردی قمر و عطارد
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 3 + Math.random() * 20;
      const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
      g.addColorStop(0, dark);
      g.addColorStop(0.75, 'rgba(71, 85, 105, 0.35)');
      g.addColorStop(0.9, 'rgba(241, 245, 249, 0.35)');
      g.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'venus') {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#fcd34d');
    grad.addColorStop(0.3, '#f59e0b');
    grad.addColorStop(0.55, '#fbbf24');
    grad.addColorStop(0.8, '#d97706');
    grad.addColorStop(1, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 6) {
      ctx.fillStyle = `rgba(255, 251, 235, ${0.06 + Math.sin(y * 0.08) * 0.05})`;
      ctx.fillRect(0, y, canvas.width, 3);
    }
  } else if (type === 'earth') {
    // اقیانوس‌های آبی عمیق
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#bae6fd');
    oceanGrad.addColorStop(0.12, '#0284c7');
    oceanGrad.addColorStop(0.5, '#0369a1');
    oceanGrad.addColorStop(0.88, '#0284c7');
    oceanGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // قاره‌ها و پوشش گیاهی
    const continents = [
      { x: 110, y: 95, rx: 58, ry: 34, color: '#10b981' },
      { x: 155, y: 150, rx: 36, ry: 42, color: '#059669' },
      { x: 280, y: 85, rx: 75, ry: 36, color: '#34d399' },
      { x: 320, y: 138, rx: 45, ry: 38, color: '#d97706' },
      { x: 420, y: 170, rx: 38, ry: 24, color: '#10b981' },
    ];
    continents.forEach((c) => {
      const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, Math.max(c.rx, c.ry));
      g.addColorStop(0, c.color);
      g.addColorStop(0.7, '#047857');
      g.addColorStop(1, 'rgba(3, 105, 161, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // رگه‌های ابر سفید
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * canvas.width,
        20 + Math.random() * (canvas.height - 40),
        18 + Math.random() * 45,
        3 + Math.random() * 7,
        0.1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  } else if (type === 'mars') {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#fed7aa');
    grad.addColorStop(0.12, '#ea580c');
    grad.addColorStop(0.5, '#c2410c');
    grad.addColorStop(0.88, '#9a3412');
    grad.addColorStop(1, '#ffedd5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 70; i++) {
      const x = Math.random() * canvas.width;
      const y = 24 + Math.random() * (canvas.height - 48);
      const r = 8 + Math.random() * 28;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(124, 45, 18, 0.55)');
      g.addColorStop(1, 'rgba(194, 65, 12, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'jupiter') {
    const bands = [
      '#d6d3d1',
      '#b45309',
      '#fde68a',
      '#d97706',
      '#fffbeb',
      '#c2410c',
      '#fcd34d',
      '#92400e',
      '#fef3c7',
      '#b45309',
      '#d6d3d1',
    ];
    const bandHeight = canvas.height / bands.length;
    bands.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, idx * bandHeight, canvas.width, bandHeight + 2);
    });

    // لکه سرخ بزرگ مشتری
    const spotGrad = ctx.createRadialGradient(310, 155, 4, 310, 155, 32);
    spotGrad.addColorStop(0, '#ef4444');
    spotGrad.addColorStop(0.6, '#c2410c');
    spotGrad.addColorStop(1, 'rgba(194, 65, 12, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.ellipse(310, 155, 34, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'saturn') {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#cbd5e1');
    grad.addColorStop(0.2, '#fde68a');
    grad.addColorStop(0.4, '#eab308');
    grad.addColorStop(0.55, '#fef08a');
    grad.addColorStop(0.75, '#ca8a04');
    grad.addColorStop(0.9, '#38bdf8');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ایجاد تکسچر حلقه‌های زحل
function createSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  const grad = ctx.createRadialGradient(cx, cy, 48, cx, cy, 124);
  grad.addColorStop(0, 'rgba(254, 240, 138, 0)');
  grad.addColorStop(0.15, 'rgba(253, 224, 71, 0.35)');
  grad.addColorStop(0.38, 'rgba(250, 204, 21, 0.82)');
  grad.addColorStop(0.58, 'rgba(14, 165, 233, 0.12)'); // شکاف کاسینی
  grad.addColorStop(0.68, 'rgba(253, 224, 71, 0.68)');
  grad.addColorStop(0.88, 'rgba(56, 189, 248, 0.42)');
  grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const ThreeHeroCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { isLight } = useTheme();
  const isLightRef = useRef(isLight);

  // رفرنس‌های صحنه برای آپدیت آنی هنگام تغییر تم روشن/تاریک
  const sceneRefs = useRef<{
    ambientLight: THREE.AmbientLight;
    hemiLight: THREE.HemisphereLight;
    sunPointLight: THREE.PointLight;
    sunCoreMat: THREE.MeshBasicMaterial;
    sunGlowSpriteMat: THREE.SpriteMaterial;
    sunOuterHaloMat: THREE.SpriteMaterial;
    glowTexDark: THREE.CanvasTexture;
    glowTexLight: THREE.CanvasTexture;
    orbitLines: THREE.LineLoop[];
    starsMat: THREE.PointsMaterial;
  } | null>(null);

  useEffect(() => {
    isLightRef.current = isLight;
    const refs = sceneRefs.current;
    if (!refs) return;

    if (isLight) {
      // تنظیمات تم روشن: کنتراست واضح روز و شب روی سیارات و قمرها بدون بی‌روح شدن پس‌زمینه سفید
      refs.ambientLight.color.setHex(0xe2e8f0);
      refs.ambientLight.intensity = 0.58;

      refs.hemiLight.color.setHex(0xf8fafc);
      refs.hemiLight.groundColor.setHex(0x64748b);
      refs.hemiLight.intensity = 0.45;

      refs.sunPointLight.color.setHex(0xfffbeb);
      refs.sunPointLight.intensity = 5.4;

      refs.sunCoreMat.color.setHex(0xf59e0b);
      refs.sunGlowSpriteMat.map = refs.glowTexLight;
      refs.sunGlowSpriteMat.blending = THREE.NormalBlending;
      refs.sunGlowSpriteMat.opacity = 0.88;
      refs.sunGlowSpriteMat.needsUpdate = true;

      refs.sunOuterHaloMat.map = refs.glowTexLight;
      refs.sunOuterHaloMat.blending = THREE.NormalBlending;
      refs.sunOuterHaloMat.opacity = 0.42;
      refs.sunOuterHaloMat.needsUpdate = true;

      refs.orbitLines.forEach((line, idx) => {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.color.setHex(idx % 2 === 0 ? 0x0284c7 : 0x475569);
        mat.opacity = 0.22;
      });

      refs.starsMat.color.setHex(0x0369a1);
      refs.starsMat.opacity = 0.28;
    } else {
      // تنظیمات تم تاریک: فضای کیهانی عمیق با درخشش خورشیدی و سایه‌روشن سینمایی روی قمرها و سیارات
      refs.ambientLight.color.setHex(0x0f172a);
      refs.ambientLight.intensity = 0.26;

      refs.hemiLight.color.setHex(0x1e293b);
      refs.hemiLight.groundColor.setHex(0x020617);
      refs.hemiLight.intensity = 0.25;

      refs.sunPointLight.color.setHex(0xfff7ed);
      refs.sunPointLight.intensity = 6.2;

      refs.sunCoreMat.color.setHex(0xfef08a);
      refs.sunGlowSpriteMat.map = refs.glowTexDark;
      refs.sunGlowSpriteMat.blending = THREE.AdditiveBlending;
      refs.sunGlowSpriteMat.opacity = 0.95;
      refs.sunGlowSpriteMat.needsUpdate = true;

      refs.sunOuterHaloMat.map = refs.glowTexDark;
      refs.sunOuterHaloMat.blending = THREE.AdditiveBlending;
      refs.sunOuterHaloMat.opacity = 0.52;
      refs.sunOuterHaloMat.needsUpdate = true;

      refs.orbitLines.forEach((line, idx) => {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.color.setHex(idx % 2 === 0 ? 0x38bdf8 : 0x94a3b8);
        mat.opacity = 0.18;
      });

      refs.starsMat.color.setHex(0xe0f2fe);
      refs.starsMat.opacity = 0.72;
    }
  }, [isLight]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 740;
    const isMobileDevice =
      width < 768 ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches);
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();

    // زاویه دید متعادل: نه بیش از حد دور و ریز، و نه بیش از حد نزدیک و زننده
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(0, 7.2, 24.5);
    camera.lookAt(0, -0.4, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobileDevice,
      powerPreference: isMobileDevice ? 'low-power' : 'high-performance',
    });

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software/i.test(rendererStr);

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl || isMobileDevice ? 1 : Math.min(window.devicePixelRatio, 1.5),
    );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];
    const disposableTextures: THREE.Texture[] = [];

    // گروه اصلی منظومه شمسی با زاویه دید سینمایی در پس‌زمینه تیتر اصلی
    const solarSystemRoot = new THREE.Group();
    const baseTiltX = 0.34; // زاویه دید مایل تا مدارها و چرخش سیارات واضح دیده شود
    const baseTiltZ = -0.11;
    solarSystemRoot.rotation.set(baseTiltX, 0, baseTiltZ);
    solarSystemRoot.position.set(0, 0.2, 0);
    scene.add(solarSystemRoot);

    // نورپردازی مرکزی از قلب خورشید برای روشن شدن سمت رو به خورشید سیارات و قمرها
    const ambientLight = new THREE.AmbientLight(
      isLightRef.current ? 0xe2e8f0 : 0x0f172a,
      isLightRef.current ? 0.58 : 0.26,
    );
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      isLightRef.current ? 0xf8fafc : 0x1e293b,
      isLightRef.current ? 0x64748b : 0x020617,
      isLightRef.current ? 0.45 : 0.25,
    );
    scene.add(hemiLight);

    // منبع نور نقطه‌ای دقیقاً در مرکز خورشید (decay کم تا سیارات بیرونی و قمرهایشان هم سایه‌روشن واضح داشته باشند)
    const sunPointLight = new THREE.PointLight(
      isLightRef.current ? 0xfffbeb : 0xfff7ed,
      isLightRef.current ? 5.4 : 6.2,
      120,
      0.32,
    );
    sunPointLight.position.set(0, 0, 0);
    solarSystemRoot.add(sunPointLight);

    // ۱. ساخت خورشید در مرکز منظومه
    const sunTex = createSunSurfaceTexture();
    const glowTexDark = createSunGlowTexture(false);
    const glowTexLight = createSunGlowTexture(true);
    disposableTextures.push(sunTex, glowTexDark, glowTexLight);

    const sunGeo = new THREE.SphereGeometry(1.55, 48, 48);
    disposableGeometries.push(sunGeo);
    const sunCoreMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      color: isLightRef.current ? 0xf59e0b : 0xfef08a,
    });
    disposableMaterials.push(sunCoreMat);
    const sunMesh = new THREE.Mesh(sunGeo, sunCoreMat);
    solarSystemRoot.add(sunMesh);

    // هاله درونی و بیرونی خورشید
    const sunGlowSpriteMat = new THREE.SpriteMaterial({
      map: isLightRef.current ? glowTexLight : glowTexDark,
      transparent: true,
      opacity: isLightRef.current ? 0.88 : 0.95,
      blending: isLightRef.current ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sunOuterHaloMat = new THREE.SpriteMaterial({
      map: isLightRef.current ? glowTexLight : glowTexDark,
      transparent: true,
      opacity: isLightRef.current ? 0.42 : 0.52,
      blending: isLightRef.current ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposableMaterials.push(sunGlowSpriteMat, sunOuterHaloMat);

    const sunGlowSprite = new THREE.Sprite(sunGlowSpriteMat);
    sunGlowSprite.scale.set(5.4, 5.4, 1);
    solarSystemRoot.add(sunGlowSprite);

    const sunOuterHalo = new THREE.Sprite(sunOuterHaloMat);
    sunOuterHalo.scale.set(9.8, 9.8, 1);
    solarSystemRoot.add(sunOuterHalo);

    // ۲. مشخصات سیارات و قمرهای در حال چرخش
    const moonSharedTex = createPlanetTexture('moon');
    disposableTextures.push(moonSharedTex);

    const planetConfigs: Array<{
      type: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn';
      radius: number;
      orbitRadius: number;
      orbitSpeed: number;
      initialAngle: number;
      tilt: number;
      roughness: number;
      metalness: number;
      atmosphereColor?: number;
      hasRing?: boolean;
      moons: Array<{
        radius: number;
        distance: number;
        speed: number;
        initialAngle: number;
        inclination: number;
        color: number;
      }>;
    }> = [
      {
        type: 'mercury',
        radius: 0.24,
        orbitRadius: 3.1,
        orbitSpeed: 0.72,
        initialAngle: 0.8,
        tilt: 0.05,
        roughness: 0.85,
        metalness: 0.2,
        moons: [],
      },
      {
        type: 'venus',
        radius: 0.38,
        orbitRadius: 4.6,
        orbitSpeed: 0.52,
        initialAngle: 2.4,
        tilt: 0.12,
        roughness: 0.65,
        metalness: 0.1,
        atmosphereColor: 0xfbbf24,
        moons: [],
      },
      {
        type: 'earth',
        radius: 0.48,
        orbitRadius: 6.6,
        orbitSpeed: 0.38,
        initialAngle: -0.7,
        tilt: 0.41,
        roughness: 0.55,
        metalness: 0.12,
        atmosphereColor: 0x38bdf8,
        moons: [
          {
            radius: 0.135,
            distance: 1.05,
            speed: 2.1,
            initialAngle: 0.5,
            inclination: 0.18,
            color: 0xf1f5f9,
          },
        ],
      },
      {
        type: 'mars',
        radius: 0.34,
        orbitRadius: 8.6,
        orbitSpeed: 0.29,
        initialAngle: 3.6,
        tilt: 0.44,
        roughness: 0.8,
        metalness: 0.1,
        moons: [
          {
            radius: 0.085,
            distance: 0.72,
            speed: 2.8,
            initialAngle: 1.9,
            inclination: -0.15,
            color: 0xcbd5e1,
          },
        ],
      },
      {
        type: 'jupiter',
        radius: 0.82,
        orbitRadius: 11.4,
        orbitSpeed: 0.19,
        initialAngle: -2.1,
        tilt: 0.08,
        roughness: 0.6,
        metalness: 0.08,
        atmosphereColor: 0xf59e0b,
        moons: [
          {
            radius: 0.14,
            distance: 1.38,
            speed: 2.4,
            initialAngle: 0.2,
            inclination: 0.08,
            color: 0xfde047, // آیو
          },
          {
            radius: 0.16,
            distance: 1.82,
            speed: 1.55,
            initialAngle: 2.7,
            inclination: -0.12,
            color: 0xe2e8f0, // اروپا
          },
        ],
      },
      {
        type: 'saturn',
        radius: 0.68,
        orbitRadius: 14.8,
        orbitSpeed: 0.13,
        initialAngle: 0.55,
        tilt: 0.46,
        roughness: 0.62,
        metalness: 0.08,
        hasRing: true,
        moons: [
          {
            radius: 0.15,
            distance: 2.15,
            speed: 1.65,
            initialAngle: 1.1,
            inclination: 0.22,
            color: 0xfcd34d, // تیتان
          },
        ],
      },
    ];

    const planets: PlanetObject[] = [];
    const orbitLines: THREE.LineLoop[] = [];

    planetConfigs.forEach((cfg, idx) => {
      // خط مدار بیضوی/دایره‌ای ظریف
      const orbitCurvePoints: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitCurvePoints.push(
          new THREE.Vector3(
            Math.cos(theta) * cfg.orbitRadius,
            0,
            Math.sin(theta) * cfg.orbitRadius,
          ),
        );
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitCurvePoints);
      disposableGeometries.push(orbitGeo);

      const orbitMat = new THREE.LineBasicMaterial({
        color: isLightRef.current
          ? idx % 2 === 0
            ? 0x0284c7
            : 0x475569
          : idx % 2 === 0
            ? 0x38bdf8
            : 0x94a3b8,
        transparent: true,
        opacity: isLightRef.current ? 0.22 : 0.18,
      });
      disposableMaterials.push(orbitMat);

      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      solarSystemRoot.add(orbitLine);
      orbitLines.push(orbitLine);

      // گروه چرخش مداری سیاره به دور خورشید
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.y = cfg.initialAngle;
      solarSystemRoot.add(orbitGroup);

      // گروه محل قرارگیری سیاره روی مدار
      const tiltGroup = new THREE.Group();
      tiltGroup.position.set(cfg.orbitRadius, 0, 0);
      tiltGroup.rotation.z = cfg.tilt;
      orbitGroup.add(tiltGroup);

      // بدنه سیاره با MeshStandardMaterial تا سمت رو به خورشید روشن و سمت پشت در سایه قرار بگیرد
      const planetTex = createPlanetTexture(cfg.type);
      disposableTextures.push(planetTex);

      const sphereSegments = isMobileDevice ? 22 : 36;
      const planetGeo = new THREE.SphereGeometry(cfg.radius, sphereSegments, sphereSegments);
      disposableGeometries.push(planetGeo);

      const planetMat = new THREE.MeshStandardMaterial({
        map: planetTex,
        roughness: cfg.roughness,
        metalness: cfg.metalness,
      });
      disposableMaterials.push(planetMat);

      const planetMesh = new THREE.Mesh(planetGeo, planetMat);
      tiltGroup.add(planetMesh);

      // لایه اتمسفر ظریف برای زمین، زهره و مشتری
      let atmosphereMesh: THREE.Mesh | undefined;
      if (cfg.atmosphereColor) {
        const atmoGeo = new THREE.SphereGeometry(cfg.radius * 1.09, isMobileDevice ? 18 : 28, isMobileDevice ? 18 : 28);
        disposableGeometries.push(atmoGeo);
        const atmoMat = new THREE.MeshBasicMaterial({
          color: cfg.atmosphereColor,
          transparent: true,
          opacity: 0.14,
          side: THREE.BackSide,
        });
        disposableMaterials.push(atmoMat);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        tiltGroup.add(atmosphereMesh);
      }

      // حلقه‌های زحل
      let ringMesh: THREE.Mesh | undefined;
      if (cfg.hasRing) {
        const ringTex = createSaturnRingTexture();
        disposableTextures.push(ringTex);

        const ringGeo = new THREE.RingGeometry(cfg.radius * 1.35, cfg.radius * 2.55, isMobileDevice ? 40 : 64);
        // تنظیم UV حلقه‌ها به صورت شعاعی برای تکسچر دایره‌ای
        const pos = ringGeo.attributes.position;
        const uv = ringGeo.attributes.uv;
        const maxR = cfg.radius * 2.55;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          uv.setXY(i, vx / (maxR * 2) + 0.5, vy / (maxR * 2) + 0.5);
        }
        disposableGeometries.push(ringGeo);

        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          roughness: 0.5,
          metalness: 0.1,
        });
        disposableMaterials.push(ringMat);

        ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        tiltGroup.add(ringMesh);
      }

      // قمرهای در حال چرخش به دور سیاره (نیم‌کره رو به خورشید روشن و نیم‌کره پشت تاریک می‌شود)
      const moons: MoonObject[] = [];
      cfg.moons.forEach((mCfg) => {
        const moonPivot = new THREE.Group();
        moonPivot.rotation.z = mCfg.inclination;
        moonPivot.rotation.y = mCfg.initialAngle;
        // قمرها را مستقیماً به محل سیاره وصل می‌کنیم تا به دور آن بچرخند
        tiltGroup.add(moonPivot);

        const moonGeo = new THREE.SphereGeometry(mCfg.radius, isMobileDevice ? 16 : 24, isMobileDevice ? 16 : 24);
        disposableGeometries.push(moonGeo);

        const moonMat = new THREE.MeshStandardMaterial({
          map: moonSharedTex,
          color: mCfg.color,
          roughness: 0.82,
          metalness: 0.08,
        });
        disposableMaterials.push(moonMat);

        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(mCfg.distance, 0, 0);
        moonPivot.add(moonMesh);

        moons.push({
          pivot: moonPivot,
          mesh: moonMesh,
          orbitSpeed: mCfg.speed,
          selfRotationSpeed: 1.2,
        });
      });

      planets.push({
        orbitGroup,
        tiltGroup,
        mesh: planetMesh,
        atmosphereMesh,
        ringMesh,
        orbitLine,
        orbitRadius: cfg.orbitRadius,
        orbitSpeed: cfg.orbitSpeed,
        selfRotationSpeed: 0.8 + (planetConfigs.length - idx) * 0.18,
        moons,
      });
    });

    // ۳. ستارگان و ذرات کیهانی در پس‌زمینه برای عمق سه‌بعدی (سبک‌شده در موبایل برای کاهش مصرف باتری)
    const starCount = isMobileDevice ? 180 : 420;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 24 + Math.random() * 38;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = (r * Math.cos(phi)) * 0.55;
      starPositions[i * 3 + 2] = -8 - Math.abs(r * Math.sin(phi) * Math.sin(theta)) * 0.7;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    disposableGeometries.push(starsGeo);

    const starsMat = new THREE.PointsMaterial({
      color: isLightRef.current ? 0x0369a1 : 0xe0f2fe,
      size: 0.13,
      transparent: true,
      opacity: isLightRef.current ? 0.28 : 0.72,
      sizeAttenuation: true,
    });
    disposableMaterials.push(starsMat);

    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    sceneRefs.current = {
      ambientLight,
      hemiLight,
      sunPointLight,
      sunCoreMat,
      sunGlowSpriteMat,
      sunOuterHaloMat,
      glowTexDark,
      glowTexLight,
      orbitLines,
      starsMat,
    };

    // ۴. واکنش نرم و تعاملی به حرکت موس و اسکرول کاربر در سرتاسر صفحه
    const mouseTarget = { x: 0, y: 0 };
    const mouseCurrent = { x: 0, y: 0 };
    const scrollTarget = { y: window.scrollY || 0 };
    const scrollCurrent = { y: window.scrollY || 0 };

    const handlePointerMove = (clientX: number, clientY: number) => {
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = (clientY / window.innerHeight) * 2 - 1;
      mouseTarget.x = THREE.MathUtils.clamp(nx, -1, 1);
      mouseTarget.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onScroll = () => {
      scrollTarget.y = window.scrollY || 0;
    };

    if (!isMobileDevice) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    let animationFrameId = 0;
    let frameTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;
    let lastTime = performance.now();
    let cachedDocHeight = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1000,
    );

    const animate = () => {
      if (isCancelled) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = now * 0.001;

      if (!document.hidden) {
        // میرایی نرم برای واکنش به حرکت موس کاربر
        mouseCurrent.x = THREE.MathUtils.damp(mouseCurrent.x, mouseTarget.x, 4.2, dt);
        mouseCurrent.y = THREE.MathUtils.damp(mouseCurrent.y, mouseTarget.y, 4.2, dt);

        // پیگیری نرم اسکرول کاربر در طول صفحه (بدون فراخوانی scrollHeight در هر فریم)
        scrollCurrent.y = THREE.MathUtils.damp(scrollCurrent.y, scrollTarget.y, 3.2, dt);
        const scrollFraction = Math.min(Math.max(scrollCurrent.y / cachedDocHeight, 0), 1);

        // زاویه دید کیهانی در حال اسکرول: چرخش ملایم صفحه مدارها و باز شدن چشم‌انداز منظومه در حین اسکرول
        const scrollTilt = scrollFraction * 0.38;
        const scrollYOffset = scrollFraction * 2.2;
        const scrollZOffset = scrollFraction * 3.8;

        // واکنش زاویه منظومه و پارالاکس دوربین به موس و اسکرول
        solarSystemRoot.rotation.y = mouseCurrent.x * 0.28 + scrollFraction * 0.65;
        solarSystemRoot.rotation.x = baseTiltX + mouseCurrent.y * 0.16 + scrollTilt;
        solarSystemRoot.rotation.z = baseTiltZ - mouseCurrent.x * 0.06;

        const baseZ = window.innerWidth < 640 ? 29.5 : 24.5;
        camera.position.x = mouseCurrent.x * 1.65;
        camera.position.y = 7.2 + scrollYOffset - mouseCurrent.y * 1.15;
        camera.position.z = baseZ + scrollZOffset;
        camera.lookAt(0, -0.4 - scrollYOffset * 0.12, 0);

        if (!prefersReducedMotion) {
          // حرکت خلاف جهت آرام ستارگان پس‌زمینه برای حس عمق فضا
          starField.rotation.y = -mouseCurrent.x * 0.08 + elapsed * 0.012 + scrollFraction * 0.25;
          starField.rotation.x = -mouseCurrent.y * 0.05 + scrollFraction * 0.15;

          // چرخش محوری و تپش لطیف هاله خورشید
          sunMesh.rotation.y += dt * 0.22;
          const pulse = 1 + Math.sin(elapsed * 2.2) * 0.045;
          sunGlowSprite.scale.set(5.4 * pulse, 5.4 * pulse, 1);
          sunOuterHalo.scale.set(9.8 * (2 - pulse), 9.8 * (2 - pulse), 1);

          // چرخش سیارات به دور خورشید و قمرها به دور سیارات
          for (let i = 0; i < planets.length; i++) {
            const p = planets[i];
            p.orbitGroup.rotation.y += dt * p.orbitSpeed;
            p.mesh.rotation.y += dt * p.selfRotationSpeed;

            for (let m = 0; m < p.moons.length; m++) {
              const moon = p.moons[m];
              moon.pivot.rotation.y += dt * moon.orbitSpeed;
              moon.mesh.rotation.y += dt * moon.selfRotationSpeed;
            }
          }
        }

        renderer.render(scene, camera);
      }

      const afterDraw = () => {
        if (isCancelled) return;
        animationFrameId = requestAnimationFrame(animate);
      };

      // در موبایل و حالت کاهش مصرف باتری، نرخ فریم به ~۲۸ فریم بر ثانیه تنظیم می‌شود تا مصرف باتری و داغ شدن به حداقل برسد
      if (isSoftwareGl || isMobileDevice || prefersReducedMotion) {
        frameTimeoutId = setTimeout(afterDraw, isMobileDevice ? 34 : 16);
      } else {
        afterDraw();
      }
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      cachedDocHeight = Math.max(
        document.documentElement.scrollHeight - newHeight,
        1000,
      );
      camera.aspect = newWidth / newHeight;
      const baseZ = newWidth < 640 ? 29.5 : 24.5;
      camera.position.z = baseZ;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      if (frameTimeoutId) clearTimeout(frameTimeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* بوم سه‌بعدی منظومه شمسی پایدار در کل پیمایش صفحه */}
      <div
        ref={mountRef}
        className="w-full h-full"
      />

      {/* هاله ملایم برای تضمین خوانایی ایده‌آل متن‌ها و کارت‌ها در طول کل اسکرول */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
          isLight
            ? 'bg-[radial-gradient(ellipse_65%_55%_at_50%_35%,rgba(248,250,252,0.48)_0%,rgba(248,250,252,0.22)_55%,rgba(248,250,252,0.62)_100%)]'
            : 'bg-[radial-gradient(ellipse_65%_55%_at_50%_35%,rgba(4,7,13,0.48)_0%,rgba(4,7,13,0.18)_55%,rgba(4,7,13,0.65)_100%)]'
        }`}
      />
    </div>
  );
};
