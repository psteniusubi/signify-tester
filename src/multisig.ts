import { signify } from "./client";
import { get_contact, create_group_identifier } from "./signify";
import { Algos, CreateIdentiferArgs, Siger, d, messagize } from "signify-ts";
import { WITS } from "./config";
import { json2string } from "./helper";

async function create_multisig_group(): Promise<void> {
    if (signify === null) return;
    await create_group_identifier(signify, "group1", "name1", ["contact1"]);
    // let name1 = await signify.identifiers().get("name1");
    // console.log(json2string(name1));
    // let name1_state = (await signify.keyStates().get(name1.prefix)).pop();
    // console.log(json2string(name1_state));
    // let contact1 = await get_contact(signify, "contact1");
    // console.log(json2string(contact1));
    // let contact1_state = (await signify.keyStates().get(contact1.id)).pop();
    // console.log(json2string(contact1_state));
    // let states = [name1_state, contact1_state];
    // let rstates = states;
    // let kargs: CreateIdentiferArgs = {
    //     algo: Algos.group,
    //     mhab: name1,
    //     isith: ["1/2", "1/2"],
    //     nsith: ["1/2", "1/2"],
    //     toad: WITS.length,
    //     wits: WITS,
    //     states: states,
    //     rstates: rstates
    // };
    // console.log(json2string(kargs));
    // let res = await signify.identifiers().create("group1", kargs);
    // console.log(json2string(await res.op()));

    // let serder = res.serder
    // let sigs = res.sigs
    // let sigers = sigs.map((sig: any) => new Siger({ qb64: sig }));
    // let ims = d(messagize(serder, sigers));
    // let atc = ims.substring(serder.size);
    // let embeds = {
    //     icp: [serder, atc],
    // }
    // let smids = states.map((state) => state['i']);
    // let recp = [contact1_state].map((state) => state['i']);
    // await signify.exchanges().send("name1", "group1", name1, "/multisig/icp",
    //     { 'gid': serder.pre, smids: smids, rmids: smids }, embeds, recp)
}

export async function load_multisig(): Promise<void> {
    const form = document.querySelector("#multisig form") as HTMLFormElement;
    const create = form.elements.namedItem("create") as HTMLButtonElement;
    const send = form.elements.namedItem("send") as HTMLButtonElement;
    create.addEventListener("click", async e => {
        e.preventDefault();
        if (signify === null) return;
        await create_multisig_group();
    });
}
