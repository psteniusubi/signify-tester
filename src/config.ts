const WITS_PUBLIC: string[] = [
    "BOyuCyHFluqsV0rAYLxJuBSY-ObuLSOL3RaCQdwN1aL0",
    "BJqgbfyC0ZLIOSLqYLtwrVYo44o-VMA4l5kX7Ooxe3y0",
    "BNAsMJ69E5kxnpzAQKDzDghZMdk3nr1-zosV22oXmQGw"
];
const KERIA_ADMIN_PUBLIC: string = "https://keri-admin.io.ubidemo1.com";
const KERIA_BOOT_PUBLIC: string = "https://keri-boot.io.ubidemo1.com";

const WITS_LOCAL: string[] = [
    "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
    "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
    "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"
];
const KERIA_ADMIN_LOCAL: string = "http://localhost:3901";
const KERIA_BOOT_LOCAL: string = "http://localhost:3903";

let _WITS: string[];
let _KERIA_ADMIN: string;
let _KERIA_BOOT: string;

let url = new URL(import.meta.url);
switch (url.hostname) {
    case "localhost":
        _WITS = WITS_LOCAL;
        _KERIA_ADMIN = KERIA_ADMIN_LOCAL;
        _KERIA_BOOT = KERIA_BOOT_LOCAL;
        break;
    default:
        _WITS = WITS_PUBLIC;
        _KERIA_ADMIN = KERIA_ADMIN_PUBLIC;
        _KERIA_BOOT = KERIA_BOOT_PUBLIC;
        break;
}

export const WITS = _WITS;
export const KERIA_ADMIN = _KERIA_ADMIN;
export const KERIA_BOOT = _KERIA_BOOT;

const KEY: string = "signify-tester/passcode";

export async function get_passcodes(): Promise<Array<string>> {
    let value = localStorage.getItem(KEY);
    if (value === null) return [];
    try {
        let result = JSON.parse(value);
        if (result instanceof Array) {
            return Array.from(new Set(result)).sort();
        }
    } catch {
        return [value];
    }
    return [];
}

export async function save_passcode(value: string): Promise<void> {
    let history = new Set(await get_passcodes());
    history.add(value);
    let list = Array.from(history).sort();
    localStorage.setItem(KEY, JSON.stringify(list));
}

export async function remove_passcode(value: string): Promise<void> {
    let history = new Set(await get_passcodes());
    history.delete(value);
    let list = Array.from(history).sort();
    localStorage.setItem(KEY, JSON.stringify(list));
}
