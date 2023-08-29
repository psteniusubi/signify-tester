import './style.css';
import { connect, wait_operation } from './signify';
import { SignifyClient } from 'signify-ts/src';

export const WITS = [
  "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
  "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
  "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"
];

async function load() {
  let form = document.getElementById("main") as HTMLFormElement;
  (form.elements.namedItem("refresh") as HTMLButtonElement).addEventListener("click", refresh);
  (form.elements.namedItem("create_identifier") as HTMLButtonElement).addEventListener("click", create_identifier);
  (form.elements.namedItem("add_contact") as HTMLButtonElement).addEventListener("click", add_contact);
}

async function do_connect() {
  let form = document.getElementById("main") as HTMLFormElement;
  let bran = (form.elements.namedItem("bran") as HTMLInputElement).value;
  let client = await connect(bran, "localhost");
  (form.elements.namedItem("bran") as HTMLInputElement).defaultValue = bran;
  return client;
}

async function list_identifiers(client: SignifyClient): Promise<any> {
  const div = document.getElementById("identifiers") as HTMLDivElement;
  div.innerText = "";
  let res = await client.identifiers().list();
  // console.log(JSON.stringify(res));
  for (let i of res.aids) {
    const row = document.createElement("div");
    div.appendChild(row);

    let span = document.createElement("span");
    row.appendChild(span);
    span.innerText = i.name;

    span = document.createElement("span");
    row.appendChild(span);
    span.innerText = i.prefix;

    let oobi = await client.oobis().get(i.name, "agent");
    // console.log(JSON.stringify(oobi));
    span = document.createElement("span");
    row.appendChild(span);
    span.innerText = oobi.oobis[0];
  }
}

async function list_contacts(client: SignifyClient): Promise<any> {
  const div = document.getElementById("contacts") as HTMLDivElement;
  div.innerText = "";
  let res = await client.contacts().list();
  // console.log(JSON.stringify(res));
  for (let i of res) {
    const row = document.createElement("div");
    div.appendChild(row);

    let span = document.createElement("span");
    row.appendChild(span);
    span.innerText = i.alias;

    span = document.createElement("span");
    row.appendChild(span);
    span.innerText = i.id;
  }
}

async function refresh() {
  let client = await do_connect();

  list_identifiers(client);
  list_contacts(client);
}

async function create_identifier() {
  let client = await do_connect();

  let form = document.getElementById("main") as HTMLFormElement;
  let alias = (form.elements.namedItem("identifier_alias") as HTMLInputElement).value;

  form.reset();

  let op = await client.identifiers().create(alias, { wits: WITS, toad: 3 });
  await wait_operation(client, op);

  op = await client.identifiers().addEndRole(alias, "agent", client!.agent!.pre);
  await wait_operation(client, op);

  await refresh();
}

async function add_contact() {
  let client = await do_connect();

  let form = document.getElementById("main") as HTMLFormElement;
  let alias = (form.elements.namedItem("contact_alias") as HTMLInputElement).value;
  let oobi = (form.elements.namedItem("contact_oobi") as HTMLInputElement).value;

  form.reset();

  let op = await client.oobis().resolve(oobi, alias);
  await wait_operation(client, op);

  await refresh();
}

await load();

// document.getElementById("boot")!.addEventListener("click", async () => {
//   let client = await connect("client1", "localhost");
//   document.getElementById("output")?.append(`controller=${client.controller.pre}\r\n`);
//   document.getElementById("output")?.append(`agent=${client.agent?.pre}\r\n`);
//   let res = await client.identifiers().list();
//   document.getElementById("output")?.append(`identifiers: ${JSON.stringify(res)}\r\n`);
// });
