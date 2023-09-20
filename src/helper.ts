export const REFRESH_EVENT = "x-refresh";

export async function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function json2string(value: any) {
    return JSON.stringify(value, undefined, 2);
}

export function dispatch_form_event(event: Event, from: HTMLFormElement | undefined) {
    Array.from(document.forms).filter(i => i !== from).forEach(i => i.dispatchEvent(event));
}
