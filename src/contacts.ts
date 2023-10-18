import { signify } from "./client";
import { REFRESH_EVENT } from "./util/helper";
import { resolve_oobi, list_contacts } from "./keri/signify";

export async function load_contacts() {
    const table = document.querySelector("#contacts table") as HTMLTableElement;
    const form = document.querySelector("#contacts form") as HTMLFormElement;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const oobi = form.elements.namedItem("oobi") as HTMLInputElement;
    const paste = form.elements.namedItem("paste") as HTMLInputElement;
    const refresh = form.elements.namedItem("refresh") as HTMLButtonElement;

    form.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        name.classList.remove("error");
        if (signify === null) return;
        try {
            await resolve_oobi(signify, name.value, oobi.value);
            oobi.value = "";
            form.dispatchEvent(new CustomEvent(REFRESH_EVENT));
        } catch {
            name.classList.add("error");
        }
    });

    form.addEventListener("reset", async (e: Event) => {
        e.preventDefault();
        // reset
        form.reset();
        oobi.value = "";
        // remove error status
        name.classList.remove("error");
        // erase table
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    });

    form.addEventListener(REFRESH_EVENT, async (e: Event) => {
        // reset
        form.dispatchEvent(new Event("reset"));
        // signify client
        if (signify === null) return;
        // get identifiers
        let res = await list_contacts(signify);
        let count = 1;
        for (let i of res) {
            // console.log(JSON.stringify(i));
            let tr = table.insertRow();
            let td = tr.insertCell(); // name
            td.innerText = i.alias ?? "";
            td = tr.insertCell(); // id
            td.innerText = i.id ?? "";
            td = tr.insertCell(); // oobi
            let input = document.createElement("input");
            input.type = "text";
            input.readOnly = true;
            input.value = i.oobi ?? "";
            td.appendChild(input);
            let button = document.createElement("button");
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
