// Type declarations for bull (optional dependency)
declare module 'bull' {
  export interface Queue<T = any> {
    add(data: T, options?: any): Promise<any>;
    process(processor: (job: Job<T>) => Promise<any>): void;
    on(event: string, handler: (...args: any[]) => void): void;
  }
  export interface Job<T = any> {
    id: string;
    data: T;
    progress(value: number): Promise<void>;
  }
  export function Queue<T = any>(name: string, options?: any): Queue<T>;
}

