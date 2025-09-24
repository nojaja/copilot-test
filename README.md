# 🤖 Copilot Test App

シンプルなNode.js + Express.jsアプリケーション

## 概要

このアプリケーションは、GitHub Copilotを使用して作成されたシンプルなWebアプリケーションです。以下の機能が含まれています：

- Node.js + Express.jsサーバー
- 静的ファイルの配信
- REST APIエンドポイント
- JSONデータの送受信
- レスポンシブなWebインターフェース

## 機能

### API エンドポイント

- `GET /api/hello` - Hello メッセージとタイムスタンプを返します
- `POST /api/echo` - 送信されたメッセージをエコーバックします

### Webインターフェース

- Hello API テスト機能
- Echo メッセージテスト機能
- 日本語対応
- モダンなUI デザイン

## インストールと実行

1. 依存関係をインストール：
```bash
npm install
```

2. サーバーを起動：
```bash
npm start
```

3. ブラウザで `http://localhost:3000` にアクセス

## 開発

- `npm run dev` - 開発モードでサーバーを起動
- `npm test` - テスト実行（現在はテストなし）

## ライセンス

MIT License - [LICENSE](LICENSE) ファイルを参照してください。