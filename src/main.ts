import './style.css'
import libsodium from "libsodium-wrappers-sumo";
import { Signer } from '../signify-ts/src/keri/core/signer';
import { b } from "../signify-ts/src/keri/core/core";
import { Base64 } from "../signify-ts/src/keri/util/helper";
// import load from 'blake3/browser-async';
// import * as blake3 from 'blake3/browser';

document.getElementById("sign")!.addEventListener("click", async () => {
  await libsodium.ready;

  const output = document.getElementById("output")!;
  output.innerText = "";

  const message = b(document.getElementById("message")!.innerText);

  const signer = new Signer({});
  output.appendChild(document.createTextNode(`publicKey ${Base64.encode(signer.verfer.raw)}\r\n`));

  const signature = signer.sign(message);
  output.appendChild(document.createTextNode(`signature ${Base64.encode(signature.raw)}\r\n`));

  const result = signer.verfer.verify(signature.raw, message)
  console.assert(result, "signer.verfer.verify");
});

document.getElementById("digest")!.addEventListener("click", async () => {
  const output = document.getElementById("output")!;
  output.innerText = "";
  output.appendChild(document.createTextNode(`blake3 is not yet implemented\r\n`));
});
