import { NextRequest, NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { checkUserPurchase, createPurchaseRecord } from "@/lib/supabase/utils";
import { METADATA_KEYS, stripe } from "@/lib/stripe";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/env";

/**
 * Stripe Webhook処理モジュール
 * 
 * このモジュールは、StripeからのWebhookイベントを受信し、
 * 決済完了時に購入記録をデータベースに保存する役割を担います。
 * 
 * Webhookとは：
 * - Stripeが決済イベント（支払い完了、失敗など）を自動的に送信する仕組み
 * - リアルタイムで決済状況を把握し、適切な処理を実行できる
 * - セキュリティのため、署名検証により正当性を確認する
 * 
 * 処理の流れ：
 * 1. StripeからのWebhookリクエストを受信
 * 2. 署名を検証してリクエストの正当性を確認
 * 3. イベントタイプに応じて適切な処理を実行
 * 4. 決済完了時は購入記録をデータベースに保存
 */
 
// ============================================================================
// 購入記録処理関数
// ============================================================================

/**
 * 決済完了時に購入記録をデータベースに保存する
 * 
 * @param session - StripeのCheckout Sessionオブジェクト
 * @returns Promise<boolean> - 処理が成功した場合はtrue、失敗またはスキップの場合はfalse
 * 
 * この関数は、Stripeの決済が完了した際に呼び出され、
 * 購入記録をデータベースに保存します。
 * 
 * 処理の流れ：
 * 1. セッションのメタデータから購入情報を抽出
 * 2. 支払い状態を確認
 * 3. 重複購入をチェック
 * 4. 新規購入記録をデータベースに保存
 * 
 * セキュリティ考慮事項：
 * - メタデータの検証により、不正なデータを拒否
 * - 支払い状態の確認により、未完了の決済を拒否
 * - 重複チェックにより、同じ購入の重複記録を防止
 */
async function recordCompletedPurchase(session: Stripe.Checkout.Session) {
  // セッションのメタデータを取得
  // メタデータには、決済セッション作成時に設定した情報が含まれる
  const metadata = session.metadata || {};

  // メタデータから購入に必要な情報を抽出
  // これらの情報は、決済セッション作成時に設定されたもの
  const userIdentifier = metadata[METADATA_KEYS.USER_IDENTIFIER];
  const contentId = metadata[METADATA_KEYS.CONTENT_ID];
  const price = parseInt(metadata[METADATA_KEYS.PRICE] || "0", 10);

  // 必要なメタデータが存在するかを検証
  // これにより、不正なWebhookリクエストやデータ破損を検出
  if (!userIdentifier || !contentId || isNaN(price)) {
    throw new Error("必要なメタデータが不足しています");
  }

  // 支払い状態の確認
  // Stripeでは、checkout.session.completedイベントが発生しても
  // 実際の支払いが完了していない場合があるため、明示的に確認
  if (session.payment_status !== "paid") {
    console.log(
      `支払いがまだ完了していません: ${session.id}, status=${session.payment_status}`
    );
    return false;
  }

  // Payment Intent IDの取得
  // Payment Intent IDは決済の詳細情報を追跡するために使用される
  // Stripeでは、文字列またはオブジェクトの両方の形式で提供される可能性がある
  let paymentIntentId: string | null = null;
  if (typeof session.payment_intent === "string") {
    // 文字列形式の場合
    paymentIntentId = session.payment_intent;
  } else if (
    session.payment_intent &&
    typeof session.payment_intent === "object"
  ) {
    // オブジェクト形式の場合、idプロパティを取得
    paymentIntentId = session.payment_intent.id;
  }

  // 重複購入のチェック
  // 同じユーザーが同じコンテンツを既に購入していないかを確認
  // これにより、重複した購入記録の作成を防止
  const existingPurchase = await checkUserPurchase(userIdentifier, contentId);
  
  // 既存の購入記録がある場合は処理をスキップ
  // Webhookは複数回送信される可能性があるため、このチェックが重要
  if (existingPurchase) {
    console.log(
      `既に購入済み: ユーザー=${userIdentifier}, コンテンツ=${contentId}`
    );
    return true;
  }

  // 新規購入記録をデータベースに保存
  // これにより、ユーザーがコンテンツにアクセスできるようになる
  const data = await createPurchaseRecord({
    userIdentifier,
    contentId,
    paymentIntentId: paymentIntentId || "",
    amount: price,
  });

  // データが正常に保存されたかを確認して返す
  return !!data;
}
 
// ============================================================================
// Webhook API エンドポイント
// ============================================================================

/**
 * Stripe WebhookのPOSTエンドポイント
 * 
 * この関数は、StripeからのWebhookリクエストを受信し、
 * 決済イベントに応じて適切な処理を実行します。
 * 
 * @param req - NextRequestオブジェクト（StripeからのWebhookリクエスト）
 * @returns NextResponse - 処理結果に応じたHTTPレスポンス
 * 
 * セキュリティ機能：
 * - 署名検証：Stripeの署名を検証してリクエストの正当性を確認
 * - エラーハンドリング：適切なHTTPステータスコードでエラーを返す
 * 
 * 処理されるイベント：
 * - checkout.session.completed: 決済完了時の購入記録保存
 * - その他のイベント: ログ出力のみ（将来の拡張用）
 * 
 * 注意事項：
 * - Webhookは複数回送信される可能性があるため、冪等性を保つ必要がある
 * - 処理に時間がかかる場合は、Stripeがタイムアウトする可能性がある
 */
export async function POST(req: NextRequest) {
  try {
    // Stripeの署名ヘッダーを取得
    // この署名により、リクエストがStripeから送信されたことを確認
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      // 署名がない場合は認証エラーとして401を返す
      return new NextResponse("Stripe署名がありません", { status: 401 });
    }

    // Webhookの秘密鍵を取得
    // この秘密鍵は、署名の検証に使用される
    const webhookSecret = STRIPE_WEBHOOK_SECRET;

    // リクエストボディをテキスト形式で取得
    // 署名検証には生のテキストが必要
    const body = await req.text();

    // Stripeの署名を検証してイベントオブジェクトを構築
    let event: Stripe.Event;
    try {
      // constructEventAsyncにより、署名の検証とイベントの構築を同時に実行
      // 署名が無効な場合や、ボディが改ざんされている場合は例外が発生
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (error) {
      // 署名検証に失敗した場合は400エラーを返す
      const message = error instanceof Error ? error.message : "不明なエラー";
      console.error(`Webhook署名検証失敗: ${message}`);
      return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    // イベントタイプに基づいて適切な処理を実行
    // 現在は決済完了イベントのみを処理
    switch (event.type) {
      case "checkout.session.completed":
        // 決済セッションが完了した場合の処理
        const session = event.data.object as Stripe.Checkout.Session;

        // 購入記録をデータベースに保存
        // これにより、ユーザーがコンテンツにアクセスできるようになる
        await recordCompletedPurchase(session);
        break;

      default:
        // 現在処理していないイベントタイプの場合はログに記録
        // 将来の機能拡張時に参考になる
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }

    // 処理が正常に完了した場合は200ステータスを返す
    // Stripeは200レスポンスを受信すると、Webhookの送信を成功として扱う
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    // 予期しないエラーが発生した場合は500エラーを返す
    // これにより、StripeはWebhookの再送信を試行する
    const message = error instanceof Error ? error.message : "不明なエラー";
    console.error(`Webhook処理エラー: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 500 });
  }
}