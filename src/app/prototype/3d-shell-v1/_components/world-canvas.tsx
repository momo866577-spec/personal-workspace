"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";
import {
  ANCHORS,
  MOTION,
  PLANNING_CAMERA,
  PLANNING_FEATURES,
  THEME,
  WORK_CAMERA,
  type AnchorId,
  type FeatureId,
  type Point3,
  type SpaceId,
} from "../_lib/experience-config";

interface WorldCanvasProps {
  activeAnchor: AnchorId;
  activeSpace: SpaceId;
  activeFeature: FeatureId | null;
  workMode: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  visible: boolean;
  onAnchorSelect: (anchor: AnchorId) => void;
  onEnterPlanning: () => void;
  onFeatureSelect: (feature: FeatureId) => void;
}

function CameraController({
  activeAnchor,
  activeSpace,
  workMode,
  reducedMotion,
}: Pick<WorldCanvasProps, "activeAnchor" | "activeSpace" | "workMode" | "reducedMotion">) {
  const { camera } = useThree();
  const cameraRef = useRef(camera);
  const lookAt = useRef(new THREE.Vector3(0, 0.6, 0));
  const targetPosition = useMemo(() => {
    const anchor = ANCHORS.find((item) => item.id === activeAnchor) ?? ANCHORS[0];
    const point = workMode
      ? WORK_CAMERA.position
      : activeSpace === "planning"
        ? PLANNING_CAMERA.position
        : anchor.cameraPosition;
    return new THREE.Vector3(...point);
  }, [activeAnchor, activeSpace, workMode]);
  const targetLookAt = useMemo(() => {
    const anchor = ANCHORS.find((item) => item.id === activeAnchor) ?? ANCHORS[0];
    const point = workMode
      ? WORK_CAMERA.target
      : activeSpace === "planning"
        ? PLANNING_CAMERA.target
        : anchor.cameraTarget;
    return new THREE.Vector3(...point);
  }, [activeAnchor, activeSpace, workMode]);

  useFrame((_, delta) => {
    const activeCamera = cameraRef.current;
    if (workMode || reducedMotion) {
      activeCamera.position.lerp(targetPosition, Math.min(1, delta * 12));
      lookAt.current.lerp(targetLookAt, Math.min(1, delta * 14));
    } else {
      activeCamera.position.x = THREE.MathUtils.damp(
        activeCamera.position.x,
        targetPosition.x,
        MOTION.cameraDamping,
        delta,
      );
      activeCamera.position.y = THREE.MathUtils.damp(
        activeCamera.position.y,
        targetPosition.y,
        MOTION.cameraDamping,
        delta,
      );
      activeCamera.position.z = THREE.MathUtils.damp(
        activeCamera.position.z,
        targetPosition.z,
        MOTION.cameraDamping,
        delta,
      );
      lookAt.current.lerp(targetLookAt, 1 - Math.exp(-MOTION.cameraDamping * delta));
    }
    activeCamera.lookAt(lookAt.current);
  });

  return null;
}

function SoftArchitecture({ activeSpace, workMode }: Pick<WorldCanvasProps, "activeSpace" | "workMode">) {
  const atmosphere = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    if (!atmosphere.current || workMode) return;
    atmosphere.current.rotation.y = THREE.MathUtils.damp(
      atmosphere.current.rotation.y,
      Math.sin(clock.elapsedTime * 0.12) * 0.018,
      2.2,
      delta,
    );
  });

  return (
    <group ref={atmosphere}>
      <mesh position={[8.8, -0.68, -1.1]} receiveShadow>
        <boxGeometry args={[23, 0.18, 8.5]} />
        <meshStandardMaterial color={THEME.ivory} roughness={0.72} metalness={0.08} />
      </mesh>

      {[1.9, 6.9, 11.4, 15.7].map((x, index) => (
        <group key={x} position={[x, 1.9 + (index % 2) * 0.18, -3.2]}>
          <mesh castShadow rotation={[0, 0, index % 2 ? -0.08 : 0.08]}>
            <torusGeometry args={[2.05, 0.13, 22, 80, Math.PI]} />
            <meshStandardMaterial
              color={index === 1 ? THEME.mauve : THEME.silver}
              roughness={0.36}
              metalness={0.5}
            />
          </mesh>
          <mesh position={[0, -0.25, -0.25]} rotation={[0.04, 0, 0]}>
            <planeGeometry args={[4.1, 3.15]} />
            <meshStandardMaterial
              color={THEME.warmIvory}
              transparent
              opacity={0.24}
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {[-1.3, 3.25, 7.7, 12.2, 16.8, 20.1].map((x, index) => (
        <mesh
          key={x}
          position={[x, 0.05 + (index % 2) * 0.13, -4.4 + (index % 3) * 0.35]}
          rotation={[-Math.PI / 2, 0, index * 0.14]}
        >
          <circleGeometry args={[1.3 + (index % 2) * 0.35, 64]} />
          <meshStandardMaterial
            color={index % 2 ? THEME.blush : THEME.moss}
            transparent
            opacity={0.13}
            roughness={0.82}
          />
        </mesh>
      ))}

      <mesh position={[8.9, 1.4, -6.1]} rotation={[0, 0.15, 0]}>
        <planeGeometry args={[24, 5.2]} />
        <meshStandardMaterial color={THEME.background} roughness={0.95} />
      </mesh>

      <PlanningArchitecture active={activeSpace === "planning"} />
      <Rail />
    </group>
  );
}

function Rail() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.2, -0.42, 1.3),
        ...ANCHORS.map(
          (anchor) =>
            new THREE.Vector3(anchor.worldPosition[0], -0.42, anchor.worldPosition[2] + 1.25),
        ),
        new THREE.Vector3(19.3, -0.42, 0.3),
      ]),
    [],
  );
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 160, 0.028, 10, false), [curve]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#b6a29c" metalness={0.55} roughness={0.3} />
    </mesh>
  );
}

