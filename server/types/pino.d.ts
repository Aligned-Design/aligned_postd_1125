// Type declarations for pino (optional dependency)
declare module 'pino' {
  export interface Logger {
    info(msg: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    debug(msg: string, ...args: any[]): void;
  }
  export function pino(options?: any): Logger;
  export default pino;
}

