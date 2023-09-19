import { SignifyClient } from "signify-ts";
import { signify } from "./client";
import { create_group_identifier } from "./signify";

async function create_multisig_group(client: SignifyClient): Promise<void> {
    await create_group_identifier(client, "group1", "name1", ["contact1"]);
}

export async function load_multisig(): Promise<void> {
    const form = document.querySelector("#multisig form") as HTMLFormElement;
    const create = form.elements.namedItem("create") as HTMLButtonElement;
    create.addEventListener("click", async e => {
        e.preventDefault();
        if (signify === null) return;
        await create_multisig_group(signify);
    });
}
