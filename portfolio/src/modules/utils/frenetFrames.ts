import * as THREE from "three";

export type FrenetFrames = {
  tangents: THREE.Vector3[];
  normals: THREE.Vector3[];
  binormals: THREE.Vector3[];
};

type FrameAt = {
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
};

export const getFrameAt = (frames: FrenetFrames, t: number): FrameAt => {
  const count = frames.tangents.length;
  const clampedT = Math.min(1, Math.max(0, t));
  const index = Math.max(0, Math.min(count - 1, Math.floor(clampedT * count)));

  return {
    tangent: frames.tangents[index].clone(),
    normal: frames.normals[index].clone(),
    binormal: frames.binormals[index].clone(),
  };
};
