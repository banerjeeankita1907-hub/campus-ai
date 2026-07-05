'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { SensorData } from '@/lib/sensor-simulator';

function SensorMarker({ sensor }: { sensor: SensorData }) {
  const color = sensor.anomaly ? '#ef4444' : '#22c55e';
  const x = (sensor.lng - (-118.1253)) * 2000;
  const z = (sensor.lat - 34.1377) * 2000;
  return (
    <group position={[x, 0.3, z]}>
      <Sphere args={[0.12, 16, 16]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </Sphere>
      <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-[8px] text-white font-mono bg-black/60 px-1 rounded leading-none">
          {sensor.building}
        </div>
      </Html>
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

export default function Campus3D({ sensors }: { sensors: SensorData[] }) {
  return (
    <Canvas camera={{ position: [8, 6, 8], fov: 45 }} style={{ height: '100%', width: '100%' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <Ground />
      {sensors.map((s) => (
        <SensorMarker key={s.id} sensor={s} />
      ))}
      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}
