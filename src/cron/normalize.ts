import { Article } from "../lib/types";

export function normalize(articles: Article[]): Article[] {
  const seen = new Set<string>();

  return articles.filter((a) => {
    const key = a.title + a.link;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
