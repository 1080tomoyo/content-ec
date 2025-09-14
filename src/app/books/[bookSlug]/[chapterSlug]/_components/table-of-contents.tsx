import { Chapter } from "@/types/github";
import Link from "next/link";
 
interface TableOfContentsProps {
  chapters: Chapter[];
  currentSlug: string;
  bookSlug: string;
}
 
function TableOfContents({
  chapters,
  currentSlug,
  bookSlug,
}: TableOfContentsProps) {
  return (
    <div className="h-full overflow-y-auto py-4">
      <h3 className="text-lg font-bold mb-3 px-4">目次</h3>
      <nav>
        <ul className="space-y-1">
          {chapters.map((chapter, index) => (
            <li key={chapter.slug}>
              <Link href={`/books/${bookSlug}/${chapter.slug}`}>
                <div
                  className={`
                    flex items-center px-4 py-2 text-sm rounded-lg transition-colors
                    ${
                      chapter.slug === currentSlug
                        ? "bg-slate-200 font-medium"
                        : "hover:bg-slate-100"
                    }
                  `}
                >
                  <span className="w-6 text-center mr-2">{index + 1}</span>
                  <span className="truncate">{chapter.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
 
export default TableOfContents;