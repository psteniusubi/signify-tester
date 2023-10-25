import fs from "fs/promises";

export const REFRESH_EVENT = "x-refresh";

export function date2string(value: Date): string {
    return value.toISOString().replace('Z', '000+00:00');
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function json2string(value: any) {
    return JSON.stringify(value, undefined, 2);
}

const fs_log = false;
const begin = new Date();
let sequence = 0;

function log_file(json: string, type: string) {
    import("fs/promises").then(fs => {
        let path = `/home/uroot/signify-tester/types/${begin.toISOString()}-${type}-${sequence++}.json`;
        fs.open(path, "w").then(f => {
            f.writeFile(json);
            f.close();
        });
    }).catch(() => { });
}

export function debug_json(title: string, value: object | string | number | boolean, type?: string) {
    let json = json2string(value);
    console.log(`## ${title} ##:\r\n${json}`);
    if (fs_log && type !== undefined) {
        log_file(json, type);
    }
}

export function dispatch_form_event(event: Event, from?: HTMLFormElement | undefined) {
    Array.from(document.forms).filter(i => i !== from).forEach(i => i.dispatchEvent(event));
}

export async function wait_async_operation<T>(async_operation: () => Promise<T | undefined>): Promise<T> {
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