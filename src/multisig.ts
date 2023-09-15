import { signify } from "./client";
import { get_contact } from "./signify";
import { Algos, CreateIdentiferArgs } from "signify-ts";
import { WITS } from "./config";
import { json2string } from "./helper";

async function create_multisig_group(): Promise<void> {
    if (signify === null) return;
    let name1 = await signify.identifiers().get("name1");
    console.log(json2string(name1));
    let name1_state = (await signify.keyStates().get(name1.prefix)).pop();
    console.log(json2string(name1_state));
    let contact1 = await get_contact(signify, "contact1");
    console.log(json2string(contact1));
    let contact1_state = (await signify.keyStates().get(contact1.id)).pop();
    console.log(json2string(contact1_state));
    let states = [name1_state, contact1_state];
    let rstates = states;
    let kargs: CreateIdentiferArgs = {
        algo: Algos.group,
        mhab: name1,
        isith: ["1/2", "1/2"],
        nsith: ["1/2", "1/2"],
        toad: WITS.length,
        wits: WITS,
        states: states,
        rstates: rstates
    };
    console.log(json2string(kargs));
    let res = await signify.identifiers().create("group1", kargs);
    console.log(json2string(res));
    console.log(json2string(await res.op()));
}

// async function send_multisig_group(): Promise<void> {
//     if (signify === null) return;
//     let name1 = await signify.identifiers().get("name1");
//     console.log(json2string(name1));
//     let name1_state = (await signify.keyStates().get(name1.prefix)).pop();
//     console.log(json2string(name1_state));
//     let contact1 = (await signify.contacts().list(undefined, "alias", `^${"contact1"}$`)).pop();
//     console.log(json2string(contact1));
//     let contact1_state = (await signify.keyStates().get(contact1.id)).pop();
//     console.log(json2string(contact1_state));
//     let aid = name1;
//     let payload = {
//         gid: undefined, // serder.pre
//         smids: [name1_state.i, contact1_state.i],
//         rmids: [name1_state.i, contact1_state.i]
//     };
//     let embeds = {
//         icp: [] // [ serder, atc ]
//     };
//     let recp = [
//         contact1.id
//     ];
//     let res = await signify.exchanges().send("name1", "multisig", aid, "/multisig/icp", payload, embeds, recp);
//     console.log(json2string(res));
//     console.log(json2string(await res.op()));
// }

export async function load_multisig(): Promise<void> {
    const form = document.querySelector("#multisig form") as HTMLFormElement;
    const create = form.elements.namedItem("create") as HTMLButtonElement;
    const send = form.elements.namedItem("send") as HTMLButtonElement;
    create.addEventListener("click", async e => {
        e.preventDefault();
        if (signify === null) return;
        await create_multisig_group();
    });
    // send.addEventListener("click", async e => {
    //     e.preventDefault();
    //     if (signify === null) return;
    //     await send_multisig_group();
    // });
}
