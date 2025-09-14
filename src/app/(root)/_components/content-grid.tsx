import { Article, Book } from "@/types/github";
import ContentCard from "./content-card";
 
// カードに表示するデータに限定して変換
function mapToCardProps(content: Book | Article) {
  const isBook = "coverImage" in content;
  return {
    slug: content.id,
    title: content.title,
    price: content.price,
    tags: content.tags,
    image: isBook ? (content as Book).coverImage : "",
    emoji: !isBook ? (content as Article).emoji : "",
  };
}
 
function ContentGrid({ contents }: { contents: Book[] | Article[] }) {
  return (
    <div className="group relative">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
        {contents.map((content) => (
          <ContentCard key={content.id} content={mapToCardProps(content)} />
        ))}
      </div>
    </div>
  );
}
 
export default ContentGrid;