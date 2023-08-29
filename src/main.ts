import './style.css'
import { ready, SignifyClient, Tier } from 'signify-ts/src';

document.getElementById("boot")!.addEventListener("click", async () => {
  await ready();
  let client = new SignifyClient("http://localhost:3901", "client1".padEnd(21, "_"), Tier.low);
  try {
    await client.connect();
  } catch {
    await client.boot();
    await client.connect();
  }
  document.getElementById("output")?.append(`${client.controller.pre}\r\n`);
  document.getElementById("output")?.append(`${client.agent?.pre}\r\n`);
});
