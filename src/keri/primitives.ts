/*

https://softwareengineering.stackexchange.com/questions/437593/is-it-ok-to-have-type-aliases-for-primitive-types-in-typescript 
https://stackoverflow.com/questions/55781559/what-does-the-as-keyword-do
 
*/

declare abstract class As<Tag extends keyof never> {
    private static readonly $as$: unique symbol;
    private [As.$as$]: Record<Tag, true>;
}

export type QB64 = string & As<"QB64">;
export type AID = string & QB64 & As<"AID">;

export function isQB64(value: string): value is QB64 | AID {
    // TODO: check value is base64url
    return true;
}
