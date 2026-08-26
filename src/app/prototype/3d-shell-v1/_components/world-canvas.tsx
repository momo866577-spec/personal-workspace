"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";
import {
  HOME_CAMERA, HOME_FEATURES, HOME_WORLD_POSITION, MOTION, SPACES, THEME,
  type PrimarySpaceId, type SpaceId,
} from "../_lib/experience-config";

interface WorldCanvasProps {
  activeSpace: SpaceId;
  workMode: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  visible: boolean;
  onSpaceSelect: (space: PrimarySpaceId) => void;
}

function CameraController({ activeSpace, workMode, reducedMotion }: Pick<WorldCanvasProps, "activeSpace" | "workMode" | "reducedMotion">) {
  const { camera } = useThree();
  const cameraRef = useRef(camera);
  const lookAt = useRef(new THREE.Vector3(...HOME_CAMERA.target));
  const definition = SPACES.find((item) => item.id === activeSpace);
  const targetPosition = useMemo(() => new THREE.Vector3(...(definition?.cameraPosition ?? HOME_CAMERA.position)), [definition]);
  const targetLookAt = useMemo(() => new THREE.Vector3(...(definition?.cameraTarget ?? HOME_CAMERA.target)), [definition]);

  useFrame((_, delta) => {
    const activeCamera = cameraRef.current;
    const speed = reducedMotion || workMode ? 12 : MOTION.cameraDamping;
    activeCamera.position.x = THREE.MathUtils.damp(activeCamera.position.x, targetPosition.x, speed, delta);
    activeCamera.position.y = THREE.MathUtils.damp(activeCamera.position.y, targetPosition.y, speed, delta);
    activeCamera.position.z = THREE.MathUtils.damp(activeCamera.position.z, targetPosition.z, speed, delta);
    lookAt.current.lerp(targetLookAt, 1 - Math.exp(-speed * delta));
    activeCamera.lookAt(lookAt.current);
  });
  return null;
}

function HomeHub({ active }: { active: boolean }) {
  const group = useRef<Group>(null);
  const orb = useRef<Mesh>(null);
  const nodes = useMemo(() => HOME_FEATURES.map((feature, index) => {
    const angle = (index / HOME_FEATURES.length) * Math.PI * 2;
    const radius = index % 2 ? 2.45 : 1.85;
    return { ...feature, point: [Math.cos(angle) * radius, 0.4 + (index % 3) * 0.34, Math.sin(angle) * 0.85] as const };
  }), []);

  useFrame(({ clock }, delta) => {
    if (!group.current || !orb.current) return;
    const scale = active ? 1 : 0.78;
    group.current.scale.x = THREE.MathUtils.damp(group.current.scale.x, scale, 4, delta);
    group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, scale, 4, delta);
    group.current.scale.z = THREE.MathUtils.damp(group.current.scale.z, scale, 4, delta);
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.045;
    orb.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={group} position={HOME_WORLD_POSITION as [number, number, number]}>
      <mesh position={[0, -0.62, 0]} receiveShadow>
        <cylinderGeometry args={[3.25, 3.65, 0.22, 96]} />
        <meshStandardMaterial color="#28232d" roughness={0.52} metalness={0.24} />
      </mesh>
      <mesh ref={orb} position={[0, 0.75, -0.2]} castShadow>
        <icosahedronGeometry args={[0.78, 4]} />
        <meshPhysicalMaterial color="#d25c8d" emissive="#7c254b" emissiveIntensity={0.32} roughness={0.22} metalness={0.38} clearcoat={0.5} />
      </mesh>
      {[1.24, 1.58].map((radius, index) => (
        <mesh key={radius} position={[0, 0.75, -0.2]} rotation={[Math.PI / 2 + index * 0.35, index * 0.2, 0]}>
          <torusGeometry args={[radius, 0.026, 12, 96]} />
          <meshStandardMaterial color={index ? "#ffb56d" : "#f8c0d4"} emissive={index ? "#9c4814" : "#7a3852"} emissiveIntensity={0.42} />
        </mesh>
      ))}
      {nodes.map((node, index) => (
        <group key={node.id} position={node.point as [number, number, number]}>
          <mesh castShadow rotation={[index * 0.08, index * 0.17, 0]}>
            {index % 3 === 0 ? <octahedronGeometry args={[0.2, 1]} /> : index % 3 === 1 ? <sphereGeometry args={[0.18, 20, 20]} /> : <boxGeometry args={[0.27, 0.27, 0.27]} />}
            <meshStandardMaterial color={node.tone} emissive={node.tone} emissiveIntensity={active ? 0.32 : 0.06} roughness={0.32} metalness={0.24} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 1.4, 1.2]} color="#e9669b" intensity={active ? 34 : 7} distance={7} decay={2} />
    </group>
  );
}

function PlanningForm() {
  return <>
    {[-0.8, 0, 0.8].map((x, i) => <mesh key={x} position={[x, 0.62 + i * 0.1, -0.3 - i * 0.12]} rotation={[0, 0, (i - 1) * 0.08]} castShadow><boxGeometry args={[0.62, 1.35, 0.12]} /><meshStandardMaterial color={i === 1 ? "#f1b0c7" : "#9f6685"} roughness={0.34} metalness={0.22} /></mesh>)}
    <mesh position={[0, 0.65, -0.5]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[1.34, 0.045, 16, 80, Math.PI]} /><meshStandardMaterial color="#ffc3d5" emissive="#8f355d" emissiveIntensity={0.35} /></mesh>
  </>;
}

function LearningForm() {
  return <>
    {[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => <mesh key={x} position={[x, 0.4 + Math.abs(i - 2) * 0.16, -0.15]} rotation={[0.2, (i - 2) * -0.18, (i - 2) * 0.04]} castShadow><boxGeometry args={[0.44, 1.5, 0.08]} /><meshStandardMaterial color={i % 2 ? "#bba1ff" : "#7556c9"} roughness={0.31} metalness={0.2} /></mesh>)}
    <mesh position={[0, 1.02, -0.65]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.18, 0.035, 16, 80]} /><meshStandardMaterial color="#d8c7ff" emissive="#6e4eb9" emissiveIntensity={0.4} /></mesh>
  </>;
}

