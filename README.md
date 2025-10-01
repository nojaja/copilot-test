# Process Flow Manager

A collaborative web application for distributed business knowledge collection and automatic process flow management table generation.

## Features

- **User Management & Authentication**: Login/register with role-based permissions
- **Process Flow Input**: Define states with IN/OUT conditions and descriptions
- **Reusable IN/OUT Master**: Link state outputs to downstream inputs via a shared suggestions-based IO term catalog
- **Collaborative Editing**: Multiple departments can contribute their knowledge
- **Real-time Updates**: Socket.io integration for live collaboration
- **Validation & Conflict Detection**: Automatic checking for missing data and duplicates
- **Visual Representations**: State transition diagrams and process matrices
- **Export Capabilities**: Markdown and CSV export functionality
- **Comment System**: Discussion threads on states and transitions

## Technology Stack

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL + Sequelize**: Database with proper relationships
- **JWT Authentication**: Secure user sessions
- **Socket.io**: Real-time features
- **Passport.js**: OAuth integration (Google)

### Frontend
- **Vue.js 3**: Modern reactive UI framework
- **Vue Router**: Client-side routing
- **Vuex**: State management
- **Bootstrap 5**: Responsive UI components
- **Axios**: HTTP client
- **Mermaid.js**: Diagram generation

## Project Structure

```
├── server/                 # Backend API
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   ├── middleware/        # Authentication & validation
│   ├── config/            # Database configuration
│   └── app.js             # Main server file
├── client/                # Frontend Vue app
│   ├── src/
│   │   ├── components/    # Reusable Vue components
│   │   ├── views/         # Page components
│   │   ├── store/         # Vuex store
│   │   └── router/        # Vue Router configuration
│   └── public/            # Static assets
└── package.json           # Root package file
```

## Quick Start

### Prerequisites
- Node.js (v16+ recommended)
- PostgreSQL (v12+ recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd process-flow-manager
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Database setup**
   ```bash
   ```bash
   npm run setup:db
   ```
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server on http://localhost:3000
   - Frontend development server on http://localhost:8080

### Environment Variables

Copy the example environment file and configure:

```bash
cp server/.env.example server/.env
```

Update `server/.env` with your settings:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/process_flow_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=http://localhost:8080

# NOTE: If DATABASE_URL is omitted, the app now falls back to
# postgresql://postgres:postgres@localhost:5432/process_flow_db
# (added to avoid pg password type errors). Set DATABASE_URL explicitly in production.

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Usage

### Sample Data

The setup script creates sample data for development testing:
- **Demo User**: email `demo@example.com`, password `password123`
- **Sample Project**: "Sample Process Flow" with example states and transitions
- **Reusable IO Terms**: Shared IN/OUT terms seeded so that one state's OUT feeds the next state's IN

### Getting Started

1. **Register/Login**: Create an account or sign in with the demo account
2. **Create Project**: Start a new process flow project
3. **Add States**: Define process states and attach IN/OUT terms from the shared master (or create new ones on the fly)
4. **Collaborate**: Multiple users can add their knowledge
5. **Review**: Check the process matrix and state diagram
6. **Export**: Generate Markdown or CSV documentation

## Docker Deployment

### 開発環境（クライアント・サーバー分離）

クライアント側とサーバー側が独立したコンテナとして起動します：

```bash
# 開発環境での起動（ホットリロード対応）
docker-compose -f docker-compose.dev.yml up -d

# データベース初期化・サンプルデータ作成（任意のタイミングで実行）
docker-compose -f docker-compose.dev.yml --profile setup run --rm setup-db

# サービス確認
# - Frontend: http://localhost:8081 (Vue.js開発サーバー)
# - Backend API: http://localhost:3001
# - Database: localhost:5433
```

### 本番環境

```bash
# 本番環境での起動
docker-compose up -d

# サービス確認
# - Frontend: http://localhost:8080 (Vue.js開発サーバー)
# - Backend API: http://localhost:3000
# - Database: localhost:5432
```

### Docker設定概要

#### 開発環境 (`docker-compose.dev.yml`)
- **client**: Vue.js開発サーバー（ホットリロード対応）
- **app**: Node.js APIサーバー（開発モード）
- **db**: PostgreSQLデータベース
- **setup-db**: データベース初期化・サンプルデータ作成（プロファイル: `setup`）

#### 本番環境 (`docker-compose.yml`)
- **client**: Vue.js開発サーバー（独立コンテナ）
- **app**: Node.js APIサーバー（本番モード）
- **db**: PostgreSQLデータベース

### Docker 補足事項

- クライアント側もコンテナ化され、フロントエンドとバックエンドが独立して動作します
- 開発環境ではボリュームマウントによりホットリロードが有効です
- `app` コンテナ起動時に Postgres が受け付け可能になるまでの短時間で接続拒否が発生していたため、`server/scripts/wait-for-db.js` を追加し `Dockerfile` の `CMD` を `node scripts/wait-for-db.js && npm start` に変更しています。
- これによりアプリは DB 接続が確立してから起動し安定します。
- 既存コンテナ/イメージを更新したい場合は `docker-compose up -d --build` を実行してください。

### データベース初期化について

`setup-db`コンテナを使用して、任意のタイミングでデータベースの初期化とサンプルデータの作成が可能です：

```bash
# データベース初期化・サンプルデータ作成
docker-compose -f docker-compose.dev.yml --profile setup run --rm setup-db

# 作成されるサンプルデータ:
# - デモユーザー: demo@example.com / password123
# - サンプルプロジェクト: "Sample Process Flow" と "Request-to-Answer サンプル"
# - 各プロジェクトの状態遷移定義とBPMN準拠のフロー例
```

### Docker コマンド集

```bash
# 開発環境起動
docker-compose -f docker-compose.dev.yml up -d

# ログ確認
docker-compose -f docker-compose.dev.yml logs -f [サービス名]

# 停止
docker-compose -f docker-compose.dev.yml down

# 完全リセット（ボリューム削除含む）
docker-compose -f docker-compose.dev.yml down -v

# コンテナ再ビルド
docker-compose -f docker-compose.dev.yml up -d --build
```

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Setup database with sample data
npm run setup:db

# Start development servers
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project

### States
- `GET /api/states/project/:projectId` - Get project states
- `POST /api/states` - Create new state
- `PUT /api/states/:id` - Update state
- `DELETE /api/states/:id` - Delete state

### IO Terms
- `GET /api/io-terms` - Search shared IN/OUT terms (supports `search` and `limit` query params)
- `POST /api/io-terms` - Create a new reusable IO term
- `PUT /api/io-terms/:id` - Update an existing IO term

### Export
- `GET /api/export/markdown/:projectId` - Export as Markdown
- `GET /api/export/csv/:projectId` - Export as CSV

## Development

### Running Tests
```bash
cd server && npm test
```

### Linting
```bash
cd client && npm run lint
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.