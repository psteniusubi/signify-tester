export class Buffer {
    static from(_value: Uint8Array): Uint8Array {
        throw new Error("not implemented");
    }
    static concat(values: Uint8Array[]): Uint8Array {
        let n = 0;
        for (const i of values) {
            n += i.length;
        }
        const result = new Uint8Array(n);
        n = 0;
        for (const i of values) {
            result.set(i, n);
            n += i.length;
        }
        return result;
    }
}

import { toUint8Array, fromUint8Array } from "js-base64";

export class Base64 {
    static encode(value: Uint8Array): string {
        return fromUint8Array(value, true);
    }
    static decode(value: string): Uint8Array {
        return toUint8Array(value);
    }
}

export class Utf8 {
    static encode(value?: string): Uint8Array {
        return new TextEncoder().encode(value);
    }
    static decode(value?: Uint8Array): string {
        return new TextDecoder().decode(value);
    }
}
