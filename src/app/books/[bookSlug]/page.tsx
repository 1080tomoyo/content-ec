import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBooks, fetchBook } from "@/lib/github";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { formatPrice } from "@/lib/utils";
import PurchaseButton from "@/components/purchase-button";
 
export async function generateStaticParams() {
  const books = await fetchBooks();
  return books.map((book) => ({
    bookSlug: book.id,
  }));
}
 
interface BookPageProps {
  params: Promise<{ bookSlug: string }>;
}
 
export default async function BookPage({ params }: BookPageProps) {
  const { bookSlug } = await params;
  const book = await fetchBook(bookSlug);
 
  if (!book) {
    notFound();
  }
 
  return (
    <main className="min-h-screen bg-white">
      {/* ヒーローエリア */}
      <div className="w-full bg-slate-50 py-16 md:py-24">
        <Container maxWidth="5xl">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div className="w-full md:w-1/3 max-w-[300px] mx-auto md:mx-0">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={book.coverImage}
                  alt={`${book.title}の表紙`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 300px"
                  priority
                />
              </div>
            </div>
 
            {/* 本の情報 */}
            <div className="w-full md:w-2/3">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {book.title}
                </h1>
                <div className="text-gray-500">
                  {new Date(book.updatedAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  に更新 • 全{book.chapterCount}章
                </div>
                <p className="text-lg text-gray-700 mt-2">{book.description}</p>
              </div>
            </div>
          </div>
 
          {/* 購入エリア */}
          <div className="flex flex-col mt-16 sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white rounded-xl shadow-sm">
            <div>
              <div className="text-lg font-semibold">価格</div>
              <div className="text-3xl font-bold mb-2">
                {formatPrice(book.price)}
              </div>
            </div>
 
            {book.price > 0 ? (
              <PurchaseButton
                contentId={book.id}
                contentType="book"
                price={book.price}
                title={book.title}
                size="lg"
                className="w-full sm:w-auto px-12"
              />
            ) : (
              <Button size="lg" className="w-full sm:w-auto px-12">
                無料で読む
              </Button>
            )}
          </div>
        </Container>
      </div>

      {/* 章一覧 */}
      <section className="py-16">
        <Container maxWidth="4xl">
        <h2 className="text-3xl font-bold mb-8">目次</h2>
        <div className="space-y-4">
          {book.chapters?.map((chapter, index) => (
            <Link
              key={chapter.slug}
              href={`/books/${bookSlug}/${chapter.slug}`}
              className="block"
            >
              <div className="flex items-center p-4 rounded-lg hover:bg-slate-50 transition-colors border border-gray-100">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 mr-4">
                  <span className="font-semibold">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{chapter.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
        </Container>
      </section>

      {/* フッターエリア */}
      <div className="w-full bg-slate-50 py-16">
        <Container maxWidth="5xl">
          <div className="flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl font-bold">他の本もチェックしませんか？</h2>
            <p className="text-gray-600 max-w-2xl">
              様々なテーマの本や記事をご用意しています。ぜひチェックしてみてください📚
            </p>
            <Link href="/#books" className="block mt-4">
              <Button size="lg">他の本を見る</Button>
            </Link>
          </div>
        </Container>
      </div>
    </main>
  );
}