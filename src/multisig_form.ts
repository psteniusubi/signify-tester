import { signify, config } from "./client_form";
import { CONTACT1, GROUP1, NAME1 } from "./keri/config";
import { MultisigIcpBuilder, create_identifier, send_exchange } from "./keri/signify";
import { REFRESH_EVENT, dispatch_form_event } from "./util/helper";

export async function setup_multisig_form(): Promise<void> {
    const form = document.querySelector("#multisig form") as HTMLFormElement;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    name.defaultValue = GROUP1;
    const create = form.elements.namedItem("create") as HTMLButtonElement;
    create.addEventListener("click", async e => {
        e.preventDefault();
        if (signify === null) return;
        let lead = (document.querySelector("#identifiers tr.single input:checked") as HTMLInputElement | undefined)?.value;
        let members: string[] = [];
        document.querySelectorAll("#contacts tr.contact input:checked").forEach(i => members.push((i as HTMLInputElement).value));
        let builder = await MultisigIcpBuilder.create(signify, name.value, lead, members);
        let request = await builder.buildCreateIdentifierRequest(config);
        let response = await create_identifier(signify, builder.alias, request);
        let exn = await builder.buildMultisigIcpRequest(request, response);
        await send_exchange(signify, exn);
        dispatch_form_event(new CustomEvent(REFRESH_EVENT));
    });
}
