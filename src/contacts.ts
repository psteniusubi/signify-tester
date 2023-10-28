import { signify } from "./client";
import { REFRESH_EVENT, dispatch_form_event } from "./util/helper";
import { resolve_oobi, list_contacts } from "./keri/signify";

export async function setup_contacts_form() {
    const table = document.querySelector("#contacts table") as HTMLTableElement;
    const form = document.querySelector("#contacts form") as HTMLFormElement;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const oobi = form.elements.namedItem("oobi") as HTMLInputElement;
    const paste = form.elements.namedItem("paste") as HTMLInputElement;
    const refresh = form.elements.namedItem("refresh") as HTMLButtonElement;

    form.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        name.classList.value = "";
        if (signify === null) return;
        try {
            await resolve_oobi(signify, name.value, oobi.value);
            oobi.value = "";
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        } catch {
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
        oobi.value = "";
        name.classList.value = "";
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
        if (signify === null) return;
        // get contacts
        let res = await list_contacts(signify);
        let count = 1;
        for (let i of res) {
            let tr = table.insertRow();

            // checkbox
            let td = tr.insertCell();
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `contact${count}`;
            td.appendChild(checkbox);

            // name
            td = tr.insertCell();
            let label = document.createElement("label") as HTMLLabelElement;
            label.innerText = i.alias ?? "";
            label.htmlFor = checkbox.id;
            td.appendChild(label);

            // id
            td = tr.insertCell();
            label = document.createElement("label") as HTMLLabelElement;
            label.innerText = i.id ?? "";
            label.htmlFor = checkbox.id;
            td.appendChild(label);

            // oobi
            td = tr.insertCell();
            let input = document.createElement("input") as HTMLInputElement;
            input.type = "text";
            input.readOnly = true;
            input.value = i.oobi ?? "";
            td.appendChild(input);

            // copy
            let button = document.createElement("button") as HTMLButtonElement;
            button.innerText = "Copy";
            button.title = "Copy OOBI value to Clipboard";
            button.addEventListener("click", async (e: Event) => {
                e.preventDefault();
                input.focus();
                input.select();
                await navigator.clipboard.writeText(input.value);
            })
            td.appendChild(button);

            ++count;
        }
        name.value = `contact${count}`;
    });

    refresh.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        form.dispatchEvent(new CustomEvent(REFRESH_EVENT));
    });

    paste.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        oobi.value = await navigator.clipboard.readText();
        oobi.focus();
        oobi.select();
    });
}
