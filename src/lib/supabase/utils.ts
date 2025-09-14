import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { supabaseAdmin } from "./client";

/**
 * Supabaseデータベース操作ユーティリティモジュール
 * 
 * このモジュールは、購入記録の管理とアクセス制御を担当します。
 * 決済完了後の購入記録保存、購入履歴の確認、有料コンテンツへの
 * アクセス制御などの重要な機能を管理します。
 * 
 * 主要機能：
 * - 購入記録の作成・保存
 * - ユーザーの購入履歴確認
 * - 有料コンテンツへのアクセス制御
 * - 未認証・未購入ユーザーの適切なリダイレクト
 * 
 * セキュリティ考慮事項：
 * - 管理者権限のSupabaseクライアントを使用
 * - 認証状態の確認
 * - 購入状態の厳密な検証
 */

// ============================================================================
// 型定義
// ============================================================================

/**
 * 購入記録作成時のパラメータ型
 * 
 * @interface CreatePurchaseParams
 * @property userIdentifier - ユーザー識別子（GitHub IDなど）
 * @property contentId - コンテンツID（記事や本のID）
 * @property paymentIntentId - Stripe Payment Intent ID
 * @property amount - 購入金額（円）
 */
interface CreatePurchaseParams {
  userIdentifier: string;
  contentId: string;
  paymentIntentId: string;
  amount: number;
}
 
// ============================================================================
// 購入記録管理関数
// ============================================================================

/**
 * 購入記録をデータベースに保存する
 * 
 * @param params - 購入記録のパラメータ
 * @returns Promise<any> - 作成された購入記録のデータ
 * 
 * この関数は、Stripeの決済完了後に呼び出され、
 * ユーザーの購入記録をデータベースに保存します。
 * 
 * 処理の流れ：
 * 1. Supabaseのpurchasesテーブルに購入記録を挿入
 * 2. 挿入されたレコードを取得して返す
 * 3. エラーが発生した場合は例外を投げる
 * 
 * セキュリティ考慮事項：
 * - 管理者権限のSupabaseクライアントを使用
 * - データベースレベルでの制約により整合性を保証
 * - エラーハンドリングにより不正なデータの保存を防止
 * 
 * 使用場面：
 * - Stripe Webhookでの決済完了時
 * - 手動での購入記録作成時（管理者機能など）
 */
export async function createPurchaseRecord({
  userIdentifier,
  contentId,
  paymentIntentId,
  amount,
}: CreatePurchaseParams) {
  // Supabaseのpurchasesテーブルに購入記録を挿入
  // 管理者権限のクライアントを使用することで、RLS（Row Level Security）をバイパス
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .insert({
      user_identifier: userIdentifier,
      content_id: contentId,
      stripe_payment_intent_id: paymentIntentId,
      amount,
    })
    .select()
    .single(); // 単一のレコードを取得

  // データベースエラーが発生した場合の処理
  if (error) {
    console.error("購入記録エラー:", error);
    // エラーを上位に伝播させることで、呼び出し元で適切な処理が可能
    throw error;
  }

  // 作成された購入記録のデータを返す
  return data;
}
 
/**
 * ユーザーの特定コンテンツに対する購入記録を確認する
 * 
 * @param userIdentifier - ユーザー識別子（GitHub IDなど）
 * @param contentId - 確認したいコンテンツID
 * @returns Promise<boolean> - 購入済みの場合はtrue、未購入の場合はfalse
 * 
 * この関数は、ユーザーが特定のコンテンツを購入しているかを確認します。
 * 有料コンテンツへのアクセス制御や、重複購入の防止に使用されます。
 * 
 * 処理の流れ：
 * 1. 指定されたユーザーとコンテンツの購入記録を検索
 * 2. レコードが存在するかどうかをboolean値で返す
 * 3. エラーが発生した場合は例外を投げる
 * 
 * パフォーマンス考慮事項：
 * - IDのみを取得することで、不要なデータ転送を削減
 * - maybeSingle()により、0件または1件の結果を期待
 * - インデックスが適切に設定されていることを前提
 * 
 * 使用場面：
 * - 有料コンテンツへのアクセス制御
 * - 重複購入の防止
 * - 購入履歴の確認
 */
