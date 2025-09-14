import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown } from "lucide-react";
import Link from "next/link";
import PurchaseButton from "@/components/purchase-button";
 
interface ContentCardProps {
  content: {
    slug: string;
    title: string;
    price: number;
    tags: string[];
    image?: string;
    emoji?: string;
  };
}
 
function ContentCard({ content }: ContentCardProps) {
  const isBook = content.image !== "";
  const isPremium = content.price > 0;
 
  // カードの内容をコンポーネント化
  const CardComponent = () => (
    <Card className="overflow-hidden pt-0 transition-transform scale-[98%] hover:scale-100 min-w-[500px]">
      <div className="relative aspect-[16/9]">
        {isBook ? (
          <Image
            src={content.image || ""}
            alt={content.title}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-contain bg-gradient-to-br p-8 from-blue-100 to-teal-100"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-sky-100`}
          >
            <span className="text-7xl">{content.emoji || "📝"}</span>
          </div>
        )}
      </div>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-x-2">
            {content.tags.map((tag) => (
              <Badge variant="secondary" key={tag}>
                {tag}
              </Badge>
            ))}
          </div>
          {content.price > 0 && (
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-2xl">{content.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">
          {content.price === 0 ? "無料" : `￥${content.price.toLocaleString()}`}
        </p>
      </CardContent>
      <CardFooter>
        {content.price > 0 ? (
          <PurchaseButton
            contentId={content.slug}
            price={content.price}
            title={content.title}
            contentType={isBook ? "book" : "article"}
            className="w-full"
          />
        ) : (
          <Button className="w-full">
            {content.price > 0 ? "購入する" : "無料で読む"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
 
  // 有料記事の場合はリンクを無効にして、カードをそのまま表示
  if (isPremium && !isBook) {
    return <CardComponent />;
  }
 
  // 無料コンテンツの場合はリンクを有効にする
  return (
    <Link href={isBook ? `/books/${content.slug}` : `/posts/${content.slug}`}>
      <CardComponent />
    </Link>
  );
}
 
export default ContentCard;