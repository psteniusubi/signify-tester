import { ready, SignifyClient, Tier, Salter } from 'signify-ts/src';
import Base64 from "urlsafe-base64"
import { Buffer } from 'buffer';
import { KERIA_ADMIN, KERIA_BOOT, get_passcodes, remove_passcode, save_passcode } from './config';
import { sleep } from './helper';

export let signify: SignifyClient | null = null;

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
    for (let i of (await get_passcodes()).sort()) {
        option = document.createElement("option");
        option.innerText = i;
        history.appendChild(option);
    }
}

export async function load_client() {
    const form = document.querySelector("#client form") as HTMLFormElement;
    const status = form.elements.namedItem("status") as HTMLInputElement;
    const hostname = form.elements.namedItem("hostname") as HTMLInputElement;
    hostname.defaultValue = KERIA_ADMIN;
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
        Array.from(document.forms).filter(i => i !== form).forEach(i => i.dispatchEvent(new Event("reset")));
        try {
            await ready();
            let bran = passcode.value as string;
            let _signify = new SignifyClient(KERIA_ADMIN, bran.padEnd(21, "_"), Tier.low, KERIA_BOOT);
            await _signify.connect();
            status.classList.add("success");
            status.value = "connected";
            agent.value = _signify.agent!.pre;
            controller.value = _signify.controller.pre;
            signify = _signify;
            Array.from(document.forms).filter(i => i !== form).forEach(i => (i.elements.namedItem("refresh") as HTMLButtonElement).dispatchEvent(new Event("click")));
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
        Array.from(document.forms).filter(i => i !== form).forEach(i => i.dispatchEvent(new Event("reset")));
        try {
            await ready();
            let bran = passcode.value as string;
            let _signify = new SignifyClient(KERIA_ADMIN, bran.padEnd(21, "_"), Tier.low, KERIA_BOOT);
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
        Array.from(document.forms).filter(i => i !== form).forEach(i => i.dispatchEvent(new Event("reset")));
        await sleep(0);
        passcode.value = random_seed();
        await load_history();
    });
    history.addEventListener("change", e => {
        passcode.value = history.value;
        form.dispatchEvent(new SubmitEvent("submit"));
    });
}
