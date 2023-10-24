import { SignifyClient } from 'signify-ts';
import Base64 from "urlsafe-base64"
import { Buffer } from 'buffer';
import { getDefaultConfig, get_passcodes, remove_passcode, save_passcode } from './config';
import { dispatch_form_event, REFRESH_EVENT, sleep } from './util/helper';
import { create_client } from './keri/config';

export let signify: SignifyClient | null = null;
export const config = await getDefaultConfig();

function random_seed() {
    let buf = Buffer.alloc(20);
    window.crypto.getRandomValues(buf);
    return Base64.encode(buf).substring(0, 21);
}

async function load_history() {
    const form = document.querySelector("#client form") as HTMLFormElement;
    const history = form.elements.namedItem("history") as HTMLSelectElement;
    history.innerHTML = "";
    let option = document.createElement("option");
    option.defaultSelected = true;
    history.appendChild(option);
    for (let i of await get_passcodes()) {
        option = document.createElement("option");
        option.innerText = i;
        history.appendChild(option);
    }
}

export async function load_client() {
    const form = document.querySelector("#client form") as HTMLFormElement;
    const status = form.elements.namedItem("status") as HTMLInputElement;
    const hostname = form.elements.namedItem("hostname") as HTMLInputElement;
    hostname.defaultValue = config.admin;
    const agent = form.elements.namedItem("agent") as HTMLInputElement;
    const controller = form.elements.namedItem("controller") as HTMLInputElement;
    const passcode = form.elements.namedItem("passcode") as HTMLInputElement;
    const register = form.elements.namedItem("register") as HTMLButtonElement;
    const history = form.elements.namedItem("history") as HTMLSelectElement;
    passcode.value = random_seed();
    await load_history();
    signify = null;
    // login
    form.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        signify = null;
        status.value = "";
        agent.value = "";
        controller.value = "";
        status.classList.remove("success", "error");
        dispatch_form_event(new Event("reset"), form);
        try {
            let bran = passcode.value as string;
            let _signify = await create_client(config, bran);
            await _signify.connect();
            status.classList.add("success");
            status.value = "connected";
            agent.value = _signify.agent!.pre;
            controller.value = _signify.controller.pre;
            signify = _signify;
            dispatch_form_event(new CustomEvent(REFRESH_EVENT), form);
            await save_passcode(bran);
            await load_history();
        } catch (e) {
            console.error(e);
            status.classList.add("error");
            status.value = `error ${e}`;
            await remove_passcode(passcode.value);
            await load_history();
        }
    });
    // register
    register.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        signify = null;
        status.value = "";
        agent.value = "";
        controller.value = "";
        status.classList.remove("success", "error");
        dispatch_form_event(new Event("reset"), form);
        try {
            let bran = passcode.value as string;
            let _signify = await create_client(config, bran);
            let res = await _signify.boot();
            if (!res.ok) throw new Error(await res.text());
            form.dispatchEvent(new SubmitEvent("submit"));
        } catch (e) {
            console.error(e);
            status.classList.add("error");
            status.value = `error ${e}`;
        }
    });
    form.addEventListener("reset", async (e: Event) => {
        status.classList.remove("success", "error");
        signify = null;
        dispatch_form_event(new Event("reset"), form);
        await sleep(0);
        passcode.value = random_seed();
        await load_history();
    });
    form.addEventListener(REFRESH_EVENT, async (e: Event) => {
    });
    history.addEventListener("change", e => {
        passcode.value = history.value;
        form.dispatchEvent(new SubmitEvent("submit"));
    });
}
