import { NextRequest, NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { auth } from "../../../../auth";
import { checkUserPurchase } from "@/lib/supabase/utils";
import { CURRENT_VERSION, METADATA_KEYS, stripe } from "@/lib/stripe";
import { NEXT_PUBLIC_BASE_URL } from "@/lib/env";

/**
 * Stripe決済セッション作成API
 * 
 * このモジュールは、ユーザーがコンテンツを購入する際に
 * Stripeの決済セッションを作成するAPIエンドポイントです。
 * 
 * 主要機能：
 * - ユーザー認証の確認
 * - 重複購入の防止
 * - Stripe決済セッションの作成
 * - 適切なリダイレクトURLの設定
 * 
 * 処理の流れ：
 * 1. ユーザーの認証状態を確認
 * 2. リクエストデータの検証
 * 3. 既存の購入記録をチェック
 * 4. Stripe決済セッションを作成
 * 5. チェックアウトURLを返す
 * 
 * セキュリティ考慮事項：
 * - 認証済みユーザーのみアクセス可能
 * - 重複購入の防止
 * - 適切なエラーハンドリング
 * - メタデータによる追跡可能性
 * 
 * 使用場面：
 * - 購入ボタンクリック時
 * - 有料コンテンツへのアクセス時
 */
 
// ============================================================================
// 内部関数
// ============================================================================

/**
 * コンテンツ購入用のStripe決済セッションを作成する
 * 
 * @param userIdentifier - ユーザー識別子（GitHub ID）
 * @param contentId - 購入するコンテンツのID
 * @param title - コンテンツのタイトル
 * @param price - 価格（円）
 * @param contentType - コンテンツの種類（"book" または "article"）
 * @returns Promise<Stripe.Checkout.Session> - 作成された決済セッション
 * 
 * この関数は、Stripeの決済セッションを作成し、適切な設定を行います。
 * 決済完了後のリダイレクト先やWebhookで使用するメタデータも設定します。
 * 
 * 処理の流れ：
 * 1. 環境変数の確認
 * 2. 成功時のリダイレクトURLを決定
 * 3. 決済セッションのパラメータを設定
 * 4. Stripeにセッション作成を依頼
 * 
 * セキュリティ考慮事項：
 * - メタデータによる購入情報の追跡
 * - 適切なリダイレクトURLの設定
 * - 決済方法の制限（カードのみ）
 */
async function createCheckoutSession(
  userIdentifier: string,
  contentId: string,
  title: string,
  price: number,
  contentType: "book" | "article"
): Promise<Stripe.Checkout.Session> {
  // 環境変数の確認
  // ベースURLが設定されていない場合はエラーを投げる
  const APP_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  if (!APP_BASE_URL) {
    throw new Error("BASE_URL が設定されていません");
  }

  // 決済成功時のリダイレクトURLを決定
  // コンテンツの種類に応じて適切なページにリダイレクト
  const successUrl =
    contentType === "book"
      ? // 本の場合は本の詳細ページにリダイレクト
        // success=trueパラメータで決済完了を通知
        `${APP_BASE_URL}/books/${contentId}?success=true`
      : // 記事の場合は記事詳細ページにリダイレクト
        // success=trueパラメータで決済完了を通知
        `${APP_BASE_URL}/posts/${contentId}?success=true`;

  // Stripe決済セッションのパラメータを設定
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    // 決済方法をカードのみに制限
    // これにより、セキュリティを向上させ、処理を簡素化
    payment_method_types: ["card"],
    
    // 購入する商品の情報を設定
    line_items: [
      {
        // 動的な価格データを作成
        // 固定の価格IDではなく、都度価格を設定
        price_data: {
          currency: "jpy", // 日本円で決済
          product_data: {
            name: title, // 商品名（コンテンツのタイトル）
            description: `コンテンツID: ${contentId}`, // 商品説明
          },
          unit_amount: price, // 単価（円）
        },
        quantity: 1, // 数量は常に1
      },
    ],
    
    // 決済モードを「payment」に設定
    // 一回限りの決済（サブスクリプションではない）
    mode: "payment",
    
    // Webhookで使用するためのメタデータを設定
    // これにより、決済完了時に適切な処理が可能
    metadata: {
      [METADATA_KEYS.USER_IDENTIFIER]: userIdentifier, // ユーザー識別子
      [METADATA_KEYS.CONTENT_ID]: contentId, // コンテンツID
      [METADATA_KEYS.PRICE]: price.toString(), // 価格（文字列）
      [METADATA_KEYS.VERSION]: CURRENT_VERSION, // バージョン情報
    },
    
    // 決済成功時のリダイレクト先
    success_url: successUrl,
    
    // 決済キャンセル時のリダイレクト先
    // ホームページに戻る
    cancel_url: APP_BASE_URL,
  };

  // Stripeに決済セッションの作成を依頼
  return stripe.checkout.sessions.create(sessionParams);
}
 
