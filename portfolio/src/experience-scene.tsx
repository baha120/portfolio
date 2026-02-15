import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import fragmentShader from "@/modules/shaders/particles/fragment.glsl";
import vertexShader from "@/modules/shaders/particles/vertex.glsl";
import { experienceSections } from "./data/experience";
import { PathCamera } from "@/modules/components/PathCamera";
import gsap from "gsap";
import WobbleSphere from "@/modules/components/WobbleSphere";
import {
  InstancedRigidBodies,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";

type ExperienceSceneProps = {
  onProgress?: (progress: number, activeSectionId: string) => void;
  targetProgress?: number;
  count?: number;
  seed?: number;
  types?: Array<ComponentType<any>>;
};

export default function ExperienceScene({
  onProgress,
  targetProgress = 0,
}: ExperienceSceneProps) {
  const { scene } = useThree();
  const progressRef = useRef(targetProgress);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 1.4, 12),
          new THREE.Vector3(1, 1.8, 6),
          new THREE.Vector3(-1, 1.2, 2),
          new THREE.Vector3(3, 1.5, -2),
          new THREE.Vector3(2, 1.8, -6),
        ],
        false,
        "catmullrom",
        0.5,
      ),
    [],
  );

  const frames = useMemo(() => curve.computeFrenetFrames(400, false), [curve]);

  const targetBackground = useRef(
    new THREE.Color(experienceSections[0]?.env.background || "#0f1015"),
  );
  const targetFog = useRef(
    new THREE.Color(experienceSections[0]?.env.fogColor || "#04050a"),
  );

  const lastProgress = useRef(0);
  const lastSection = useRef(experienceSections[0]?.id ?? "");
  const [itemsDropped, setItemsDropped] = useState(false);

  useFrame(() => {
    const clampedTarget = THREE.MathUtils.clamp(targetProgress, 0, 1);
    const t = THREE.MathUtils.lerp(progressRef.current, clampedTarget, 0.08);
    progressRef.current = t;

    const activeSection =
      experienceSections.find(
        (section) => t >= section.tStart && t <= section.tEnd,
      ) ?? experienceSections[experienceSections.length - 1];

    if (activeSection.id !== lastSection.current) {
      lastSection.current = activeSection.id;
      if (activeSection.id === "interests") {
        setTimeout(() => {
          setItemsDropped(true);
        }, 1900);
      }
    }
    // Notify parent sparingly
    if (
      onProgress &&
      (Math.abs(t - lastProgress.current) > 0.002 ||
        activeSection.id !== lastSection.current)
    ) {
      lastProgress.current = t;
      lastSection.current = activeSection.id;
      onProgress(t, activeSection.id);
    }

    // Environment blending
    targetBackground.current.lerp(
      new THREE.Color(activeSection.env.background),
      0.05,
    );
    targetFog.current.lerp(new THREE.Color(activeSection.env.fogColor), 0.05);

    if (scene.background) {
      (scene.background as THREE.Color).copy(targetBackground.current);
    } else {
      scene.background = targetBackground.current.clone();
    }

    if (!scene.fog) {
      scene.fog = new THREE.Fog(targetFog.current, 10, 40);
    } else {
      scene.fog.color.copy(targetFog.current);
    }

    if (dirLightRef.current) {
      dirLightRef.current.intensity = THREE.MathUtils.lerp(
        dirLightRef.current.intensity,
        activeSection.env.lightIntensity,
        0.05,
      );
      dirLightRef.current.color.lerp(
        new THREE.Color(activeSection.env.accent),
        0.05,
      );
    }
  });
  const tubeRef = useRef<THREE.TubeGeometry>(null);
  const uniforms = useMemo(() => ({ uProgress: { value: 0 } }), []);

  const scatterParticles = useCallback(() => {
    gsap.to(uniforms.uProgress, {
      value: 1,
      duration: 3,
      delay: 1,
      ease: "power2.out",
    });
  }, [uniforms]);

  useEffect(() => {
    if (!tubeRef.current) return;

    const count = tubeRef.current.attributes.position.count;
    const randoms = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      randoms[i * 3] = (Math.random() - 0.5) * 20;
      randoms[i * 3 + 1] = (Math.random() - 0.5) * 20;
      randoms[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    tubeRef.current.setAttribute(
      "aRandomPosition",
      new THREE.BufferAttribute(randoms, 3),
    );

    scatterParticles();
  }, [scatterParticles]);
  const book = useGLTF("./models/green_book.glb");
  const latteArt = useGLTF("./models/caffe_latte_cup.glb");
  const writingUtensils = useGLTF("./models/writing_utensils.glb");
  const yamaha = useGLTF("./models/yamaha_r1m.glb");
  const signpost = useGLTF("./models/signpost.glb");
  const yamahaRef = useRef<RapierRigidBody>(null);
  const yamahaJump = () => {
    if (!yamahaRef.current) return;
    yamahaRef.current.applyTorqueImpulse(
      {
        x: Math.random() - 0.5,
        y: Math.random() - 0.5,
        z: Math.random() - 0.5,
      },
      true,
    );
  };

  const booksCount = 5;
  const booksRef = useRef<THREE.InstancedMesh>(null);

  const bookColors = useMemo(
    () => ["#e74c3c", "#2ecc71", "#3498db", "#f39c12", "#9b59b6"],
    [],
  );
  console.log("booksRef.current>>>", booksRef.current);

  useEffect(() => {
    if (!booksRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < booksCount; i++) {
      color.set(bookColors[i % bookColors.length]);
      booksRef.current.setColorAt(i, color);
    }
    booksRef.current.instanceColor!.needsUpdate = true;
  }, [itemsDropped, bookColors]);

  const { bookGeometry, bookMaterial } = useMemo(() => {
    let geo: THREE.BufferGeometry | undefined;
    let mat: THREE.Material | undefined;
    book.scene.traverse((child) => {
      if (!geo && (child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        geo = mesh.geometry;
        mat = mesh.material as THREE.Material;
      }
    });
    return { bookGeometry: geo, bookMaterial: mat };
  }, [book.scene]);

  const instances = useMemo(() => {
    const items = [];
    // Platform is at x=1, z=-10, size 10x10
    const px = 1;
    const pz = -10;
    const spread = 4; // stay within platform bounds

    for (let i = 0; i < booksCount; i++) {
      items.push({
        key: "instance_" + i,
        position: [
          px + (Math.random() - 0.5) * spread,
          6 + i * 0.4,
          pz + (Math.random() - 0.5) * spread,
        ] as [number, number, number],
        rotation: [Math.random(), Math.random(), Math.random()] as [
          number,
          number,
          number,
        ],
      });
    }

    return items;
  }, []);
  return (
    <>
      <PathCamera curve={curve} progressRef={progressRef} />
      <Environment preset="city" />
      <ambientLight intensity={3} />
      <directionalLight
        ref={dirLightRef}
        position={[5, 10, 5]}
        intensity={1}
        castShadow
      />

      <points receiveShadow castShadow>
        <tubeGeometry ref={tubeRef} args={[curve, 520, 0.08, 16, false]} />
        <shaderMaterial
          fragmentShader={fragmentShader}
          vertexShader={vertexShader}
          uniforms={uniforms}
        />
      </points>

      {experienceSections.map((section, index) => (
        <WobbleSphere
          index={index}
          key={section.id}
          t={(section.tStart + section.tEnd) / 2}
          curve={curve}
          frames={frames}
          accent={section.env.accent}
        />
      ))}
      <RigidBody type="fixed" friction={1}>
        <mesh
          receiveShadow
          rotation-y={-9}
          position-y={0.75}
          position-z={-10}
          position-x={0.7}
        >
          <boxGeometry args={[6, 0.1, 6]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={1}>
        <mesh
          receiveShadow
          rotation-y={-9}
          position-y={0.75}
          position-z={-10}
          position-x={0.7}
        >
          <torusGeometry args={[6, 0.1, 6]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </RigidBody>

      {itemsDropped && (
        <>
          <InstancedRigidBodies linearDamping={2} instances={instances}>
            <instancedMesh
              ref={booksRef}
              frustumCulled={false}
              castShadow
              receiveShadow
              args={[bookGeometry, bookMaterial, booksCount]}
            />
          </InstancedRigidBodies>
          <RigidBody restitution={0} friction={1} lockRotations>
            <mesh position={[0.7, 3.5, -10.5]} scale={8}>
              <primitive object={signpost.scene} scale={0.1} />
            </mesh>
          </RigidBody>
          <RigidBody linearDamping={1.5}>
            <mesh position={[-1, 12, -9]} scale={8}>
              <primitive object={writingUtensils.scene} scale={1} />
            </mesh>
          </RigidBody>
          <RigidBody linearDamping={1.5}>
            <mesh position={[3, 16, -11]} scale={0.5}>
              <primitive object={latteArt.scene} scale={0.25} />
            </mesh>
          </RigidBody>
          <RigidBody
            linearDamping={1.5}
            angularDamping={1}
            restitution={0}
            friction={1}
          >
            <mesh
              onClick={yamahaJump}
              ref={yamahaRef}
              position={[1, 20, -10]}
              scale={3.5}
            >
              <primitive object={yamaha.scene} scale={0.25} />
            </mesh>
          </RigidBody>
        </>
      )}
    </>
  );
}
