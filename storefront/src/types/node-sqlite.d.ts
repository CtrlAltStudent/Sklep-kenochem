declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...args: unknown[]): unknown;
      get(...args: unknown[]): { n?: number } | undefined;
      all(...args: unknown[]): Record<string, unknown>[];
    };
  }
}
