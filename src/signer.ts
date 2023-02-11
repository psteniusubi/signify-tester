import libsodium from "libsodium-wrappers-sumo";
import { Signer } from '../signify-ts/src/keri/core/signer';
import { b } from "../signify-ts/src/keri/core/core";
import { Base64 } from "../signify-ts/src/keri/util/helper";

export async function signer(output: HTMLElement, message: string) {
    await libsodium.ready;

    const signer = new Signer({});
    output.appendChild(document.createTextNode(`publicKey ${Base64.encode(signer.verfer.raw)}\r\n`));

    const signature = signer.sign(b(message));
    output.appendChild(document.createTextNode(`signature ${Base64.encode(signature.raw)}\r\n`));

    const result = signer.verfer.verify(signature.raw, b(message))
    console.assert(result, "signer.verfer.verify");
}
