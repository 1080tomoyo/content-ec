(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__879953c6._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/auth.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "handlers",
    ()=>handlers,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$github$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/github.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$github$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@auth/core/providers/github.js [middleware-edge] (ecmascript)");
;
;
const { handlers, signIn, signOut, auth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    // ============================================================================
    // 認証プロバイダー設定
    // ============================================================================
    /**
   * 認証プロバイダーの設定
   * 
   * このアプリケーションでは、GitHub OAuthのみを使用しています。
   * GitHubアカウントを持っているユーザーは、簡単にログインできます。
   */ providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$github$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"])({
            /**
       * GitHubプロファイル情報のマッピング
       * 
       * GitHubから取得したユーザー情報を、アプリケーションで使用する
       * 形式に変換します。これにより、一貫したユーザー情報を
       * アプリケーション全体で使用できます。
       * 
       * @param profile - GitHubから取得したプロファイル情報
       * @returns アプリケーション用のユーザー情報オブジェクト
       */ profile (profile) {
                return {
                    // GitHubの数値IDを文字列に変換して使用
                    // これにより、データベースでの一意性を保証
                    id: profile.id.toString(),
                    // 表示名の決定ロジック
                    // GitHubのnameが設定されていない場合は、login名を使用
                    // これにより、必ず表示名が存在することを保証
                    name: profile.name || profile.login,
                    // メールアドレス（GitHubで公開設定されている場合のみ）
                    // プライベート設定の場合はnullになる可能性がある
                    email: profile.email,
                    // アバター画像のURL
                    // GitHubのプロフィール画像をそのまま使用
                    image: profile.avatar_url
                };
            }
        })
    ],
    // ============================================================================
    // コールバック設定
    // ============================================================================
    /**
   * 認証フロー中のコールバック関数
   * 
   * これらのコールバックは、認証プロセスの各段階で呼び出され、
   * トークンやセッション情報をカスタマイズできます。
   */ callbacks: {
        /**
     * JWTトークンのカスタマイズ
     * 
     * この関数は、JWTトークンが作成・更新される際に呼び出されます。
     * 初回サインイン時やトークンの更新時に、GitHubのプロファイル情報を
     * JWTトークンに保存します。
     * 
     * @param token - 現在のJWTトークン
     * @param profile - GitHubから取得したプロファイル情報
     * @param user - ユーザー情報
     * @returns カスタマイズされたJWTトークン
     */ jwt ({ token, profile, user }) {
            // 初回サインイン時の処理
            // userとprofileが存在する場合（初回サインイン時）のみ実行
            if (user && profile) {
                // GitHubの一意のIDをJWTトークンに保存
                // これにより、後でセッションからユーザーIDを取得できる
                token.id = profile.id;
            }
            // カスタマイズされたトークンを返す
            return token;
        },
        /**
     * セッション情報のカスタマイズ
     * 
     * この関数は、セッション情報が作成される際に呼び出されます。
     * JWTトークンからユーザーIDを取得し、セッション情報に追加します。
     * これにより、アプリケーション全体でユーザーIDを使用できます。
     * 
     * @param session - 現在のセッション情報
     * @param token - JWTトークン
     * @returns カスタマイズされたセッション情報
     */ session ({ session, token }) {
            // セッションにユーザー情報が存在する場合のみ処理
            if (session?.user) {
                // JWTトークンからGitHubの一意のIDを取得してセッションに追加
                // これにより、購入記録の管理やユーザー識別が可能になる
                session.user.id = token.id;
            }
            // カスタマイズされたセッション情報を返す
            return session;
        }
    }
});
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/auth.ts [middleware-edge] (ecmascript)");
;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "middleware",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["auth"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$middleware$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/middleware.ts [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/auth.ts [middleware-edge] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__879953c6._.js.map