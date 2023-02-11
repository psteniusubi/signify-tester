// import * as blake3 from 'blake3/browser';
import load from 'blake3/browser-async';
import { b } from "../signify-ts/src/keri/core/core";
import { Base64 } from "../signify-ts/src/keri/util/helper";

// export async function digest(output: HTMLElement, message: string) {
//     const hasher = blake3.createHash();
//     const digest = hasher.update(b(message)).digest('');
//     output.appendChild(document.createTextNode(`digest ${Base64.encode(digest)}\r\n`));
// }

export async function digest(output: HTMLElement, message: string) {
    const blake3 = await load();
    const hasher = blake3.createHash();
    const digest = hasher.update(b(message)).digest('');
    output.appendChild(document.createTextNode(`digest ${Base64.encode(digest)}\r\n`));
}
