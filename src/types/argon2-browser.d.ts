declare module "argon2-browser" {
  export const ArgonType: { Argon2i: number; Argon2d: number; Argon2id: number };
  export function hash(options: {
    pass: string | Uint8Array;
    salt: Uint8Array;
    time?: number;
    mem?: number;
    parallelism?: number;
    hashLen?: number;
    type?: number;
  }): Promise<{ hash: Uint8Array; hashHex?: string; hashBuffer?: ArrayBuffer; hashBytes?: Uint8Array }>;
}
