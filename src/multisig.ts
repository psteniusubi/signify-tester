import { SignifyClient } from "signify-ts";
import { signify, config } from "./client";
import { create_group_identifier } from "./keri/signify";
import { REFRESH_EVENT, dispatch_form_event } from "./util/helper";

export async function load_multisig(): Promise<void> {
    const form = document.querySelector("#multisig form") as HTMLFormElement;
    const create = form.elements.namedItem("create") as HTMLButtonElement;
    create.addEventListener("click", async e => {
        e.preventDefault();
        if (signify === null) return;
        await create_group_identifier(signify, config, "group1", "name1", ["contact1"]);
        document.querySelector("#identifiers form")?.dispatchEvent(new CustomEvent(REFRESH_EVENT));
    });
}
