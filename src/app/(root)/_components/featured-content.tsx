import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckSquare, Clock, Crown, ListTodo, Target } from "lucide-react";
import { fetchBook } from "@/lib/github";
import PurchaseButton from "@/components/purchase-button";
 
const FEATURED_CONTENT = {
  slug: "todo-handson-book",
  properPrice: 27800,
  discount: 94,
  time: "60分",
  difficulty: "入門",
};
 
async function FeaturedContent() {
  const content = await fetchBook(FEATURED_CONTENT.slug);
 
  return (
    <Card className="mb-16 overflow-hidden max-w-5xl mx-auto py-0 gap-0">
      <div className="relative bg-zinc-100 dark:bg-zinc-900 p-4 border-b">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <div className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
      </div>
      <div className="grid lg:grid-cols-[400px_1fr]">
        <div className="relative w-full">
          <div className="relative aspect-[1/1.4] w-full">
            <Image
              src={content?.coverImage || ""}
              alt="Featured content"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 400px"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <CardContent className="grid flex-1 gap-4 p-6">
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                New
              </Badge>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold sm:text-3xl">
                {content?.title}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>学習時間: 約{FEATURED_CONTENT.time}</span>
                <span className="mx-2">•</span>
                <Target className="w-4 h-4" />
                <span>難易度: {FEATURED_CONTENT.difficulty}</span>
                <ListTodo className="w-4 h-4" />
                <span>全{content?.chapterCount}タスク</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">ステップ</h3>
              <div className="space-y-2 text-gray-600">
                {content?.chapters?.slice(0, 5).map((chapter) => (
                  <div key={chapter.slug} className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 mt-1 text-green-600" />
                    {chapter.title}
                  </div>
                ))}
                {content?.chapters && content?.chapters.length > 5 && (
                  <div className="text-gray-500 mt-2">
                    （他 {content?.chapterCount - 5} タスク）
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t p-6">
            <div className="text-2xl font-bold flex items-center">
              ￥{content?.price.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground line-through mx-2">
                ￥{FEATURED_CONTENT.properPrice.toLocaleString()}
              </span>
              <span className="text-sm flex font-medium text-muted-foreground">
                {FEATURED_CONTENT.discount}%OFF
              </span>
            </div>
 
            {content?.id && content?.price && content?.title && (
              <PurchaseButton
                contentId={content?.id}
                price={content?.price}
                title={content?.title}
                contentType="book"
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 font-semibold"
              />
            )}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
 
export default FeaturedContent;