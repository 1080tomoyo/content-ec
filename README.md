# 🚀 Content EC - コンテンツマーケットプレイス

> プログラミング学習者向けのコンテンツマーケットプレイスです。既存のGitHubリポジトリをCMSとして活用し、Stripe決済とSupabaseを組み合わせた、モダンなWebアプリケーションです。

## ✨ 概要

### 🎯 解決する課題
- **既存コンテンツの活用**: 散らばった学習コンテンツを一箇所に集約し、新しい価値を創造
- **品質のばらつき**: 厳選された高品質なコンテンツのみを提供
- **学習コストの高さ**: 無料から有料まで幅広い価格帯で対応
- **学習体験の向上**: 直感的で美しいUI/UXで学習を促進

### 🎨 主な機能

#### 📚 コンテンツ管理システム
- **既存リポジトリ活用**: 既存GitHubリポジトリをCMSとして再利用
- **Markdown + YAML解析**: 既存のMarkdownとYAMLファイルを解析・変換
- **動的コンテンツ生成**: ビルド時に既存コンテンツを自動的にWebアプリケーション用に変換
- **画像最適化**: Next.js Imageコンポーネントによる自動最適化

#### 🔐 認証・決済システム
- **GitHub OAuth**: 開発者に馴染みのあるGitHubアカウントでログイン
- **Stripe決済**: 安全で信頼性の高い決済処理
- **購入履歴管理**: Supabaseによる購入記録の永続化
- **アクセス制御**: 購入済みコンテンツへの適切なアクセス管理

#### 🎨 ユーザーエクスペリエンス
- **レスポンシブデザイン**: モバイルファーストのUI
- **高速読み込み**: Turbopackによる開発体験の向上

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15.5.3** - 最新のApp Routerを活用し、高速なSSG/ISRを実現
- **React 19.1.0** - 最新のReact機能を活用
- **TypeScript 5** - 型安全によりバグを減らし、メンテナンス性を向上
- **Tailwind CSS 4** - モダンなスタイリング
- **Radix UI** - アクセシブルなUIコンポーネント

### バックエンド・インフラ
- **NextAuth.js 5** - 認証システム
- **Stripe** - 決済処理
- **Supabase** - Firebase互換のPostgreSQLベースでスケーラブルなバックエンドを構築
- **GitHub API** - コンテンツ管理

### 開発ツール
- **Turbopack** - 超高速バンドラーで開発体験を最大化
- **ESLint** - コード品質管理
- **PostCSS** - CSS処理

## 🚀 環境構築・インストール手順

### 前提条件
- Node.js 18.0.0以上
- npm または yarn
- GitHubアカウント
- Stripeアカウント
- Supabaseアカウント

### 1. リポジトリのクローン
```bash
git clone https://github.com/1080tomoyo/content-ec.git
cd content-ec
```

### 2. 依存関係のインストール
```bash
npm install
# または
yarn install
```

### 3. 環境変数の設定
`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# NextAuth.js
AUTH_SECRET=your-auth-secret-key

# GitHub OAuth
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. データベースのセットアップ
Supabaseで以下のテーブルを作成してください：

```sql
-- 購入記録テーブル
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  content_id TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_purchases_user_content ON purchases(user_identifier, content_id);
CREATE INDEX idx_purchases_payment_intent ON purchases(payment_intent_id);
```

### 5. 開発サーバーの起動
```bash
npm run dev
# または
yarn dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認してください。

## 🏗️ 設計の意図と工夫したポイント

### 1. 型安全性の徹底
```typescript
// 環境変数の型安全な管理
interface RequiredEnvVars {
  AUTH_SECRET: string;
  GITHUB_ID: string;
  // ... 他の必須環境変数
}

// コンテンツの型定義
interface Article {
  id: string;
  title: string;
  content: string;
  price: number;
  isPaid: boolean;
}
```

### 2. セキュリティの考慮
- **JWT認証**: NextAuth.jsによる安全なセッション管理
- **Webhook署名検証**: Stripeからのリクエストの正当性確認
- **環境変数の検証**: 起動時に必須環境変数の存在確認
- **Row Level Security**: Supabaseでのデータアクセス制御

### 3. パフォーマンスの最適化
- **Static Generation**: ビルド時のコンテンツ生成
- **Image Optimization**: Next.js Imageコンポーネントの活用
- **Turbopack**: 開発時の高速バンドリング
- **キャッシュ戦略**: GitHub APIの適切なキャッシュ設定

### 4. ユーザビリティの向上
- **レスポンシブデザイン**: あらゆるデバイスでの最適な表示
- **アクセシビリティ**: Radix UIによる標準準拠
- **エラーハンドリング**: 適切なエラーメッセージとフォールバック
- **ローディング状態**: ユーザー体験を損なわない適切なフィードバック

## 🔮 今後の展望と改善予定

### 短期目標（1-3ヶ月）
- [ ] **コンテンツ検索機能**: 全文検索とフィルタリング
- [ ] **ユーザーダッシュボード**: 購入履歴とお気に入り機能
- [ ] **レビュー・評価システム**: コンテンツの品質向上
- [ ] **メール通知**: 新着コンテンツの通知機能

### 中期目標（3-6ヶ月）
- [ ] **サブスクリプション機能**: 月額制のコンテンツアクセス
- [ ] **オフライン対応**: PWA化によるオフライン閲覧
- [ ] **多言語対応**: 国際化（i18n）の実装
- [ ] **分析ダッシュボード**: コンテンツのパフォーマンス分析

### 長期目標（6ヶ月以上）
- [ ] **AI機能**: パーソナライズされたコンテンツ推薦
- [ ] **コミュニティ機能**: ユーザー間の交流機能
- [ ] **モバイルアプリ**: React Nativeによるネイティブアプリ
- [ ] **API公開**: サードパーティとの連携機能