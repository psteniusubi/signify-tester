export const REFRESH_EVENT = "x-refresh";

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function json2string(value: any) {
    return JSON.stringify(value, undefined, 2);
}

export function debug_json(title: string, value: object) {
    console.debug(`## ${title} ##:\r\n${json2string(value)}`);
}

export function dispatch_form_event(event: Event, from?: HTMLFormElement | undefined) {
    Array.from(document.forms).filter(i => i !== from).forEach(i => i.dispatchEvent(event));
}

export async function wait_async_operation<T>(op: () => Promise<T | undefined>): Promise<T> {
    let ms = 500;
    let retries = 10;
    while (true) {
        let res = await op();
        if (res !== undefined) {
            return res;
        }
        await sleep(ms);
        if (--retries < 1) throw new Error(`wait_async_operation failed`);
        ms *= 1.2;
    }
}