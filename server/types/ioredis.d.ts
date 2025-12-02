// Type declarations for ioredis (optional dependency)
declare module 'ioredis' {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- ioredis uses class/interface merging pattern
  export interface Redis {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<string>;
    del(key: string): Promise<number>;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- ioredis uses class/interface merging pattern
  export class Redis implements Redis {
    constructor(options?: Record<string, unknown>);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<string>;
    del(key: string): Promise<number>;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }
  export default Redis;
}

