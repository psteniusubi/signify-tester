declare abstract class As<Tag extends keyof never> {
    private static readonly $as$: unique symbol;
    private [As.$as$]: Record<Tag, true>;
}

export type QB64 = string & As<"QB64">;
export type AID = string & QB64 & As<"AID">;

export function isQB64(value: string): value is QB64 {
    // TODO: check value is base64url
    return true;
}
