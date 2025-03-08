import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  selectedRegion: string;
  metrics: {
    temperature: string;
    precipitation: string;
    seaLevel: string;
    extremeEvents: string;
  };
}

const Globe = ({ selectedRegion, metrics }: GlobeProps) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Load textures
  const textures = useTexture({
    map: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    bumpMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    specularMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    cloudsMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  });

  useEffect(() => {
    if (!globeRef.current) return;

    // Create climate impact overlay
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Create gradient based on temperature
    const temp = parseFloat(metrics.temperature);
    const getTemperatureColor = (t: number) => {
      if (t > 2) return 'rgba(239, 68, 68, 0.6)'; // Red with transparency
      if (t > 1) return 'rgba(249, 115, 22, 0.6)'; // Orange with transparency
      return 'rgba(34, 197, 94, 0.6)'; // Green with transparency
    };

    // Draw base layer
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add region highlights
    const regions: Record<string, [number, number, number, number]> = {
      'North America': [400, 100, 600, 300],
      'Europe': [900, 100, 300, 200],
      'Asia': [1200, 100, 500, 400],
      'Africa': [900, 300, 300, 400],
      'South America': [600, 400, 300, 400],
      'Oceania': [1400, 500, 400, 300]
    };

    // Apply climate impact visualization
    if (selectedRegion !== 'Global' && regions[selectedRegion]) {
      const [x, y, w, h] = regions[selectedRegion];
      ctx.fillStyle = getTemperatureColor(temp);
      ctx.fillRect(x, y, w, h);
      
      // Add glow effect
      const gradient = ctx.createRadialGradient(
        x + w/2, y + h/2, 0,
        x + w/2, y + h/2, Math.max(w, h)/2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 50, y - 50, w + 100, h + 100);
    }

    // Create texture from canvas
    const climateTexture = new THREE.CanvasTexture(canvas);
    climateTexture.needsUpdate = true;

    // Apply textures to globe
    const material = globeRef.current.material as THREE.MeshPhongMaterial;
    material.map = textures.map;
    material.bumpMap = textures.bumpMap;
    material.bumpScale = 0.05;
    material.specularMap = textures.specularMap;
    material.specular = new THREE.Color(0x333333);
    material.shininess = 25;

    // Add climate impact overlay
    material.emissiveMap = climateTexture;
    material.emissive = new THREE.Color(0xffffff);
    material.emissiveIntensity = 0.5;
  }, [selectedRegion, metrics, textures]);

  // Animate the globe and clouds
  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.07;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial />
      </mesh>

      {/* Clouds layer */}
      <mesh ref={cloudsRef} scale={[1.003, 1.003, 1.003]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={textures.cloudsMap}
          transparent={true}
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          color={0x93c5fd}
          transparent={true}
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

const ClimateGlobe = ({ selectedRegion, metrics }: GlobeProps) => {
  return (
    <div className="w-full h-[600px] bg-background rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        <Globe selectedRegion={selectedRegion} metrics={metrics} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={4}
          maxDistance={8}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default ClimateGlobe;