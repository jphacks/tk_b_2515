#!/bin/bash

# VRMサンプルモデルのダウンロードスクリプト
# 使用方法: bash download-sample.sh

echo "VRMサンプルモデルをダウンロードしています..."

# VRM Consortium公式のサンプルモデル（Alicia）をダウンロード
SAMPLE_URL="https://github.com/vrm-c/vrm-specification/raw/master/samples/Alicia/Alicia.vrm"
TARGET_FILE="avatar.vrm"

# curlまたはwgetを使用してダウンロード
if command -v curl &> /dev/null; then
    echo "curlを使用してダウンロード中..."
    curl -L "$SAMPLE_URL" -o "$TARGET_FILE"
elif command -v wget &> /dev/null; then
    echo "wgetを使用してダウンロード中..."
    wget "$SAMPLE_URL" -O "$TARGET_FILE"
else
    echo "エラー: curlまたはwgetがインストールされていません"
    echo ""
    echo "手動でダウンロードしてください:"
    echo "URL: $SAMPLE_URL"
    echo "保存先: $(pwd)/$TARGET_FILE"
    exit 1
fi

if [ -f "$TARGET_FILE" ]; then
    FILE_SIZE=$(du -h "$TARGET_FILE" | cut -f1)
    echo ""
    echo "✓ ダウンロード完了！"
    echo "  ファイル: $TARGET_FILE"
    echo "  サイズ: $FILE_SIZE"
    echo ""
    echo "これでアプリケーションでVRMモデルを使用できます。"
else
    echo "✗ ダウンロードに失敗しました"
    exit 1
fi
