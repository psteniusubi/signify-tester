import { REFRESH_EVENT, dispatch_form_event, sleep } from "./util/helper";
import { signify } from "./client_form";
import { SignifyClient } from "signify-ts";
import { json2string } from "./util/helper";
import { list_notifications, NotificationType, list_operations, OperationType, remove_operation, create_identifier, send_exchange, MultisigIcpBuilder, AddEndRoleBuilder, add_endRole, MULTISIG_ICP, MULTISIG_RPY, get_rpy_requests, delete_notification, get_name_by_identifier, has_notification, GroupRpyRequest, GroupIcpRequest, IDENTIFIER, has_endRole, invoke_lookup, AID, mark_notification, get_icp_requests } from "./keri/signify";
import { GROUP1 } from "./keri/config";

export async function setup_notifications(): Promise<void> {
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
            /*
            try {
                let list = await signify.escrows().listReply("/end/role");
                text += "escrows.listReply:\r\n" + json2string(list) + "\r\n";
            } catch (e) {
                console.error(e);
            }
            */
            div.innerText = text;
        } else {
            div.innerText = "";
            show_notification(null, []);
        }
        await sleep(2500);
    }
}

async function is_icp_from_lead(client: SignifyClient, icp: GroupIcpRequest): Promise<boolean> {
    return (icp.exn.a.smids.indexOf(icp.exn.i) == 0);
}

async function is_icp_done(client: SignifyClient, icp: GroupIcpRequest): Promise<boolean> {
    for (let i of await invoke_lookup(client, { type: [IDENTIFIER], id: [icp.exn.a.gid] })) {
        return true;
    }
    return false;
}

async function create_icp_form(client: SignifyClient, notification: NotificationType, section: HTMLElement): Promise<boolean> {
    let read = notification.r;
    for (let icp of await get_icp_requests(client, notification)) {
        if (await is_icp_done(client, icp) && !read) {
            await mark_notification(client, notification);
            read = true;
        }

        let form = document.createElement("form") as HTMLFormElement;

        let div = document.createElement("div") as HTMLDivElement;

        let input = document.createElement("input") as HTMLInputElement;
        input.type = "text";
        input.readOnly = true;
        input.value = notification.a.r;
        input.name = "a.r";
        input.title = "a.r";
        div.appendChild(input);

        input = document.createElement("input") as HTMLInputElement;
        input.type = "text";
        input.readOnly = true;
        input.value = GROUP1;
        input.name = "name";
        input.title = "name";
        div.appendChild(input);

        let name = input;

        let submit = document.createElement("button") as HTMLButtonElement;
        submit.type = "submit";
        submit.innerText = "Accept";
        submit.title = "Accept";
        div.appendChild(submit);

        let remove = document.createElement("button") as HTMLButtonElement;
        remove.type = "button";
        remove.innerText = "Remove";
        remove.title = "Remove";
        div.appendChild(remove);

        form.appendChild(div);

        form.addEventListener("submit", async e => {
            e.preventDefault();
            let builder = await MultisigIcpBuilder.create(client, name.value);
            let createIdentifierRequest = await builder.acceptGroupIcpRequest(icp);
            let createIdentifierResponse = await create_identifier(client, builder.alias, createIdentifierRequest);
            let icpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
            let icpResponse = await send_exchange(client, icpRequest);
            await mark_notification(client, notification);
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        });

        remove.addEventListener("click", async e => {
            e.preventDefault();
            await delete_notification(client, notification);
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        });

        form.addEventListener(REFRESH_EVENT, async e => {
            if (signify === null) {
                section.remove();
            } else {
                const predicate = (note: NotificationType) => note.i == notification.i && note.r === false;
                if (!has_notification(client, predicate)) {
                    section.remove();
                }
            }
        });

        section.appendChild(form);
    }
    return read;
}

// async function is_rpy_from_lead(client: SignifyClient, rpy: GroupRpyRequest): Promise<boolean> {
//     let group = await Group.create(client, await get_name_by_identifier(client, rpy.exn.a.gid));
//     return !group.isLead();
// }

async function is_rpy_done(client: SignifyClient, rpy: GroupRpyRequest): Promise<boolean> {
    let alias = await get_name_by_identifier(client, rpy.exn.e.rpy.a.cid);
    return await has_endRole(client, alias, rpy.exn.e.rpy.a.role, rpy.exn.e.rpy.a.eid);
}

