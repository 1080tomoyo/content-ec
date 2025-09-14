/**
 * 環境変数のバリデーションと型安全なアクセスを提供
 */

interface RequiredEnvVars {
  // NextAuth.js
  AUTH_SECRET: string;
  
  // GitHub OAuth
  GITHUB_ID: string;
  GITHUB_SECRET: string;
  
  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // App
  NEXT_PUBLIC_BASE_URL: string;
}

interface OptionalEnvVars {
  NODE_ENV: string;
}

type EnvVars = RequiredEnvVars & Partial<OptionalEnvVars>;

/**
 * 環境変数を検証し、型安全にアクセスできるオブジェクトを返す
 */
function validateEnvVars(): EnvVars {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'AUTH_SECRET',
    'GITHUB_ID', 
    'GITHUB_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `以下の必須環境変数が設定されていません: ${missingVars.join(', ')}`;
    console.error('❌ 環境変数エラー:', errorMessage);
    throw new Error(errorMessage);
  }

  console.log('✅ 環境変数の検証が完了しました');

  return {
    AUTH_SECRET: process.env.AUTH_SECRET!,
    GITHUB_ID: process.env.GITHUB_ID!,
    GITHUB_SECRET: process.env.GITHUB_SECRET!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL!,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

// 環境変数を検証してエクスポート
export const env = validateEnvVars();

// 個別の環境変数もエクスポート（後方互換性のため）
export const {
  AUTH_SECRET,
  GITHUB_ID,
  GITHUB_SECRET,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_BASE_URL,
  NODE_ENV,
} = env;
