import { signify } from "./client";
import { wait_operation } from "./signify";
import { WITS } from "./config";

async function async_oobi(td: HTMLTableCellElement, name: string) {
    try {
        let oobi = await signify!.oobis().get(name, "agent");
        // console.log(JSON.stringify(oobi));
        let input = document.createElement("input") as HTMLInputElement;
        input.type = "text";
        input.readOnly = true;
        input.value = oobi!.oobis[0];
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
    const refresh = form.elements.namedItem("refresh") as HTMLButtonElement;

    form.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        name.classList.remove("error");
        if (signify === null) return;
        try {
            let op = await signify.identifiers().create(name.value, { toad: 3, wits: WITS });
            op = await wait_operation(signify, op);

            op = await signify.identifiers().addEndRole(name.value, "agent", signify.agent?.pre);
            op = await wait_operation(signify, op);

            refresh.dispatchEvent(new Event("click"));
        } catch {
            name.classList.add("error");
        }
    });

    refresh.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        // reset
        form.dispatchEvent(new Event("reset"));
        // signify client
        if (signify === null) return;
        // get identifiers
        let res = await signify!.identifiers().list();
        let count = 1;
        for (let i of res.aids) {
            // console.log(JSON.stringify(i));
            let tr = table.insertRow();
            let td = tr.insertCell(); // name
            td.innerText = i.name;
            td = tr.insertCell(); // id
            td.innerText = i.prefix;
            td = tr.insertCell(); // oobi
            async_oobi(td, i.name);
            ++count;
        }
        name.value = `name${count}`;
    });

    form.addEventListener("reset", async (e: Event) => {
        e.preventDefault();
        // reset
        form.reset();
        //  remove error status
        name.classList.remove("error");
        // erase table
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    });
}