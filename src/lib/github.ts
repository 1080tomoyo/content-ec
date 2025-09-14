import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import yaml from "js-yaml";
import {
  GitHubItem,
  Article,
  Book,
  ParsedMarkdown,
  ArticleFrontMatter,
  BookConfig,
} from "../types/github";

/**
 * GitHubリポジトリからコンテンツを取得・管理するモジュール
 * 
 * このモジュールは、GitHubリポジトリに保存されたMarkdownファイルやYAMLファイルを
 * 取得し、アプリケーションで使用できる形式に変換する役割を担います。
 * 記事（articles）と本（books）の両方のコンテンツを扱います。
 */

// ============================================================================
// 設定定数
// ============================================================================

// 今回使用するコンテンツのリポジトリ情報
// 実際の運用では、環境変数から取得することを推奨
const REPO_OWNER = "b13o";
const REPO_NAME = "dummy-ec-content";

// GitHub APIのエンドポイントURL
// RAW_CONTENT_URL: ファイルの生の内容を取得するためのURL
// API_URL: ディレクトリ構造やファイル一覧を取得するためのURL
const RAW_CONTENT_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;
 
// ============================================================================
// 基本データ取得関数
// ============================================================================

/**
 * GitHubリポジトリの指定されたディレクトリ内のファイル・フォルダ一覧を取得する
 * 
 * @param path - 取得したいディレクトリのパス（例: "articles", "books/example-book"）
 * @returns Promise<GitHubItem[]> - ディレクトリ内のアイテム一覧
 * 
 * この関数は、GitHub APIを使用してディレクトリ構造を取得します。
 * 記事一覧や本の章一覧を取得する際の基盤となる関数です。
 * 
 * キャッシュを強制することで、同じリクエストを繰り返し実行する際の
 * パフォーマンスを向上させています。
 */
export async function fetchDirectoryContents(
  path: string
): Promise<GitHubItem[]> {
  // GitHub APIのContents APIを使用してディレクトリ内容を取得
  // force-cacheにより、同じリクエストはキャッシュから返される
  const response = await fetch(`${API_URL}/${path}`, {
    cache: "force-cache",
  });

  // APIエラーの場合は適切なエラーメッセージと共に例外を投げる
  // これにより、呼び出し元でエラーハンドリングが可能になる
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  // レスポンスをJSON形式でパースして返す
  return await response.json();
}
 
/**
 * GitHubリポジトリから指定されたファイルの内容を取得する
 * 
 * @param path - 取得したいファイルのパス（例: "articles/example.md", "books/example/config.yaml"）
 * @returns Promise<string> - ファイルの生の内容（テキスト形式）
 * 
 * この関数は、MarkdownファイルやYAMLファイルなどの実際の内容を取得します。
 * fetchDirectoryContentsで取得したファイル一覧から、個別のファイル内容を
 * 取得する際に使用されます。
 * 
 * キャッシュを強制することで、同じファイルを複数回取得する際の
 * パフォーマンスを向上させています。
 */
export async function fetchFileContent(path: string) {
  // GitHubのRaw Content APIを使用してファイルの生の内容を取得
  // このAPIはファイルの内容をそのままテキスト形式で返す
  const response = await fetch(`${RAW_CONTENT_URL}/${path}`, {
    cache: "force-cache",
  });
  
  // ファイルが存在しない場合やアクセス権限がない場合はエラーを投げる
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  // レスポンスをテキスト形式で取得して返す
  return await response.text();
}
 
// ============================================================================
// データ変換・パース関数
// ============================================================================

/**
 * YAML形式の文字列をJavaScriptオブジェクトに変換する
 * 
 * @param content - パースしたいYAML形式の文字列
 * @returns T - パースされたJavaScriptオブジェクト
 * 
 * この関数は、本の設定ファイル（config.yaml）などのYAMLファイルを
 * JavaScriptオブジェクトに変換するために使用されます。
 * 
 * 型安全性を保つため、ジェネリック型Tを使用しており、
 * 呼び出し元で期待する型を指定できます。
 */
export function parseYaml<T>(content: string): T {
  try {
    // js-yamlライブラリを使用してYAMLをJavaScriptオブジェクトに変換
    // 型アサーション（as T）により、呼び出し元で指定した型として扱う
    return yaml.load(content) as T;
  } catch (error) {
    // YAMLの構文エラーやその他のエラーが発生した場合は、
    // より詳細なエラーメッセージと共に例外を投げる
    throw new Error(`Failed to parse YAML: ${error}`);
  }
}
 
