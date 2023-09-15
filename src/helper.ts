export async function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function json2string(value: any) {
    return JSON.stringify(value, undefined, 2);
}
