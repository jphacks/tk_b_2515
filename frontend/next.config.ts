import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh7.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh8.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh9.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
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
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
