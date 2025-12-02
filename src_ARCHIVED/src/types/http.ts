import { z } from "zod";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const ErrorShape = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

export type ErrorShape = z.infer<typeof ErrorShape>;

export function wrapResult<T>(data: T) {
  return { success: true, data } as const;
}

export function wrapError(err: ErrorShape) {
  return { success: false, error: err } as const;
}