function ExerciseForm() {
  return <>
    {[0.78, 1.16, 1.53].map((r, i) => <mesh key={r} position={[0, 0.58, -0.2]} rotation={[Math.PI / 2 + i * 0.34, i * 0.2, 0]} castShadow><torusGeometry args={[r, 0.1 - i * 0.018, 18, 80]} /><meshStandardMaterial color={i === 1 ? "#ff9a71" : "#e4513d"} emissive="#8b2419" emissiveIntensity={0.24} roughness={0.28} metalness={0.38} /></mesh>)}
    <mesh position={[0, 0.58, -0.2]}><sphereGeometry args={[0.35, 32, 32]} /><meshStandardMaterial color="#ffc3a6" emissive="#c84a32" emissiveIntensity={0.4} /></mesh>
  </>;
}

function FoodForm() {
  return <>
    <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]} castShadow><sphereGeometry args={[1.23, 56, 30, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#2e9b6d" roughness={0.32} metalness={0.2} /></mesh>
    {[[-0.55, 0.8, 0.08], [0.12, 0.96, -0.12], [0.63, 0.72, 0.02]].map((p, i) => <mesh key={i} position={p as [number, number, number]} castShadow><sphereGeometry args={[0.3 + i * 0.04, 28, 28]} /><meshStandardMaterial color={i === 1 ? "#ffab86" : i === 2 ? "#9ddd83" : "#56c59a"} roughness={0.38} /></mesh>)}
    <mesh position={[0, 0.38, -0.4]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.45, 0.055, 16, 90]} /><meshStandardMaterial color="#b7f1cd" emissive="#247752" emissiveIntensity={0.3} /></mesh>
  </>;
}

function TravelForm() {
  return <>
    {[0.76, 1.16, 1.56].map((r, i) => <mesh key={r} position={[0, 0.66, -0.35]} rotation={[0, 0, 0]}><torusGeometry args={[r, 0.05, 16, 100]} /><meshStandardMaterial color={i === 1 ? "#72d9d0" : "#168fb5"} emissive="#126e89" emissiveIntensity={0.32} metalness={0.38} roughness={0.25} /></mesh>)}
    <mesh position={[0, 0.66, -0.5]} rotation={[0, 0, -0.28]} castShadow><coneGeometry args={[0.38, 1.45, 3]} /><meshStandardMaterial color="#a9f0e4" roughness={0.28} metalness={0.25} /></mesh>
  </>;
}