/**
 * Markdownファイルを解析して、フロントマターとHTML化された内容を返す
 * 
 * @param markdown - 解析したいMarkdown形式の文字列
 * @returns Promise<ParsedMarkdown> - フロントマターとHTML化された内容を含むオブジェクト
 * 
 * この関数は、記事や本の章のMarkdownファイルを処理するために使用されます。
 * 
 * 処理の流れ：
 * 1. gray-matterライブラリでフロントマター（メタデータ）を抽出
 * 2. remarkライブラリでMarkdownをHTMLに変換
 * 3. フロントマターとHTML化された内容を返す
 * 
 * フロントマターには、タイトル、価格、タグなどのメタデータが含まれます。
 */
export async function parseMarkdown(markdown: string): Promise<ParsedMarkdown> {
  // gray-matterライブラリを使用してフロントマターを解析
  // フロントマターはMarkdownファイルの先頭にあるYAML形式のメタデータ
  // data: フロントマターの内容（タイトル、価格、タグなど）
  // content: フロントマターを除いたMarkdown本文
  const { data, content } = matter(markdown);

  // remarkライブラリを使用してMarkdownをHTMLに変換
  // htmlプラグインにより、MarkdownがHTMLに変換される
  // sanitize: false により、HTMLタグのサニタイズを無効化（セキュリティ上の注意が必要）
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(content);

  // フロントマターとHTML化された内容を返す
  // フロントマターは型アサーションによりArticleFrontMatter型として扱う
  return {
    frontMatter: data as ArticleFrontMatter,
    content: processedContent.toString(),
  };
}
 
// ============================================================================
// 記事関連の関数
// ============================================================================

/**
 * 記事一覧を取得し、アプリケーションで使用できる形式に変換する
 * 
 * @returns Promise<Article[]> - 記事一覧の配列
 * 
 * この関数は、GitHubリポジトリのarticlesディレクトリから
 * すべての記事を取得し、アプリケーションで表示・処理できる形式に変換します。
 * 
 * 処理の流れ：
 * 1. articlesディレクトリの内容を取得
 * 2. Markdownファイルのみをフィルタリング
 * 3. 各記事の内容を取得・解析
 * 4. フロントマターからメタデータを抽出
 * 5. 統一された形式で記事データを返す
 */
export async function fetchArticles(): Promise<Article[]> {
  // articlesディレクトリの内容を取得
  // これにより、ディレクトリ内のすべてのファイル・フォルダの一覧が取得される
  const contents = await fetchDirectoryContents("articles");

  // 記事として扱うファイルのみをフィルタリング
  // 条件：
  // - type === "file": ファイルのみ（ディレクトリは除外）
  // - name.endsWith(".md"): Markdownファイルのみ
  // - !item.name.startsWith("."): 隠しファイル（.keepなど）を除外
  const articleFiles = contents.filter(
    (item: GitHubItem) =>
      item.type === "file" &&
      item.name.endsWith(".md") &&
      !item.name.startsWith(".")
  );

  // 各記事のデータを並列で取得・処理
  // Promise.allを使用することで、複数の記事を同時に処理し、パフォーマンスを向上
  const articles = await Promise.all(
    articleFiles.map(async (file) => {
      // 記事ファイルの内容を取得
      const markdown = await fetchFileContent(`articles/${file.name}`);

      // Markdownを解析してフロントマターとHTML化された内容を取得
      const { frontMatter, content } = await parseMarkdown(markdown);

      // 記事データを統一された形式で構築
      return {
        // ファイル名から拡張子を除いたものをIDとして使用
        id: file.name.replace(".md", ""),
        // フロントマターからタイトルを取得、なければデフォルト値を設定
        title: frontMatter.title || "タイトルなし",
        // フロントマターからタグ（topics）を取得、なければ空配列
        tags: frontMatter.topics || [],
        // フロントマターから価格を取得、なければ0（無料）
        price: frontMatter.price || 0,
        // 価格が0より大きい場合に有料コンテンツとして判定
        isPaid: !!frontMatter.price && frontMatter.price > 0,
        // フロントマターから絵文字を取得、なければデフォルトの📝
        emoji: frontMatter.emoji || "📝",
        // 公開日を取得、なければ現在の日時
        createdAt: frontMatter.published_at || new Date().toISOString(),
        // 更新日を取得、なければ公開日、それもなければ現在の日時
        updatedAt:
          frontMatter.updated_at ||
          frontMatter.published_at ||
          new Date().toISOString(),
        // HTML化された記事の内容
        content: content,
      };
    })
  );

  // 処理に失敗した記事（null）を除外して返す
  // 通常はnullになることはないが、エラーハンドリングの一環として
  return articles.filter((article) => article !== null);
}
 
