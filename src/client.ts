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

export async function setup_client_form() {
    const form = document.querySelector("#client form") as HTMLFormElement;
    const status = form.elements.namedItem("status") as HTMLInputElement;
    const hostname = form.elements.namedItem("hostname") as HTMLInputElement;
    hostname.defaultValue = config.admin;
    const agent = form.elements.namedItem("agent") as HTMLInputElement;
    const controller = form.elements.namedItem("controller") as HTMLInputElement;
    const passcode = form.elements.namedItem("passcode") as HTMLInputElement;
    const register = form.elements.namedItem("register") as HTMLButtonElement;
    const history = form.elements.namedItem("history") as HTMLSelectElement;
    signify = null;
    // login
    form.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        signify = null;
        status.value = "";
        agent.value = "";
        controller.value = "";
        status.classList.value = "";
        try {
            let bran = passcode.value;
            let _signify = await create_client(config, bran);
            await _signify.connect();
            signify = _signify;
            await save_passcode(bran);
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        } catch (e) {
            console.error(e);
            status.value = `error ${e}`;
            await remove_passcode(passcode.value);
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        }
    });
    // register
    register.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        signify = null;
        status.value = "";
        agent.value = "";
        controller.value = "";
        status.classList.value = "";
        try {
            let bran = passcode.value as string;
            let _signify = await create_client(config, bran);
            let res = await _signify.boot();
            if (!res.ok) throw new Error(await res.text());
            form.dispatchEvent(new SubmitEvent("submit"));
        } catch (e) {
            console.error(e);
            status.value = `error ${e}`;
            dispatch_form_event(new CustomEvent(REFRESH_EVENT));
        }
    });
    history.addEventListener("change", e => {
        passcode.value = history.value;
        form.dispatchEvent(new SubmitEvent("submit"));
    });
    form.addEventListener("reset", async (e: Event) => {
        e.preventDefault();
        signify = null;
        status.value = "";
        passcode.value = "";
        dispatch_form_event(new CustomEvent(REFRESH_EVENT));
    });
    form.addEventListener(REFRESH_EVENT, async (e: Event) => {
        if (signify !== null) {
            status.value = "connected";
            status.classList.value = "success";
            agent.value = signify.agent!.pre;
            controller.value = signify.controller.pre;
            passcode.value = signify.bran.replace(/_+$/, "");
        } else {
            if (status.value === "") {
                status.classList.value = "";
            } else {
                status.classList.value = "error";
            }
            agent.value = "";
            controller.value = "";
            if (passcode.value === "") {
                passcode.value = random_seed();
            }
        }
        await load_history();
    });
    form.dispatchEvent(new CustomEvent(REFRESH_EVENT));
}