export async function checkUserPurchase(
  userIdentifier: string,
  contentId: string
) {
  try {
    // 指定されたユーザーとコンテンツの購入記録を検索
    // IDのみを取得することで、パフォーマンスを最適化
    const { data } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("user_identifier", userIdentifier)
      .eq("content_id", contentId)
      .maybeSingle(); // 0件または1件の結果を期待

    // データが存在するかどうかをboolean値で返す
    // データが存在する場合は購入済み、存在しない場合は未購入
    return !!data;
  } catch (error) {
    // データベースエラーが発生した場合の処理
    console.error("購入確認エラー:", error);
    // エラーを上位に伝播させることで、呼び出し元で適切な処理が可能
    throw error;
  }
}
 
// ============================================================================
// アクセス制御関数
// ============================================================================

/**
 * 有料コンテンツへのアクセス制御とリダイレクト処理
 * 
 * @param contentId - アクセスしようとしているコンテンツID
 * @param contentType - コンテンツの種類（"book" または "article"）
 * @returns Promise<void> - リダイレクトまたは正常終了
 * 
 * この関数は、有料コンテンツにアクセスしようとする際に呼び出され、
 * 認証状態と購入状態を確認して適切な処理を実行します。
 * 
 * 処理の流れ：
 * 1. ユーザーの認証状態を確認
 * 2. 未認証の場合はログインページにリダイレクト
 * 3. 認証済みの場合は購入状態を確認
 * 4. 未購入の場合は適切なページにリダイレクト
 * 5. 購入済みの場合は処理を継続
 * 
 * リダイレクト先の決定：
 * - 本の場合: 本の詳細ページ（購入ボタンがある）
 * - 記事の場合: 記事一覧ページ（購入ボタンがある）
 * 
 * セキュリティ考慮事項：
 * - 認証状態の厳密な確認
 * - 購入状態の正確な検証
 * - 適切なリダイレクト先の設定
 * 
 * 使用場面：
 * - 有料コンテンツページのアクセス時
 * - 本の章ページのアクセス時
 * - 記事詳細ページのアクセス時
 */
export async function checkAccessAndRedirect(
  contentId: string,
  contentType: "book" | "article"
) {
  // ユーザーの認証状態を確認
  // NextAuth.jsのセッション情報を取得
  const session = await auth();
  
  // 未認証の場合はログインページにリダイレクト
  // これにより、認証が必要な処理への不正アクセスを防止
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // ユーザーの購入状態を確認
  // 認証済みユーザーが指定されたコンテンツを購入しているかをチェック
  const hasPurchased = await checkUserPurchase(session.user.id!, contentId);
  
  // 未購入の場合は適切なページにリダイレクト
  if (!hasPurchased) {
    // コンテンツの種類に応じてリダイレクト先を決定
    const redirectUrl =
      contentType === "book"
        ? // 本の場合は本の詳細ページにリダイレクト
          // ここで購入ボタンが表示され、ユーザーは購入できる
          `${process.env.NEXT_PUBLIC_BASE_URL}/books/${contentId}`
        : // 記事の場合は記事一覧ページにリダイレクト
          // ここで記事の購入ボタンが表示される
          `${process.env.NEXT_PUBLIC_BASE_URL}/#articles`;

    // リダイレクトを実行
    // Next.jsのredirect関数により、適切なHTTPステータスコードでリダイレクト
    redirect(redirectUrl);
  }
  
  // 認証済みかつ購入済みの場合は、処理を継続
  // この時点で、ユーザーは有料コンテンツにアクセスできる
}