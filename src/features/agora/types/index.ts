export interface AgoraPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  bookId?: string;
  bookTitle?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  createdAt: string;
}

export interface AgoraPostsResponse {
  data?: AgoraPost[];
  items?: AgoraPost[];
  total: number;
  page: number;
}

export interface AgoraComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likeCount: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  createdAt: string;
}

export interface AgoraCommentsResponse {
  data?: AgoraComment[];
  items?: AgoraComment[];
  total: number;
  page: number;
}

export interface CreatePostPayload {
  content: string;
}

export interface CreateCommentPayload {
  content: string;
}
