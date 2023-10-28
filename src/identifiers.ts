import { signify, config } from "./client";
import { REFRESH_EVENT, dispatch_form_event } from "./util/helper";
import { create_single_identifier, list_identifiers, get_oobi } from "./keri/signify";
import { SignifyClient } from "signify-ts";

async function async_oobi(client: SignifyClient, td: HTMLTableCellElement, name: string) {
    try {
        let oobi = await get_oobi(client, name, "agent");
        // console.log(JSON.stringify(oobi));
        let input = document.createElement("input") as HTMLInputElement;
        input.type = "text";
        input.readOnly = true;
        input.value = oobi.oobis![0];
        td.appendChild(input);

        let button = document.createElement("button");
        button.innerText = "Copy";
        button.title = "Copy OOBI value to Clipboard";
        button.addEventListener("click", async (e: Event) => {
            e.preventDefault();
            input.focus();
            input.select();
            await navigator.clipboard.writeText(input.value);
        });
        td.append(button);
    } catch {
        td.innerText = "error";
        td.classList.add("error");
    }
}

export async function load_identifiers() {
    const table = document.querySelector("#identifiers table") as HTMLTableElement;
    const form = document.querySelector("#identifiers form") as HTMLFormElement;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const salt = form.elements.namedItem("salt") as HTMLInputElement;
    const refresh = form.elements.namedItem("refresh") as HTMLButtonElement;

    form.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        name.classList.value = "";
        if (signify === null) return;
        try {
            await create_single_identifier(signify, config, name.value, salt.value !== "" ? salt.value : undefined);
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        } catch (e) {
            console.error(e);
            name.classList.value = "error";
        }
    });

    form.addEventListener("reset", async (e: Event) => {
        e.preventDefault();
        form.dispatchEvent(new CustomEvent(REFRESH_EVENT));
    });

    form.addEventListener(REFRESH_EVENT, async (e: Event) => {
        name.value = "";
        name.classList.value = "";
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
        if (signify === null) return;
        // get identifiers
        let res = await list_identifiers(signify);
        let count = 1;
        for (let i of res.aids) {
            let tr = table.insertRow();

            tr.classList.add((i.group !== undefined) ? "group" : "single");

            // checkbox
            let td = tr.insertCell();
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `name${count}`;
            td.appendChild(checkbox);

            // name
            td = tr.insertCell();
            let label = document.createElement("label") as HTMLLabelElement;
            label.innerText = i.name ?? "";
            label.htmlFor = checkbox.id;
            td.appendChild(label);

            // id
            td = tr.insertCell();
            label = document.createElement("label") as HTMLLabelElement;
            label.innerText = i.prefix ?? "";
            label.htmlFor = checkbox.id;
            td.appendChild(label);

            // oobi
            td = tr.insertCell();
            async_oobi(signify, td, i.name ?? "");

            ++count;
        }
        name.value = `name${count}`;
    });

    refresh.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        form.dispatchEvent(new CustomEvent(REFRESH_EVENT));
    });
}