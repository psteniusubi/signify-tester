import { Serder, SignifyClient } from "signify-ts";
import { invoke_lookup } from "../keri/lookup";

export const REFRESH_EVENT = "x-refresh";

export function date2string(value: Date): string {
    return value.toISOString().replace('Z', '000+00:00');
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function replacer(k: string, v: any): any {
    if (v instanceof Serder) {
        return v.ked;
    }
    return v;
}

export function json2string(value: any) {
    return JSON.stringify(value, replacer, 2);
}

const DIRECTION_IN = "in";
const DIRECTION_OUT = "out";
let fs_log: boolean = false; // TODO: toggle for recording
const begin = new Date();
let sequence = 0;

export function set_fs_log(value: boolean): void {
    fs_log = value;
}

function log_file(json: string, type: string, direction: string) {
    import("fs").then(fs => {
        let path = `/home/uroot/signify-tester/logs/${begin.toISOString()}-${type}-${direction}-${sequence++}.json`;
        fs.writeFileSync(path, json);
    }).catch(() => { });
}

export function debug_json(title: string, value: object | string | number | boolean, type?: string, direction?: string) {
    let json = json2string(value);
    console.log(`## ${title} ##:\r\n${json}`);
    if (fs_log && type !== undefined && direction !== undefined) {
        log_file(json, type, direction);
    }
}

export function debug_in(title: string, value: object | string | number | boolean, type: string) {
    debug_json(title, value, type, DIRECTION_IN);
}

export function debug_out(title: string, value: object | string | number | boolean, type: string) {
    debug_json(title, value, type, DIRECTION_OUT);
}

export function dispatch_form_event(event: Event, from?: HTMLFormElement | undefined) {
    Array.from(document.forms).filter(i => i !== from).forEach(i => i.dispatchEvent(event));
}


export type AsyncOperation<T> = () => Promise<T | undefined>;


/**
 * Poll until async_operation returns a value or timeout expires. 
 * Throws exception if timeout expires.
 */
export async function wait_async_operation<T>(async_operation: AsyncOperation<T>): Promise<T> {
    let ms = 500;
    let retries = 10;
    while (true) {
        let res = await async_operation();
        if (res !== undefined) {
            return res;
        }
        await sleep(ms);
        if (--retries < 1) throw new Error(`wait_async_operation failed`);
        ms *= 1.2;
    }
}

export async function find_next_name(client: SignifyClient, prefix: string, type: string[], begin?: number): Promise<string> {
    const PAGE = 10;
    let n = begin ?? 1;
    while (n < 100) {
        let names = Array(PAGE).fill("").map((value, index) => `${prefix}${index + n}`);
        let result = await invoke_lookup(client, { type: type, name: names });
        names = names.filter(name => !result.some(i => i.name === name));
        if (names.length > 0) return names[0];
        n += PAGE;
    }
    throw new Error("find_next_name");
}