// ============================================================================
// 型定義
// ============================================================================

/**
 * リクエストデータの型定義
 * 
 * @interface RequestData
 * @property contentId - 購入するコンテンツのID
 * @property price - 価格（円）
 * @property title - コンテンツのタイトル
 * @property contentType - コンテンツの種類（"book" または "article"）
 */
type RequestData = {
  contentId: string;
  price: number;
  title: string;
  contentType: "book" | "article";
};

// ============================================================================
// APIエンドポイント
// ============================================================================

/**
 * Stripe決済セッション作成APIエンドポイント
 * 
 * @param req - Next.jsのリクエストオブジェクト
 * @returns Promise<NextResponse> - 決済セッション情報またはエラーレスポンス
 * 
 * この関数は、POSTリクエストを受け取り、Stripeの決済セッションを作成します。
 * 認証済みユーザーのみがアクセスでき、重複購入を防止します。
 * 
 * 処理の流れ：
 * 1. ユーザーの認証状態を確認
 * 2. リクエストデータの検証
 * 3. 既存の購入記録をチェック
 * 4. Stripe決済セッションを作成
 * 5. チェックアウトURLを返す
 * 
 * エラーハンドリング：
 * - 401: 認証が必要
 * - 400: 必要な情報が不足
 * - 500: 内部エラー
 */
export async function POST(req: NextRequest) {
  try {
    // ============================================================================
    // 認証確認
    // ============================================================================
    
    // NextAuth.jsからセッション情報を取得
    // これにより、ログイン済みユーザーのみがアクセス可能
    const session = await auth();

    // セッションが存在しない、またはユーザー情報が存在しない場合
    if (!session || !session.user) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    // ============================================================================
    // リクエストデータの取得と検証
    // ============================================================================
    
    // リクエストボディからJSONデータを取得
    const { contentId, price, title, contentType }: RequestData =
      await req.json();

    // 必要な情報がすべて存在するかを確認
    // いずれかが不足している場合はエラーを返す
    if (!contentId || !price || !title || !contentType) {
      return new NextResponse("必要な情報が不足しています", { status: 400 });
    }

    // ============================================================================
    // ユーザー識別子の取得
    // ============================================================================
    
    // セッションからユーザー識別子を取得
    // これはGitHubの一意のID（数値）を文字列に変換したもの
    const userIdentifier = session.user.id;

    // ユーザー識別子が取得できない場合のエラーハンドリング
    if (!userIdentifier) {
      return new NextResponse("ユーザー識別子が取得できません", {
        status: 400,
      });
    }

    // ============================================================================
    // 重複購入の防止
    // ============================================================================
    
    // データベースで既存の購入記録をチェック
    // これにより、同じユーザーが同じコンテンツを重複購入することを防止
    const existingPurchase = await checkUserPurchase(userIdentifier, contentId);
    
    // 既存の購入記録が存在する場合の処理
    if (existingPurchase) {
      console.log(
        `既に購入済み: ユーザー=${userIdentifier}, コンテンツ=${contentId}`
      );
      
      // 購入済みの場合は、該当コンテンツのページにリダイレクト
      // これにより、ユーザーは既に購入済みのコンテンツにアクセスできる
      return NextResponse.json({
        url:
          contentType === "book"
            ? `${NEXT_PUBLIC_BASE_URL}/books/${contentId}`
            : `${NEXT_PUBLIC_BASE_URL}/posts/${contentId}`,
      });
    }

    // ============================================================================
    // Stripe決済セッションの作成
    // ============================================================================
    
    // 新しい決済セッションを作成
    // これにより、ユーザーはStripeの決済ページにリダイレクトされる
    const stripeSession = await createCheckoutSession(
      userIdentifier!,
      contentId,
      title,
      price,
      contentType
    );

    // ============================================================================
    // レスポンスの返却
    // ============================================================================
    
    // クライアント側でリダイレクトするための情報を返す
    // sessionId: セッションの識別子（デバッグ用）
    // url: Stripeの決済ページのURL
    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
    
  } catch (error) {
    // ============================================================================
    // エラーハンドリング
    // ============================================================================
    
    // エラーの詳細をログに記録
    // これにより、問題の特定とデバッグが容易になる
    console.error("Checkout session error:", error);
    
    // クライアントには汎用的なエラーメッセージを返す
    // 詳細なエラー情報は漏洩を防ぐため、ログのみに記録
    return new NextResponse("内部エラーが発生しました", { status: 500 });
  }
}