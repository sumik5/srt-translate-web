# SRT Translate

SRTファイルを翻訳するためのWebツール。LM Studioと連携して、ローカルのLLMモデルを使用した翻訳を実現します。

## 特徴

- 🎬 複数のSRTファイルの一括翻訳
- 🤖 LM Studio経由でローカルLLMモデルを使用
- 🌍 多言語対応（日本語、英語、中国語など）
- 📥 翻訳済みファイルの一括ダウンロード
- 🎨 シンプルで使いやすいUI

## 必要要件

- Node.js 20以上
- pnpm
- LM Studio（翻訳実行時）

## セットアップ

### 1. 依存関係のインストール

```bash
# miseを使用する場合
mise run install

# または直接pnpmを使用
pnpm install
```

### 2. 開発サーバーの起動

```bash
# miseを使用
mise run dev

# または直接実行
pnpm run dev:full
```

ブラウザで `http://localhost:8000/srt-translator.html` を開きます。

### 3. LM Studioの設定

1. LM Studioを起動
2. 任意のLLMモデルをロード
3. サーバーを起動（デフォルト: http://127.0.0.1:1234）

## ビルド

### 開発ビルド

```bash
mise run build
# または
pnpm run build
```

### プロダクションビルド

```bash
NODE_ENV=production mise run build
# または
NODE_ENV=production pnpm run build
```

## 使い方

1. LM Studioでモデルを起動
2. Webアプリケーションを開く
3. API URLを確認（デフォルト: http://127.0.0.1:1234）
4. モデルを選択
5. 翻訳先言語を選択
6. SRTファイルをアップロード
7. 「翻訳する」ボタンをクリック
8. 翻訳完了後、ファイルをダウンロード

## プロジェクト構造

```
srt-translate/
├── src/
│   ├── types/          # TypeScript型定義
│   ├── api-client.ts   # LM Studio API クライアント
│   ├── srt-processor.ts # SRT解析・処理
│   ├── ui-manager.ts   # UI管理
│   └── srt-translator-app.ts # メインアプリケーション
├── srt-translator.html # HTMLファイル
├── srt-translator.css  # スタイルシート
├── esbuild.config.js   # ビルド設定
├── tsconfig.json       # TypeScript設定
├── package.json        # プロジェクト設定
└── .mise.toml         # mise設定
```

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `mise run install` | 依存関係のインストール |
| `mise run dev` | 開発サーバー起動 |
| `mise run build` | ビルド実行 |
| `mise run type-check` | 型チェック |
| `mise run lint` | ESLint実行 |
| `mise run clean` | ビルド成果物削除 |

## ライセンス

MIT