// ============================================================================
// 本関連の関数
// ============================================================================

/**
 * 本一覧を取得し、アプリケーションで使用できる形式に変換する
 * 
 * @returns Promise<Book[]> - 本一覧の配列
 * 
 * この関数は、GitHubリポジトリのbooksディレクトリから
 * すべての本を取得し、アプリケーションで表示・処理できる形式に変換します。
 * 
 * 本の構造：
 * - 各本は独立したディレクトリに格納される
 * - config.yamlファイルに本のメタデータが記述される
 * - 章はMarkdownファイルとして格納される
 * - 表紙画像はcover.pngとして格納される
 * 
 * 処理の流れ：
 * 1. booksディレクトリの内容を取得
 * 2. ディレクトリのみをフィルタリング
 * 3. 各本のconfig.yamlを取得・解析
 * 4. 章一覧を取得・ソート
 * 5. 統一された形式で本データを返す
 */
export async function fetchBooks(): Promise<Book[]> {
  // booksディレクトリの内容を取得
  // これにより、本のディレクトリ一覧が取得される
  const contents = await fetchDirectoryContents("books");

  // 本として扱うディレクトリのみをフィルタリング
  // 各本は独立したディレクトリに格納されているため、ディレクトリのみを対象とする
  const bookDirectories = contents.filter((item) => item.type === "dir");

  // 各本のデータを並列で取得・処理
  // Promise.allを使用することで、複数の本を同時に処理し、パフォーマンスを向上
  const books = await Promise.all(
    bookDirectories.map(async (dir) => {
      // 本の設定ファイル（config.yaml）を取得
      // このファイルには本のタイトル、説明、価格、タグなどのメタデータが含まれる
      const configContent = await fetchFileContent(
        `books/${dir.name}/config.yaml`
      );

      // 設定ファイルが存在しない場合はnullを返す
      // これにより、不完全な本は一覧から除外される
      if (!configContent) {
        return null;
      }

      // YAML形式の設定ファイルをJavaScriptオブジェクトに変換
      const config = parseYaml<BookConfig>(configContent);

      // 表紙画像のURLを構築
      // GitHubのRaw Content APIを使用して画像にアクセスできるURLを生成
      const coverImagePath = `${RAW_CONTENT_URL}/books/${dir.name}/cover.png`;

      // 本のディレクトリ内の章一覧を取得
      const chapterContents = await fetchDirectoryContents(`books/${dir.name}`);
      
      // 章として扱うファイルのみをフィルタリング・ソート
      const chapters = chapterContents
        .filter(
          (item) =>
            item.type === "file" &&
            item.name.endsWith(".md") &&
            !item.name.startsWith(".")
        )
        .sort((a, b) => {
          // ファイル名の数字部分で並べる（1.intro.md, 2.setup.md など）
          // これにより、章が正しい順序で表示される
          const aNum = parseInt(a.name.split(".")[0]) || 0;
          const bNum = parseInt(b.name.split(".")[0]) || 0;
          return aNum - bNum;
        });

      // 本データを統一された形式で構築
      return {
        // ディレクトリ名をIDとして使用
        id: dir.name,
        // 設定ファイルからタイトルを取得、なければディレクトリ名を使用
        title: config.title || dir.name,
        // 設定ファイルから説明を取得、なければ空文字
        description: config.summary || "",
        // 設定ファイルからタグ（topics）を取得、なければ空配列
        tags: config.topics || [],
        // 設定ファイルから価格を取得、なければ0（無料）
        price: config.price || 0,
        // 価格が0より大きい場合に有料コンテンツとして判定
        isPaid: !!config.price && config.price > 0,
        // 表紙画像のURL
        coverImage: coverImagePath,
        // 章の数（目次表示などで使用）
        chapterCount: chapters.length,
        // 公開日を取得、なければ現在の日時
        createdAt: config.published_at || new Date().toISOString(),
        // 更新日を取得、なければ公開日、それもなければ現在の日時
        updatedAt:
          config.updated_at || config.published_at || new Date().toISOString(),
      };
    })
  );

  // 処理に失敗した本（null）を除外して返す
  // 設定ファイルが存在しない本などが除外される
  return books.filter((book) => book !== null);
}
 
