import { sleep } from "./helper";
import { signify } from "./client";
import { SignifyClient, Algos, CreateIdentiferArgs } from "signify-ts";
import { json2string } from "./helper";

export async function load_notifications(): Promise<void> {
    const div = document.querySelector("#notifications div.code") as HTMLDivElement;
    while (true) {
        if (signify !== null) {
            try {
                let list = await signify.notifications().list();
                div.innerText = json2string(list);
                show_notification(signify, list.notes);
            } catch {
                div.innerText = "";
                show_notification(signify, []);
            }
        } else {
            div.innerText = "";
            show_notification(null, []);
        }
        await sleep(2500);
    }
}

async function get_states(client: SignifyClient, ids: string[]): Promise<any[]> {
    const states: any[] = [];
    for (let i of ids) {
        let r = (await client.keyStates().get(i)).pop();
        states.push(r);
    }
    return states;
}

async function show_notification(client: SignifyClient | null, notifications: any[]): Promise<void> {
    const section = document.querySelector("#reply") as HTMLElement;
    const found = new Set<string>();
    for (let n of notifications) {
        if ("a" in n && "r" in n.a && "d" in n.a) {
            if (client === null) continue;
            found.add(n.a.d);
            let form = section.querySelector(`form#${n.a.d}`);
            if (form === null) {
                form = document.createElement("form");
                form.id = n.a.d;
                let div, input;

                div = document.createElement("div");

                input = document.createElement("input");
                input.type = "text";
                input.name = "a.r";
                input.value = n.a.r;
                div.appendChild(input);

                input = document.createElement("input");
                input.type = "text";
                input.name = "a.d";
                input.value = n.a.d;
                div.appendChild(input);

                if (n.a.r === "/multisig/icp") {
                    let exn = (await client.groups().getRequest(n.a.d)).pop().exn;
                    console.log(json2string(exn));
                    input = document.createElement("input");
                    input.type = "text";
                    input.name = "exn.i";
                    input.value = exn.i;
                    div.appendChild(input);
                }

                form.appendChild(div);

                div = document.createElement("div");

                let button = document.createElement("button");
                button.type = "submit";
                button.innerText = "Accept";
                div.appendChild(button);

                form.appendChild(div);

                section.appendChild(form);

                form.addEventListener("submit", async e => {
                    e.preventDefault();
                    let exn = (await client.groups().getRequest(n.a.d)).pop().exn;
                    let name1 = await client.identifiers().get("name1");
                    console.log(json2string(exn));
                    let icp = exn.e.icp;
                    let states: any[] = await get_states(client, exn.a.smids);
                    let rstates: any[] = await get_states(client, exn.a.rmids);
                    let kargs: CreateIdentiferArgs = {
                        algo: Algos.group,
                        mhab: name1,
                        isith: icp.kt,
                        nsith: icp.nt,
                        toad: parseInt(icp.bt),
                        wits: icp.b,
                        states: states,
                        rstates: rstates
                    };
                    // console.log(json2string(kargs));
                    let res = client.identifiers().create("group1", kargs);
                    // console.log(json2string(res));
                    console.log(json2string(await res.op()));
                });

                form.addEventListener("reset", async e => {
                    e.preventDefault();
                    (e.currentTarget as HTMLFormElement).remove();
                });
            }
        }
    }
    section.querySelectorAll("form").forEach(i => {
        if (found.has(i.id)) return;
        i.remove();
    });
}