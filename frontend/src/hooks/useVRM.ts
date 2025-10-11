"use client";

import { type VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function useVRM(url: string | null) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    let currentVrm: VRM | null = null;

    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;

        // VRMUtils.rotateVRM0 is used to rotate VRM0.0 models
        VRMUtils.rotateVRM0(vrm);

        // Disable frustum culling to prevent disappearing
        vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });

        currentVrm = vrm;
        setVrm(vrm);
        setLoading(false);
      },
      (progress) => {
        console.log(
          "Loading VRM:",
          100.0 * (progress.loaded / progress.total),
          "%"
        );
      },
      (error) => {
        console.error("Error loading VRM:", error);
        setError(error as Error);
        setLoading(false);
      }
    );

    return () => {
      // Cleanup VRM on unmount
      if (currentVrm) {
        currentVrm.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((mat) => {
                mat.dispose();
              });
            } else {
              obj.material.dispose();
            }
          }
        });
      }
    };
  }, [url]);

  return { vrm, loading, error };
}