/**
 * 特定の本の詳細情報と章の内容を取得する
 * 
 * @param slug - 本のスラッグ（ディレクトリ名）
 * @returns Promise<Book | null> - 本の詳細情報、存在しない場合はnull
 * 
 * この関数は、本の詳細ページで使用される関数です。
 * fetchBooks()とは異なり、章の実際の内容も含めて取得します。
 * 
 * 処理の流れ：
 * 1. 本の設定ファイル（config.yaml）を取得・解析
 * 2. 本のディレクトリ内の章一覧を取得
 * 3. 各章の内容を取得・解析
 * 4. 本の詳細情報と章の内容を統合して返す
 * 
 * 注意：この関数は章の内容も含むため、fetchBooks()よりも重い処理になります。
 * 本一覧表示ではfetchBooks()を使用し、詳細表示でのみこの関数を使用することを推奨します。
 */
export async function fetchBook(slug: string): Promise<Book | null> {
  // 本の設定ファイル（config.yaml）を取得
  // このファイルには本のメタデータが含まれる
  const configContent = await fetchFileContent(`books/${slug}/config.yaml`);

  // 設定ファイルが存在しない場合はnullを返す
  // これにより、存在しない本へのアクセスを適切に処理
  if (!configContent) {
    return null;
  }

  // YAML形式の設定ファイルをJavaScriptオブジェクトに変換
  const config = parseYaml<BookConfig>(configContent);

  // 本のディレクトリ内の章一覧を取得
  const contents = await fetchDirectoryContents(`books/${slug}`);

  // 章として扱うファイルのみをフィルタリング・ソート
  const chapterFiles = contents
    .filter(
      (item) =>
        item.type === "file" &&
        item.name.endsWith(".md") &&
        !item.name.startsWith(".")
    )
    .sort((a, b) => {
      // ファイル名の数字部分でソート（1.intro.md, 2.setup.md など）
      // これにより、章が正しい順序で表示される
      const aNum = parseInt(a.name.split(".")[0]) || 0;
      const bNum = parseInt(b.name.split(".")[0]) || 0;
      return aNum - bNum;
    });

  // 章が存在しない場合はnullを返す
  // これにより、内容のない本を適切に処理
  if (chapterFiles.length === 0) {
    return null;
  }

  // 各章の内容を並列で取得・処理
  // Promise.allを使用することで、複数の章を同時に処理し、パフォーマンスを向上
  const chapters = await Promise.all(
    chapterFiles.map(async (file, index: number) => {
      // 章ファイルの内容を取得
      const markdown = await fetchFileContent(`books/${slug}/${file.name}`);

      // ファイルが存在しない場合はnullを返す
      if (!markdown) {
        return null;
      }

      // Markdownを解析してフロントマターとHTML化された内容を取得
      const { frontMatter, content } = await parseMarkdown(markdown);

      // チャプターのスラッグは、ファイル名から拡張子を除いたもの
      // これにより、URLで章にアクセスできるようになる
      const chapterSlug = file.name.replace(".md", "");

      // 章データを構築
      return {
        // 章のスラッグ（URLで使用）
        slug: chapterSlug,
        // フロントマターからタイトルを取得、なければデフォルトの章タイトル
        title: frontMatter.title || `Chapter ${index + 1}`,
        // HTML化された章の内容
        content: content,
        // 章の順序（目次表示などで使用）
        order: index,
      };
    })
  );

  // 本の詳細情報を構築
  return {
    // 本のスラッグ（ID）
    id: slug,
    // 設定ファイルからタイトルを取得、なければスラッグを使用
    title: config.title || slug,
    // 設定ファイルから説明を取得、なければ空文字
    description: config.summary || "",
    // 設定ファイルからタグ（topics）を取得、なければ空配列
    tags: config.topics || [],
    // 設定ファイルから価格を取得、なければ0（無料）
    price: config.price || 0,
    // 価格が0より大きい場合に有料コンテンツとして判定
    isPaid: !!config.price && config.price > 0,
    // 表紙画像のURL
    coverImage: `${RAW_CONTENT_URL}/books/${slug}/cover.png`,
    // 章の一覧（処理に失敗した章は除外）
    chapters: chapters.filter((chapter) => chapter !== null),
    // 章の数
    chapterCount: chapters.length,
    // 公開日を取得、なければ現在の日時
    createdAt: config.published_at || new Date().toISOString(),
    // 更新日を取得、なければ公開日、それもなければ現在の日時
    updatedAt:
      config.updated_at || config.published_at || new Date().toISOString(),
  };
}