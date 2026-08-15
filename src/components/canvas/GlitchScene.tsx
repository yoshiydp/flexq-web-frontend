"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders";

// uniforms は同一参照のまま値だけを毎フレーム更新する（r3f の定石）。
// このシーンはヒーローの単一インスタンス前提のためモジュールスコープに置く。
const uniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2() },
};

export default function GlitchScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
