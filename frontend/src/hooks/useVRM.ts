"use client";

import { type VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useEffect, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Simple in-memory cache to reuse loaded VRMs across components
const vrmCache = new Map<string, VRM>();
const vrmPromiseCache = new Map<string, Promise<VRM>>();

async function loadVRM(url: string): Promise<VRM> {
	// Reuse ongoing load if present
	const existing = vrmPromiseCache.get(url);
	if (existing) return existing;

	const p = new Promise<VRM>((resolve, reject) => {
		const loader = new GLTFLoader();
		loader.register((parser) => new VRMLoaderPlugin(parser));
		loader.load(
			url,
			(gltf) => {
				const vrm = gltf.userData.vrm as VRM;
				if (!vrm) {
					reject(new Error("VRMデータが見つかりません"));
					return;
				}
				// Standard setup
				VRMUtils.rotateVRM0(vrm);
				vrm.scene.traverse((obj) => {
					obj.frustumCulled = false;
				});
				vrmCache.set(url, vrm);
				resolve(vrm);
			},
			undefined,
			(err) => reject(err),
		);
	}).finally(() => {
		// Keep the promise for dedupe until it resolves; remove afterwards to allow reload if needed
		vrmPromiseCache.delete(url);
	});

	vrmPromiseCache.set(url, p);
	return p;
}

export function preloadVRM(url: string): Promise<VRM> {
	const cached = vrmCache.get(url);
	if (cached) return Promise.resolve(cached);
	const cachedPromise = vrmPromiseCache.get(url);
	if (cachedPromise) return cachedPromise;
	return loadVRM(url);
}

export function useVRM(url: string | null) {
	const [vrm, setVrm] = useState<VRM | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!url) return;

		setError(null);
		const cached = vrmCache.get(url);
		if (cached) {
			setVrm(cached);
			setLoading(false);
			return;
		}

		setLoading(true);
		preloadVRM(url)
			.then((v) => {
				setVrm(v);
				setLoading(false);
			})
			.catch((e) => {
				console.error("Error loading VRM:", e);
				const errorMessage =
					e instanceof Error ? e.message : "VRMファイルの読み込みに失敗しました";
				setError(new Error(`${errorMessage}\nURL: ${url}`));
				setLoading(false);
			});

		// We keep VRM cached for session; do not dispose on unmount
		return () => {};
	}, [url]);

	return { vrm, loading, error };
}
