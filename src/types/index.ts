export interface SignUpInput {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar?: {
    bucket: string;
    key: string;
  };
  dropbox?: any;
}

export interface SignInInput {
  username: string;
  password: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar?: {
    bucket: string;
    key: string;
    url?: string;
  };
  dropbox?: any;
  created_at: string;
}

export interface Topic {
  pk: string;
  sk: string;
  topic: string;
  slug: string;
  relevancy: number;
  date: string;
  articleCount: number;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface ResearchArticle {
  pk: string;
  sk: string;
  level: number;
  s3Key: string;
  references: Array<{
    id: number;
    title: string;
    url: string;
  }>;
  content?: string;
}

export interface Note {
  pk: string;
  sk: string;
  noteId: string;
  userId: string;
  topicSlug: string;
  level?: number;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Field {
  pk: string;
  sk: string;
  fieldId: string;
  userId: string;
  name: string;
  description?: string;
  topics: string[];
  createdAt: string;
  updatedAt: string;
}
