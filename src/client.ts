import { ready, SignifyClient, Tier, Salter } from 'signify-ts/src';
import Base64 from "urlsafe-base64"
import { Buffer } from 'buffer';
import { KERIA_ADMIN, KERIA_BOOT } from './config';

export let signify: SignifyClient | null = null;

const KEY: string = "signify-tester/passcode";

function random_seed() {
    let buf = Buffer.alloc(20);
    window.crypto.getRandomValues(buf);
    return Base64.encode(buf).substring(0, 21);
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
    const generate = form.elements.namedItem("generate") as HTMLButtonElement;
    passcode.defaultValue = localStorage.getItem(KEY) ?? random_seed();
    signify = null;
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
            localStorage.setItem(KEY, bran);
            passcode.defaultValue = bran;
            Array.from(document.forms).filter(i => i !== form).forEach(i => (i.elements.namedItem("refresh") as HTMLButtonElement).dispatchEvent(new Event("click")));
        } catch (e) {
            console.error(e);
            status.classList.add("error");
            status.value = `error ${e}`;
        }
    });
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
        e.preventDefault();
        form.reset();
        status.classList.remove("success", "error");
        signify = null;
        Array.from(document.forms).filter(i => i !== form).forEach(i => i.dispatchEvent(new Event("reset")));
    });
    generate.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        form.dispatchEvent(new Event("reset"));
        passcode.defaultValue = passcode.value = random_seed();
        register.dispatchEvent(new Event("click"));
    });
}
