export interface Brand {
  id: string;
  name: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
  metadata?: Record<string, unknown>;
}