function PlanningArchitecture({ active }: { active: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = active ? 1 : 0.72;
    group.current.scale.x = THREE.MathUtils.damp(group.current.scale.x, target, 4.5, delta);
    group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, target, 4.5, delta);
    group.current.scale.z = THREE.MathUtils.damp(group.current.scale.z, target, 4.5, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, active ? 0 : 0.14, 4, delta);
  });
  return (
    <group ref={group} position={[4.8, 0, -1.25]} scale={0.72}>
      <mesh position={[0, 1.2, -1.2]} castShadow>
        <boxGeometry args={[5.4, 0.12, 2.8]} />
        <meshStandardMaterial color="#ddd3d1" roughness={0.55} metalness={0.16} />
      </mesh>
      <mesh position={[-2.35, 0.45, -1.15]} castShadow>
        <boxGeometry args={[0.1, 2.85, 2.9]} />
        <meshStandardMaterial color="#c6b9bd" roughness={0.48} metalness={0.22} />
      </mesh>
      <mesh position={[2.35, 0.45, -1.15]} castShadow>
        <boxGeometry args={[0.1, 2.85, 2.9]} />
        <meshStandardMaterial color="#c6b9bd" roughness={0.48} metalness={0.22} />
      </mesh>
      <mesh position={[0, -0.25, -0.4]} receiveShadow>
        <cylinderGeometry args={[2.45, 2.7, 0.22, 80]} />
        <meshStandardMaterial color="#efe8e1" roughness={0.8} />
      </mesh>
    </group>
  );
}

function FeatureLandmark({
  id,
  position,
  accent,
  secondary,
  active,
  muted,
  onSelect,
}: {
  id: AnchorId;
  position: Point3;
  accent: string;
  secondary: string;
  active: boolean;
  muted: boolean;
  onSelect: () => void;
}) {
  const group = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current || !core.current) return;
    const target = active ? 1.07 : muted ? 0.82 : 0.92;
    group.current.scale.x = THREE.MathUtils.damp(group.current.scale.x, target, 5, delta);
    group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, target, 5, delta);
    group.current.scale.z = THREE.MathUtils.damp(group.current.scale.z, target, 5, delta);
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      active ? 0.08 + Math.sin(clock.elapsedTime * 0.85) * 0.025 : 0,
      3,
      delta,
    );
    core.current.rotation.y += delta * (active ? 0.2 : 0.05);
  });

  return (
    <group
      ref={group}
      position={position as [number, number, number]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <mesh position={[0, -0.48, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.55, 0.22, 64]} />
        <meshStandardMaterial color="#ded7d0" roughness={0.78} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow ref={core}>
        {id === "today" && <sphereGeometry args={[0.82, 48, 48]} />}
        {id === "planning" && <torusKnotGeometry args={[0.58, 0.18, 90, 18, 2, 3]} />}
        {id === "learning" && <octahedronGeometry args={[0.92, 2]} />}
        {id === "health" && <torusGeometry args={[0.68, 0.24, 32, 72]} />}
        {id === "travel" && <dodecahedronGeometry args={[0.82, 1]} />}
        <meshStandardMaterial
          color={accent}
          emissive={active ? accent : "#000000"}
          emissiveIntensity={active ? 0.12 : 0}
          roughness={0.34}
          metalness={0.28}
          transparent
          opacity={muted ? 0.34 : 1}
        />
      </mesh>
      <mesh position={[0, 0.35, 0]} scale={1.32}>
        <sphereGeometry args={[0.83, 32, 32]} />
        <meshBasicMaterial color={secondary} transparent opacity={active ? 0.055 : 0.018} />
      </mesh>
      <pointLight
        position={[0, 1.1, 1.15]}
        color={accent}
        intensity={active ? 6.5 : 0.2}
        distance={5}
        decay={2}
      />
    </group>
  );
}

