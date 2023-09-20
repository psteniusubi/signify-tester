import { SignifyClient } from "signify-ts";
import { signify } from "./client";
import { create_group_identifier } from "./signify";
import { REFRESH_EVENT, dispatch_form_event } from "./helper";

export async function load_multisig(): Promise<void> {
    const form = document.querySelector("#multisig form") as HTMLFormElement;
    const create = form.elements.namedItem("create") as HTMLButtonElement;
    create.addEventListener("click", async e => {
        e.preventDefault();
        if (signify === null) return;
        await create_group_identifier(signify, "group1", "name1", ["contact1"]);
        document.querySelector("#identifiers form")?.dispatchEvent(new CustomEvent(REFRESH_EVENT));
    });
}
