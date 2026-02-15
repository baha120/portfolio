import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";

type OverlayScreenProps = {
  progress?: number;
};

export const OverlayScreen = ({ progress }: OverlayScreenProps) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const overlayMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const uniforms = useMemo(() => ({ uAlpha: { value: 1 } }), []);
  const [materialReady, setMaterialReady] = useState(false);
  const hasFaded = useRef(false);
  const { active, progress: loadProgress, total } = useProgress();

  const triggerFade = useCallback(() => {
    const material = overlayMaterialRef.current;
    if (!material || hasFaded.current) return;
    hasFaded.current = true;
    gsap.to(uniforms.uAlpha, {
      duration: 3,
      value: 0,
      delay: 1,
      onComplete: () => {
        if (meshRef.current) meshRef.current.visible = false;
      },
    });
  }, [uniforms]);

  const handleMaterialRef = useCallback((node: THREE.ShaderMaterial | null) => {
    overlayMaterialRef.current = node;
    setMaterialReady(!!node);
  }, []);

  useEffect(() => {
    const material = overlayMaterialRef.current;
    if (!material || hasFaded.current) return;
    const progressValue = progress ?? loadProgress;
    const isLoaded = !active && (progressValue >= 100 || total === 0);
    const fadeDelayId = window.setTimeout(() => {
      if (isLoaded) triggerFade();
    }, 500);

    const fallbackId = window.setTimeout(() => {
      triggerFade();
    }, 4000);

    return () => {
      window.clearTimeout(fadeDelayId);
      window.clearTimeout(fallbackId);
    };
  }, [active, loadProgress, materialReady, progress, total, triggerFade]);

  return (
    <mesh ref={meshRef} renderOrder={999} frustumCulled={false}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        ref={handleMaterialRef}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        vertexShader={`void main()
{
    gl_Position = vec4(position, 1.0);
}`}
        fragmentShader={`
uniform float uAlpha;
void main()
{
    gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
}
`}
      />
    </mesh>
  );
};
