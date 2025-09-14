import Link from "next/link";
import { fetchArticles } from "@/lib/github";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import PurchaseButton from "@/components/purchase-button";
import { formatPrice } from "@/lib/utils";
import { checkAccessAndRedirect } from "@/lib/supabase/utils";
 
// ビルド時に動的なページを生成
export async function generateStaticParams() {
  const articles = await fetchArticles();
  return articles.map((article) => ({
    slug: article.id,
  }));
}
 
interface PostDetailPageProps {
  params: Promise<{ slug: string }>;
}
 
export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  const posts = await fetchArticles();
  const post = posts.find((p) => p.id === slug);
 
  if (!post) {
    return (
      <Container maxWidth="5xl" className="py-12">
        <h1 className="text-4xl font-bold mb-8">記事が見つかりません</h1>
        <Link href="/">
          <Button>トップページに戻る</Button>
        </Link>
      </Container>
    );
  }
 
  if (post.isPaid) {
    await checkAccessAndRedirect(post.id, "article");
  }
 
  return (
    <main className="min-h-screen bg-white">
      {/* ヒーローエリア */}
      <div className="w-full bg-slate-50 py-16 md:py-24">
        <Container maxWidth="5xl">
          <div className="flex flex-col items-start gap-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {post.title}
            </h1>
            <div className="text-gray-500">
              {new Date(post.updatedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              に更新
            </div>
 
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 p-6 bg-white rounded-xl shadow-sm">
              <div>
                <div className="text-lg font-semibold">価格</div>
                <div className="text-3xl font-bold mb-2">
                  {formatPrice(post.price)}
                </div>
              </div>
              {post.price > 0 ? (
                <PurchaseButton
                  contentId={post.id}
                  contentType="article"
                  price={post.price}
                  title={post.title}
                  size="lg"
                  className="w-full sm:w-auto px-12"
                />
              ) : (
                <Button size="lg" className="w-full sm:w-auto px-12">
                  無料で読む
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
 
      {/* コンテンツエリア */}
      <article className="py-16">
        <Container maxWidth="4xl">
        <div className="flex justify-center mb-12">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-slate-100">
            <span className="text-5xl">{post.emoji || "📝"}</span>
          </div>
        </div>
 
        {/* 記事内容 */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        </Container>
      </article>
 
      {/* フッターエリア */}
      <div className="w-full bg-slate-50 py-16">
        <Container maxWidth="5xl">
          <div className="flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl font-bold">この記事はいかがでしたか？</h2>
            <p className="text-gray-600 max-w-2xl">
              他にも様々な記事や本をご用意しています。ぜひチェックしてみてください🤩
            </p>
            <Link href="/#articles" className="mt-4 block">
              <Button size="lg">他の記事を見る</Button>
            </Link>
          </div>
        </Container>
      </div>
    </main>
  );
}