import { REFRESH_EVENT, sleep } from "./helper";
import { signify } from "./client";
import { SignifyClient, Algos, CreateIdentiferArgs } from "signify-ts";
import { json2string } from "./helper";
import { get_keyStates, accept_group_identifier, list_notifications, NotificationType, list_operations, OperationType, wait_operation, remove_operation } from "./signify";

export async function load_notifications(): Promise<void> {
    const div = document.querySelector("#notifications div.code") as HTMLDivElement;
    while (true) {
        // loop forever polling for notifications
        if (signify !== null) {
            let text = "";
            try {
                let list = await list_notifications(signify);
                text += json2string(list) + "\r\n";
                await show_notification(signify, list.notes);
            } catch (e) {
                console.error(e);
                show_notification(signify, []);
            }
            try {
                let list = await list_operations(signify, "group");
                text += json2string(list) + "\r\n";
                await show_group_operation(signify, list);
            } catch (e) {
                console.error(e);
                show_group_operation(signify, []);
            }
            div.innerText = text;
        } else {
            div.innerText = "";
            show_notification(null, []);
            show_group_operation(null, []);
        }
        await sleep(2500);
    }
}

async function show_notification(client: SignifyClient | null, notifications: NotificationType[]): Promise<void> {
    const section = document.querySelector("#reply") as HTMLElement;
    const found = new Set<string>();
    // create new form for each notification with id=${n.a.d}
    for (let n of notifications) {
        if (client === null) continue;
        found.add(n.a.d);
        let form = section.querySelector(`form#${n.a.d}`);
        if (form === null) {
            let div, input;

            form = document.createElement("form");
            form.id = n.a.d;

            div = document.createElement("div");

            input = document.createElement("input");
            input.type = "text";
            input.name = "a.r";
            input.value = n.a.r;
            input.title = "a.r";
            div.appendChild(input);

            input = document.createElement("input");
            input.type = "text";
            input.name = "a.d";
            input.value = n.a.d;
            input.title = "a.d";
            div.appendChild(input);

            if (n.a.r === "/multisig/icp") {
                let exn = (await client.groups().getRequest(n.a.d)).pop().exn;
                console.log(json2string(exn));
                input = document.createElement("input");
                input.type = "text";
                input.name = "exn.i";
                input.value = exn.i;
                input.title = "exn.i";
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
                await accept_group_identifier(client, "group1", "name1", n.a.d);
                await client.notifications().mark(n.i);
                document.querySelector("#identifiers form")?.dispatchEvent(new CustomEvent(REFRESH_EVENT));
            });

            form.addEventListener("reset", async e => {
                e.preventDefault();
                (e.currentTarget as HTMLFormElement).remove();
                document.querySelector("#notifications div.code")!.innerHTML = "";
            });
        }
    }
    section.querySelectorAll("form").forEach(i => {
        if (found.has(i.id)) return;
        i.remove();
    });
}

async function authorize_endpoint(client: SignifyClient, op: OperationType): Promise<void> {
    let t = await client.identifiers().addEndRole("group1", "agent", client.agent?.pre);
    await wait_operation(client, t);
    await remove_operation(client, op);
}

async function show_group_operation(client: SignifyClient | null, operations: OperationType[]): Promise<void> {
    if (client === null) return;
    // for (let op of operations) {
    //     if (op.done) {
    //         authorize_endpoint(client, op);
    //     }
    // }
}
