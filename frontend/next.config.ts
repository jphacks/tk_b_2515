import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	webpack: (config) => {
		// MediaPipeのWASMファイル対応
		config.resolve.alias = {
			...config.resolve.alias,
		};

		// .wasm ファイルの処理
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		};

		return config;
	},
	// 外部パッケージの最適化を無効化（three.js, MediaPipe対応）
	transpilePackages: ["three", "@mediapipe/tasks-vision"],
};

export default nextConfig;
