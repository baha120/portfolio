// PathCamera.tsx
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

type PathCameraProps = {
  curve: THREE.Curve<THREE.Vector3>;
  progressRef: React.MutableRefObject<number>;
};

export function PathCamera({ curve, progressRef }: PathCameraProps) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    if (!camRef.current) return;
    const camera = camRef.current;

    const t = THREE.MathUtils.clamp(progressRef.current, 0, 1);

    // Punkt auf der Kurve
    const pos = curve.getPointAt(t);
    // Richtung der Kurve an dieser Stelle
    const dir = curve.getTangentAt(t).normalize();

    // ---- Kamera-Position berechnen ----
    const height = 3; // wie hoch über dem Pfad
    const backOffset = 4; // wie weit hinter dem Punkt
    const sideOffset = 0; // falls du leicht seitlich versetzt sein willst
    // Basis: genau auf der Kurve
    const base = pos.clone();

    // Ein Stück "hinter" dem Punkt (gegen die Tangenten-Richtung)
    const behind = base.clone().add(dir.clone().multiplyScalar(-backOffset));

    if (sideOffset !== 0) {
      // einfache seitliche Richtung = Tangente × Up-Vektor
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(dir, up).normalize();
      behind.add(side.multiplyScalar(sideOffset));
    }
    // Höhe hinzufügen
    behind.y += height;

    // Smooth-Bewegung
    camera.position.lerp(behind, 0.02);

    // ---- Blickrichtung ----
    const lookAhead = base.clone().add(dir.clone().multiplyScalar(3));

    camera.lookAt(lookAhead);
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={50}
      // Startposition, bevor Scroll wirkt
      position={[0, 3, 10]}
    />
  );
}
