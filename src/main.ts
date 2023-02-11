import './style.css'

document.getElementById("sign")!.addEventListener("click", async () => {
  const output = document.getElementById("output")!;
  output.innerText = "";
  const signer = (await import("./signer")).signer;
  await signer(output, document.getElementById("message")!.innerText);
});

document.getElementById("digest")!.addEventListener("click", async () => {
  const output = document.getElementById("output")!;
  output.innerText = "";
  const digest = (await import("./digest")).digest;
  await digest(output, document.getElementById("message")!.innerText);
});
