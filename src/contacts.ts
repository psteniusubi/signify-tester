import { signify } from "./client";
import { wait_operation } from "./signify";

export async function load_contacts() {
    const table = document.querySelector("#contacts table") as HTMLTableElement;
    const form = document.querySelector("#contacts form") as HTMLFormElement;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const oobi = form.elements.namedItem("oobi") as HTMLInputElement;
    const refresh = form.elements.namedItem("refresh") as HTMLButtonElement;

    form.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        name.classList.remove("error");
        if (signify === null) return;
        try {
            let op = await signify.oobis().resolve(oobi.value, name.value);
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
        let res = await signify!.contacts().list();
        let count = 1;
        for (let i of res) {
            // console.log(JSON.stringify(i));
            let tr = table.insertRow();
            let td = tr.insertCell();
            td.innerText = i.alias;
            td = tr.insertCell();
            td.innerText = i.id;
            td = tr.insertCell();
            td.innerText = i.oobi;
            ++count;
        }
        name.value = `contact${count}`;
    });

    form.addEventListener("reset", async (e: Event) => {
        e.preventDefault();
        // reset
        form.reset();
        // remove error status
        name.classList.remove("error");
        // erase table
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    });
}
