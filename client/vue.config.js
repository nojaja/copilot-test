const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    host: '0.0.0.0', // Docker環境でのバインディング用
    allowedHosts: 'all',
    // webSocketServer: false,  // ← 無効化していたがHMR用途で必要なため削除
    client: {
      // ブラウザへ配信するHMR用WebSocket URLを固定
      // auto だとコンテナ内部IP (172.x.x.x) を使い失敗するケースがあるため localhost に強制
      webSocketURL: {
        hostname: 'localhost',
        pathname: '/ws',
        port: 8080,
        protocol: 'ws'
      },
      overlay: {
        errors: true,
        warnings: false
      }
    },
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL || 'http://app:3000',
        changeOrigin: true
      }
    }
  },
  publicPath: process.env.NODE_ENV === 'production' ? '/dist/' : '/'
})