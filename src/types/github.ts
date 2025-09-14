// GitHubリポジトリ内のコンテンツ（ファイルまたはディレクトリ）
export interface GitHubItem {
    name: string;
    path: string;
    type: "file" | "dir";
  }
   
  export interface Article {
    id: string;
    title: string;
    tags: string[];
    price: number;
    isPaid: boolean;
    emoji: string;
    createdAt: string;
    updatedAt: string;
    content: string;
  }
   
  // 本のチャプター
  export interface Chapter {
    slug: string;
    title: string;
    content: string;
    order: number;
  }
   
  export interface Book {
    id: string;
    title: string;
    description: string;
    tags: string[];
    price: number;
    isPaid: boolean;
    coverImage: string;
    chapterCount: number;
    createdAt: string;
    updatedAt: string;
    chapters?: Chapter[];
  }
   
  // 記事のフロントマター（メタデータ）
  export interface ArticleFrontMatter {
    title: string;
    topics?: string[];
    price?: number;
    emoji: string;
    published_at?: string;
    updated_at?: string;
  }
   
  // Markdown 解析結果
  export interface ParsedMarkdown {
    frontMatter: ArticleFrontMatter;
    content: string;
  }
   
  // 本の設定YAMLファイル（メタデータ）
  export interface BookConfig {
    title: string;
    summary: string;
    topics: string[];
    published: boolean;
    price: number;
    published_at?: string;
    updated_at?: string;
  }
   
  // チャプターのフロントマター
  export interface ChapterFrontMatter {
    title?: string;
    order?: number;
    free?: boolean;
  }