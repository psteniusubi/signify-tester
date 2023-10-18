import { Configuration, getLocalConfig, getPublicConfig } from "./keri/config";
export type { Configuration } from "./keri/config";

export function getDefaultConfig(): Configuration {
    let url = new URL(import.meta.url);
    switch (url.hostname) {
        case "localhost":
            return getLocalConfig();
        default:
            return getPublicConfig();
    }
}

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
