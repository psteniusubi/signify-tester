import { REFRESH_EVENT, dispatch_form_event, sleep } from "./util/helper";
import { signify } from "./client";
import { SignifyClient } from "signify-ts";
import { json2string } from "./util/helper";
import { list_notifications, NotificationType, list_operations, OperationType, wait_operation, remove_operation, create_identifier, send_exchange, get_icp_request, GroupIcpRequestExn, MultisigIcpBuilder, mark_notification, get_names_by_identifiers, AddEndRoleBuilder, add_endRole } from "./keri/signify";
import { GROUP1, NAME1 } from "./keri/config";

export async function load_notifications(): Promise<void> {
    const div = document.querySelector("#notifications div.code") as HTMLDivElement;
    while (true) {
        // loop forever polling for notifications
        if (signify !== null) {
            let text = "";
            try {
                let list = await list_notifications(signify);
                text += "list_notifications:\r\n" + json2string(list) + "\r\n";
                await show_notification(signify, list.notes);
            } catch (e) {
                console.error(e);
                show_notification(signify, []);
            }
            try {
                let list = await list_operations(signify);
                text += "list_operations:\r\n" + json2string(list) + "\r\n";
                await process_operations(signify, list);
            } catch (e) {
                console.error(e);
            }
            try {
                let list = await signify.escrows().listReply("/end/role");
                text += "escrows.listReply:\r\n" + json2string(list) + "\r\n";
            } catch (e) {
                console.error(e);
            }
            div.innerText = text;
        } else {
            div.innerText = "";
            show_notification(null, []);
        }
        await sleep(2500);
    }
}

async function create_notification_form(client: SignifyClient, notification: NotificationType): Promise<HTMLFormElement> {
    let div, input;

    let form = document.createElement("form") as HTMLFormElement;
    form.id = notification.a.d;

    div = document.createElement("div");

    input = document.createElement("input");
    input.type = "text";
    input.name = "a.r";
    input.value = notification.a.r;
    input.title = "a.r";
    div.appendChild(input);

    input = document.createElement("input");
    input.type = "text";
    input.name = "a.d";
    input.value = notification.a.d;
    input.title = "a.d";
    div.appendChild(input);

    if (notification.a.r === "/multisig/icp") {
        let exn: GroupIcpRequestExn | null = null;
        for (let r of await get_icp_request(client, notification)) {
            if (r !== null) {
                exn ??= r.exn;
            }
        }
        if (exn !== null) {
            input = document.createElement("input");
            input.type = "text";
            input.name = "exn.i";
            input.value = exn.i;
            input.title = "exn.i";
            div.appendChild(input);
        }
    }

    form.appendChild(div);

    div = document.createElement("div");

    let button = document.createElement("button");
    button.type = "submit";
    button.innerText = "Accept";
    div.appendChild(button);

    form.appendChild(div);

    form.addEventListener("submit", async e => {
        e.preventDefault();
        let builder = await MultisigIcpBuilder.create(client, GROUP1);
        for await (let request of builder.acceptCreateIdentifierRequest(notification)) {
            let response = await create_identifier(client, builder.alias, request);
            let exn = await builder.buildMultisigIcpRequest(request, response);
            await send_exchange(client, exn);
        }
        await mark_notification(client, notification);
        dispatch_form_event(new CustomEvent(REFRESH_EVENT));
    });

    form.addEventListener("reset", async e => {
        e.preventDefault();
        await mark_notification(client, notification);
    });

    return form;
}

async function show_notification(client: SignifyClient | null, notifications: NotificationType[]): Promise<void> {
    const section = document.querySelector("#reply") as HTMLElement;
    const found = new Set<string>();
    // create new form for each notification with id=${n.a.d}
    for (let notification of notifications) {
        if (client === null) continue;
        if (notification.r !== false) continue;
        found.add(notification.a.d);
        let form = section.querySelector(`form#${notification.a.d}`);
        if (form === null) {
            form = await create_notification_form(client, notification);
            section.appendChild(form);
        }
    }
    section.querySelectorAll("form").forEach(i => {
        if (found.has(i.id)) return;
        i.remove();
    });
}

async function add_end_roles(client: SignifyClient, id: string): Promise<boolean> {
    let name;
    for await (let i of get_names_by_identifiers(client, [id])) {
        name = i.name;
        break;
    }
    if (name === undefined) return false;
    let builder = await AddEndRoleBuilder.create(client, name);
    for await (let addEndRoleRequest of builder.buildAddEndRoleRequest()) {
        let addEndRoleResponse = await add_endRole(client, addEndRoleRequest);
        let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
        let rpyResponse = await send_exchange(client, rpyRequest);
    }
    return true;
}

async function process_operations(client: SignifyClient, operations: OperationType[]): Promise<void> {
    for (let op of operations) {
        if (op.done !== true) continue;
        let [type, id, role, eid] = op.name.split(".");
        switch (type) {
            case "group":
                if (await add_end_roles(client, id)) {
                    await remove_operation(client, op);
                }
                break;
        }
    }
}
