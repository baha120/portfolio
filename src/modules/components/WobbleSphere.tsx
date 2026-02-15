import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";

import fragmentShader from "@/modules/shaders/wobble/fragment.glsl";
import vertexShader from "@/modules/shaders/wobble/vertex.glsl";
import simplexNoise4d from "@/modules/shaders/includes/simplexNoise4d.glsl";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { getFrameAt, type FrenetFrames } from "@/modules/utils/frenetFrames";

const combinedVertexShader = `${simplexNoise4d}\n${vertexShader}`;
type WobbleSphereProps = {
  t: number;
  curve: THREE.CatmullRomCurve3;
  frames: FrenetFrames;
  accent: string;
  index: number;
};

export default function WobbleSphere({
  t,
  curve,
  frames,
  accent,
}: WobbleSphereProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const position = useMemo(() => curve.getPointAt(t), [curve, t]);
  const quaternion = useMemo(() => {
    const frame = getFrameAt(frames, t);
    const basis = new THREE.Matrix4().makeBasis(
      frame.normal,
      frame.binormal,
      frame.tangent
    );
    return new THREE.Quaternion().setFromRotationMatrix(basis);
  }, [frames, t]);
  const uniforms = useMemo(() => {
    const colorA = new THREE.Color(accent);
    const colorB = colorA.clone().offsetHSL(0, 0, 0.2);

    return {
      uTime: new THREE.Uniform(0),
      uPositionFrequency: new THREE.Uniform(0.5),
      uTimeFrequency: new THREE.Uniform(0.4),
      uStrength: new THREE.Uniform(0.3),
      uWarpPositionFrequency: new THREE.Uniform(0.38),
      uWarpTimeFrequency: new THREE.Uniform(0.12),
      uWarpStrength: new THREE.Uniform(1.7),

      uColorA: new THREE.Uniform(colorA),
      uColorB: new THREE.Uniform(colorB),
    };
  }, [accent]);

  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(2.5, 50);
    geo = mergeVertices(geo);

    geo.computeVertexNormals();
    if (geo.index && geo.attributes.uv && geo.attributes.normal) {
      geo.computeTangents();
    }
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh
      geometry={geometry}
      position={position}
      quaternion={quaternion}
      scale={0.2}
    >
      <CustomShaderMaterial
        ref={materialRef}
        baseMaterial={THREE.MeshStandardMaterial}
        vertexShader={combinedVertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        metalness={0.2}
        roughness={0.4}
      />
    </mesh>
  );
}
