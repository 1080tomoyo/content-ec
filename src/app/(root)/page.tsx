import { Button } from "@/components/ui/button";
import { BookOpen, Rocket } from "lucide-react";
import { fetchArticles, fetchBooks } from "@/lib/github";
import Link from "next/link";
import FeaturedContent from "./_components/featured-content";
import ContentGrid from "./_components/content-grid";
import Footer from "@/components/footer";
import SignInButton from "@/components/sign-in-button";
 
export default async function Home() {
  const books = await fetchBooks();
  const articles = await fetchArticles();
  return (
    <>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <section className="my-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            自分にぴったりの教材が、
            <br />
            理解へのファストパス
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            入門から実践まで。無料で始められる、プログラミング学習に役立つリソースのコレクション。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignInButton className="px-8! h-11 font-semibold" size="lg">
              <Rocket className="w-5 h-5" />
              無料で始める
            </SignInButton>
            <Button variant="outline" className="px-8! h-11" size="lg" asChild>
              <Link href="#articles">
                <BookOpen className="w-5 h-5" />
                教材を探す
              </Link>
            </Button>
          </div>
        </section>
      </div>
 
      <div className="max-w-7xl mx-auto">
        <FeaturedContent />
        <h2 id="articles" className="text-5xl font-bold mt-24 mb-16">
          おすすめの記事を読む。
        </h2>
        <ContentGrid contents={articles} />
      </div>
      <div className="w-full bg-[#F5F5F7] mt-12 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 id="books" className="text-5xl font-bold mb-16">
            本で深くまで踏み込む。
          </h2>
          <ContentGrid contents={books} />
        </div>
      </div>
      <Footer />
    </>
  );
}