async function create_rpy_form(client: SignifyClient, notification: NotificationType, section: HTMLElement): Promise<boolean> {
    let read = notification.r;
    for (let rpy of await get_rpy_requests(client, notification)) {
        if (await is_rpy_done(client, rpy) && !read) {
            await mark_notification(client, notification);
            read = true;
        }

        let form = document.createElement("form") as HTMLFormElement;

        let div = document.createElement("div") as HTMLDivElement;

        let input = document.createElement("input") as HTMLInputElement;
        input.type = "text";
        input.readOnly = true;
        input.value = notification.a.r;
        input.name = "a.r";
        input.title = "a.r";
        div.appendChild(input);

        let submit = document.createElement("button") as HTMLButtonElement;
        submit.type = "submit";
        submit.innerText = "Accept";
        submit.title = "Accept";
        div.appendChild(submit);

        let remove = document.createElement("button") as HTMLButtonElement;
        remove.type = "button";
        remove.innerText = "Remove";
        remove.title = "Remove";
        div.appendChild(remove);

        form.appendChild(div);

        form.addEventListener("submit", async e => {
            e.preventDefault();
            let builder = await AddEndRoleBuilder.create(client);
            let addEndRoleRequest = await builder.acceptGroupRpyRequest(rpy);
            let addEndRoleResponse = await add_endRole(client, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            let rpyResponse = await send_exchange(client, rpyRequest);
            await mark_notification(client, notification);
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        });

        remove.addEventListener("click", async e => {
            e.preventDefault();
            await delete_notification(client, notification);
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        })

        form.addEventListener(REFRESH_EVENT, async e => {
            if (signify === null) {
                section.remove();
            } else {
                const predicate = (note: NotificationType) => note.i == notification.i && note.r === false;
                if (!has_notification(client, predicate)) {
                    section.remove();
                }
            }
        });

        section.appendChild(form);
    }
    return read;
}

async function create_form(client: SignifyClient, notification: NotificationType, section: HTMLElement): Promise<void> {
    let form = document.createElement("form") as HTMLFormElement;

    let div = document.createElement("div") as HTMLDivElement;

    let input = document.createElement("input") as HTMLInputElement;
    input.type = "text";
    input.readOnly = true;
    input.value = notification.a.r;
    input.name = "a.r";
    input.title = "a.r";

    div.appendChild(input);

    form.appendChild(div);

    form.addEventListener("submit", async e => {
        e.preventDefault();
    });

    form.addEventListener(REFRESH_EVENT, async e => {
        if (signify === null) {
            section.remove();
        } else {
            const predicate = (note: NotificationType) => note.i == notification.i && note.r === false;
            if (!has_notification(client, predicate)) {
                section.remove();
            }
        }
    });

    section.appendChild(form);
}

async function show_notification(client: SignifyClient | null, notifications: NotificationType[]): Promise<void> {
    const section = document.querySelector("#reply") as HTMLElement;
    const found = new Set<string>();
    // create new section for each notification with id=${n.a.d}
    for (let notification of notifications) {
        if (client === null) continue;
        let read = notification.r;
        found.add(notification.a.d);
        let sub = section.querySelector(`section#${notification.a.d}`) as HTMLElement;
        if (sub === null) {
            sub = document.createElement("section");
            sub.classList.add("notification");
            sub.setAttribute("id", notification.a.d);
            switch (notification.a.r) {
                case MULTISIG_ICP:
                    read = await create_icp_form(client, notification, sub);
                    break;
                case MULTISIG_RPY:
                    read = await create_rpy_form(client, notification, sub);
                    break;
                default:
                    await create_form(client, notification, sub);
                    break;
            }
            section.appendChild(sub);
        }
        sub.classList.toggle("read", read);
        sub.classList.toggle("unread", !read);
    }
    section.querySelectorAll("section").forEach(i => {
        if (found.has(i.id)) return;
        i.remove();
    });
}

async function add_end_roles(client: SignifyClient, id: AID): Promise<void> {
    let name = await get_name_by_identifier(client, id);
    let builder = await AddEndRoleBuilder.create(client, name);
    let isLead = await builder.isLead();
    if (!isLead) return;
    for (let addEndRoleRequest of await builder.buildAddEndRoleRequest()) {
        let addEndRoleResponse = await add_endRole(client, addEndRoleRequest);
        let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
        let rpyResponse = await send_exchange(client, rpyRequest);
    }
    return;
}

async function process_operations(client: SignifyClient, operations: OperationType[]): Promise<void> {
    //return
    for (let op of operations) {
        if (op.done !== true) continue;
        let [type, id, role, eid] = op.name.split(".") as [string, AID, string?, AID?];
        switch (type) {
            case "group":
                await add_end_roles(client, id);
                await remove_operation(client, op);
                dispatch_form_event(new CustomEvent(REFRESH_EVENT));
                break;
            case "endrole":
                await remove_operation(client, op);
                dispatch_form_event(new CustomEvent(REFRESH_EVENT));
                break;
            default:
                break;
        }
    }
}
