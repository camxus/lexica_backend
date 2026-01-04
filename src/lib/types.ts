export type Article = {
  title: string;
  summary: string;
  link: string;
  source: string;
  published_at: string;
};

export type Topic = {
  topic: string;
  relevancy: number;
  articles: Pick<Article, "title" | "link">[];
};