function PlanningFeatureObjects({
  active,
  onFeatureSelect,
}: {
  active: boolean;
  onFeatureSelect: (feature: FeatureId) => void;
}) {
  return (
    <group visible={active}>
      {PLANNING_FEATURES.map((feature, index) => (
        <group
          key={feature.id}
          position={feature.position as [number, number, number]}
          onClick={(event) => {
            event.stopPropagation();
            onFeatureSelect(feature.id);
          }}
        >
          <mesh castShadow rotation={[0, index === 0 ? 0 : index === 1 ? -0.24 : 0.24, 0]}>
            {index === 0 ? (
              <boxGeometry args={[1.65, 1.05, 0.16]} />
            ) : (
              <cylinderGeometry args={[0.48, 0.62, 1.25, 48]} />
            )}
            <meshStandardMaterial
              color={index === 0 ? "#c89aaf" : index === 1 ? "#b9c1be" : "#d8b9ae"}
              roughness={0.35}
              metalness={0.27}
              emissive={index === 0 ? "#7e4e66" : "#000000"}
              emissiveIntensity={index === 0 ? 0.1 : 0}
            />
          </mesh>
          <mesh position={[0, -0.72, 0]} receiveShadow>
            <cylinderGeometry args={[0.72, 0.86, 0.12, 48]} />
            <meshStandardMaterial color="#e6ded7" roughness={0.8} />
          </mesh>
          <pointLight
            position={[0, 0.35, 0.8]}
            color={index === 0 ? THEME.blush : THEME.warmIvory}
            intensity={index === 0 ? 4 : 1}
            distance={3}
          />
        </group>
      ))}
    </group>
  );
}

function WorldScene(props: WorldCanvasProps) {
  const activeIndex = ANCHORS.findIndex((anchor) => anchor.id === props.activeAnchor);
  return (
    <>
      <fog attach="fog" args={[THEME.fog, 7, 25]} />
      <ambientLight intensity={1.8} color="#fff7ef" />
      <hemisphereLight args={["#fff8f0", "#8f8584", 1.5]} />
      <directionalLight
        position={[4, 9, 7]}
        intensity={3.2}
        color="#fff2e6"
        castShadow={!props.mobile}
        shadow-mapSize-width={props.mobile ? 256 : 1024}
        shadow-mapSize-height={props.mobile ? 256 : 1024}
      />
      <directionalLight position={[15, 4, -4]} intensity={1.2} color="#dfb6c8" />
      <CameraController
        activeAnchor={props.activeAnchor}
        activeSpace={props.activeSpace}
        workMode={props.workMode}
        reducedMotion={props.reducedMotion}
      />
      <SoftArchitecture
        activeSpace={props.activeSpace}
        workMode={props.workMode}
      />
      <group visible={props.activeSpace === "main"}>
        {ANCHORS.map((anchor) => (
          <FeatureLandmark
            key={anchor.id}
            id={anchor.id}
            position={anchor.worldPosition}
            accent={anchor.accent}
            secondary={anchor.accentSecondary}
            active={anchor.id === props.activeAnchor}
            muted={Math.abs(anchor.index - activeIndex) > 1}
            onSelect={() => {
              if (anchor.id === "planning" && props.activeAnchor === "planning") {
                props.onEnterPlanning();
              } else {
                props.onAnchorSelect(anchor.id);
              }
            }}
          />
        ))}
      </group>
      <PlanningFeatureObjects
        active={props.activeSpace === "planning"}
        onFeatureSelect={props.onFeatureSelect}
      />
    </>
  );
}

export function WorldCanvas(props: WorldCanvasProps) {
  return (
    <Canvas
      dpr={props.mobile ? [1, 1.15] : [1, 1.5]}
      camera={{ position: [0.2, 1.65, 7.4], fov: props.mobile ? 48 : 42, near: 0.1, far: 60 }}
      frameloop={props.visible ? "always" : "never"}
      gl={{ antialias: !props.mobile, powerPreference: "high-performance", alpha: false }}
      shadows={!props.mobile}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        scene.background = new THREE.Color(THEME.background);
      }}
    >
      <WorldScene {...props} />
    </Canvas>
  );
}
