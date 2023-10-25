import { signify, config } from "./client";
import { MultisigIcpBuilder, create_identifier, send_exchange } from "./keri/signify";
import { REFRESH_EVENT, dispatch_form_event } from "./util/helper";

export async function load_multisig(): Promise<void> {
    const form = document.querySelector("#multisig form") as HTMLFormElement;
    const create = form.elements.namedItem("create") as HTMLButtonElement;
    create.addEventListener("click", async e => {
        e.preventDefault();
        if (signify === null) return;
        let builder = await MultisigIcpBuilder.create(signify, "group1", "name1", ["contact1"]);
        let request = await builder.buildCreateIdentifierRequest(config);
        let response = await create_identifier(signify, builder.alias, request);
        let exn = await builder.buildMultisigIcpRequest(request, response);
        await send_exchange(signify, exn);
        dispatch_form_event(new CustomEvent(REFRESH_EVENT));
    });
}
