import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

/**
 * پس‌زمینه موج‌های سه‌بعدی نوری (Sixfold 3D Glowing Wave Lines)
 * سازگار با هر دو تم تیره و روشن بدون بازسازی WebGLRenderer
 */
export const ThreeHeroCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { isLight } = useTheme();
  const materialsRef = useRef<THREE.LineBasicMaterial[]>([]);
  const gridMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useEffect(() => {
    const darkColors = [0x00E5FF, 0x0088FF, 0x0055EE, 0x38BDF8, 0x0EA5E9];
    const lightColors = [0x0284C7, 0x2563EB, 0x0369A1, 0x4F46E5, 0x0EA5E9];
    const palette = isLight ? lightColors : darkColors;

    materialsRef.current.forEach((mat, idx) => {
      mat.color.setHex(palette[idx % palette.length]);
      mat.opacity = isLight
        ? 0.18 + (idx / materialsRef.current.length) * 0.25
        : 0.25 + (idx / materialsRef.current.length) * 0.35;
      mat.needsUpdate = true;
    });

    if (gridMatRef.current) {
      gridMatRef.current.color.setHex(isLight ? 0x64748b : 0x0055aa);
      gridMatRef.current.opacity = isLight ? 0.06 : 0.08;
      gridMatRef.current.needsUpdate = true;
    }
  }, [isLight]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3, 24);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, Math.min(height, 800));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    container.appendChild(renderer.domElement);

    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    const isMobile = width < 768;
    const waveLines: { line: THREE.Line; basePoints: THREE.Vector3[]; speed: number; amp: number }[] = [];
    const lineColors = [0x00E5FF, 0x0088FF, 0x0055EE, 0x38BDF8, 0x0EA5E9];
    const numLines = isMobile ? 5 : 8;
    const segments = isMobile ? 28 : 45;
    const length = 44;
    const mats: THREE.LineBasicMaterial[] = [];

    for (let l = 0; l < numLines; l++) {
      const points: THREE.Vector3[] = [];
      const basePoints: THREE.Vector3[] = [];
      const yOffset = (l - numLines / 2) * 1.1 - 4;
      const zOffset = (l - numLines / 2) * 1.5;

      for (let i = 0; i <= segments; i++) {
        const x = (i / segments - 0.5) * length;
        const pt = new THREE.Vector3(x, yOffset, zOffset);
        points.push(pt.clone());
        basePoints.push(pt.clone());
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: lineColors[l % lineColors.length],
        transparent: true,
        opacity: 0.25 + (l / numLines) * 0.35,
      });

      mats.push(material);
      const line = new THREE.Line(geometry, material);
      lineGroup.add(line);

      waveLines.push({
        line,
        basePoints,
        speed: 0.7 + l * 0.12,
        amp: 1.1 + l * 0.18,
      });
    }
    materialsRef.current = mats;

    const gridCols = 24;
    const gridRows = 16;
    const gridGeo = new THREE.PlaneGeometry(50, 26, gridCols, gridRows);
    gridGeo.rotateX(-Math.PI / 2.2);

    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0055aa,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    gridMatRef.current = gridMat;
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.set(0, -6, -5);
    scene.add(gridMesh);

    let mouseX = 0;
    let mouseY = 0;
    let mouseTicking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseTicking) {
        window.requestAnimationFrame(() => {
          mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
          mouseTicking = false;
        });
        mouseTicking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let animationFrameId: number;
    const clock = new THREE.Clock();
    let isVisible = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      waveLines.forEach((item, lIdx) => {
        const posAttr = item.line.geometry.attributes.position as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;

        for (let i = 0; i <= segments; i++) {
          const base = item.basePoints[i];
          const wavePhase = base.x * 0.18 + elapsed * item.speed + lIdx * 0.4;
          const y = base.y + Math.sin(wavePhase) * item.amp + Math.cos(base.x * 0.1 + elapsed * 0.5) * 0.6;
          const z = base.z + Math.cos(wavePhase * 0.8) * 0.8;

          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
        }
        posAttr.needsUpdate = true;
      });

      lineGroup.rotation.y = THREE.MathUtils.lerp(lineGroup.rotation.y, mouseX * 0.15, 0.04);
      lineGroup.rotation.x = THREE.MathUtils.lerp(lineGroup.rotation.x, -mouseY * 0.08, 0.04);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.min(container.clientHeight || 600, 800);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      waveLines.forEach((w) => {
        w.line.geometry.dispose();
        (w.line.material as THREE.Material).dispose();
      });
      gridGeo.dispose();
      gridMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute top-0 left-0 right-0 h-[700px] pointer-events-none z-0 overflow-hidden"
      style={{ contain: 'paint' }}
      aria-hidden="true"
    />
  );
};
