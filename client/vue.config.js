const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    host: '0.0.0.0', // Docker環境でのバインディング用
    allowedHosts: 'all',
    webSocketServer: false, // WebSocketサーバーを無効化してエラーを回避
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws' // WebSocketのURLを自動設定
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