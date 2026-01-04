import Parser from "rss-parser";
import { Article } from "../lib/types";
import { feeds } from "../lib/feeds";

const parser = new Parser();

export async function fetchFeeds(): Promise<Article[]> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const results = await Promise.all(
    feeds.map(async (url: any) => {
      const feed = await parser.parseURL(url);
      return feed.items
        .filter((i) => {
          const d = new Date(i.pubDate || i.isoDate || "");
          return d >= yesterday;
        })
        .map<Article>((i) => ({
          title: i.title ?? "",
          summary: i.contentSnippet ?? "",
          link: i.link ?? "",
          source: feed.title ?? "unknown",
          published_at: i.pubDate ?? i.isoDate ?? "",
        }));
    })
  );

  return results.flat();
}
