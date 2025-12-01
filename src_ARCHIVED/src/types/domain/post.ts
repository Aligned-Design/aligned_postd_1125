export interface Post {
  id: string;
  brandId: string;
  platform?: string;
  content: unknown;
  status?: string;
  scheduledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