function NotesForm() {
  return <>
    {[[-0.72, 0.48, 0.1, -0.18], [0, 0.73, -0.1, 0.05], [0.7, 0.43, 0.05, 0.2]].map((p, i) => <mesh key={i} position={[p[0], p[1], p[2]]} rotation={[0.08, p[3], p[3]]} castShadow><boxGeometry args={[0.9, 1.35, 0.08]} /><meshStandardMaterial color={i === 1 ? "#f0b52f" : "#e9788a"} roughness={0.42} metalness={0.12} /></mesh>)}
    <mesh position={[0, 0.55, -0.55]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.38, 0.045, 16, 90]} /><meshStandardMaterial color="#ffe09a" emissive="#b57c14" emissiveIntensity={0.35} /></mesh>
  </>;
}

function SpaceArchitecture({ id, active, onSelect }: { id: PrimarySpaceId; active: boolean; onSelect: () => void }) {
  const definition = SPACES.find((item) => item.id === id)!;
  const group = useRef<Group>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const scale = active ? 1.08 : 0.82;
    group.current.scale.x = THREE.MathUtils.damp(group.current.scale.x, scale, 4.8, delta);
    group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, scale, 4.8, delta);
    group.current.scale.z = THREE.MathUtils.damp(group.current.scale.z, scale, 4.8, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, active ? Math.sin(clock.elapsedTime * 0.72) * 0.035 : 0, 3.2, delta);
  });
  return (
    <group ref={group} position={definition.worldPosition as [number, number, number]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh position={[0, -0.62, 0]} receiveShadow><cylinderGeometry args={[2.1, 2.45, 0.2, 72]} /><meshStandardMaterial color="#27242e" roughness={0.48} metalness={0.28} /></mesh>
      {id === "planning" && <PlanningForm />}{id === "learning" && <LearningForm />}{id === "exercise" && <ExerciseForm />}
      {id === "food" && <FoodForm />}{id === "travel" && <TravelForm />}{id === "notes" && <NotesForm />}
      <pointLight position={[0, 1.4, 1.4]} color={definition.accent} intensity={active ? 31 : 7} distance={6.5} decay={2} />
    </group>
  );
}

function WorldScene(props: WorldCanvasProps) {
  return <>
    <fog attach="fog" args={[THEME.fog, 7, 34]} />
    <ambientLight intensity={0.72} color="#fff0e2" />
    <hemisphereLight args={["#ffe9dc", "#17151e", 1.15]} />
    <directionalLight position={[-2, 9, 8]} intensity={3.8} color="#ffe6d1" castShadow={!props.mobile} shadow-mapSize-width={props.mobile ? 256 : 1024} shadow-mapSize-height={props.mobile ? 256 : 1024} />
    <directionalLight position={[24, 4, -5]} intensity={1.8} color="#9cbcff" />
    <CameraController activeSpace={props.activeSpace} workMode={props.workMode} reducedMotion={props.reducedMotion} />
    <mesh position={[12.5, -0.78, -0.25]} receiveShadow><boxGeometry args={[52, 0.18, 8]} /><meshStandardMaterial color="#211f27" roughness={0.6} metalness={0.18} /></mesh>
    <mesh position={[12.5, 2.2, -4.2]}><planeGeometry args={[54, 7]} /><meshStandardMaterial color="#1b1921" roughness={0.92} /></mesh>
    <HomeHub active={props.activeSpace === "home"} />
    {SPACES.map((space) => <SpaceArchitecture key={space.id} id={space.id} active={props.activeSpace === space.id} onSelect={() => props.onSpaceSelect(space.id)} />)}
  </>;
}

export function WorldCanvas(props: WorldCanvasProps) {
  return <Canvas
    dpr={props.mobile ? [1, 1.15] : [1, 1.5]}
    camera={{ position: HOME_CAMERA.position as [number, number, number], fov: props.mobile ? 48 : 42, near: 0.1, far: 70 }}
    frameloop={props.visible ? (props.workMode ? "demand" : "always") : "never"}
    gl={{ antialias: !props.mobile, powerPreference: "high-performance", alpha: false }}
    shadows={!props.mobile}
    onCreated={({ gl, scene }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.18;
      gl.outputColorSpace = THREE.SRGBColorSpace;
      scene.background = new THREE.Color(THEME.background);
    }}
  ><WorldScene {...props} /></Canvas>;
}
