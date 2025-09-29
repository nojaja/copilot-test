const { Sequelize } = require('sequelize');

// 明示的なデフォルト: ローカル PostgreSQL (ユーザ: postgres / パスワード: postgres)
// DATABASE_URL が未設定の場合、auth 情報が抜けていると pg ドライバで password 型エラーが出るため
// 完全な接続文字列を fallback として指定する
const defaultUrl = 'postgresql://root:postgres@localhost:5432/process_flow_db';
const databaseUrl = process.env.DATABASE_URL || defaultUrl;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

module.exports = { sequelize };