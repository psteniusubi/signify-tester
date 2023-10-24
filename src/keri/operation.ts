import { SignifyClient } from 'signify-ts';
import { debug_json, sleep, wait_async_operation } from '../util/helper';

export interface OperationType {
    name: string,
    metadata?: any,
    done?: boolean,
    error?: any,
    response?: any
}

export async function XXwait_operation(client: SignifyClient, op: OperationType): Promise<OperationType> {
    let ms = 500;
    let retries = 10;
    while (op.done !== true) {
        await sleep(ms);
        op = await client.operations().get(op.name);
        ms *= 1.2;
        if (--retries < 1) throw new Error(`wait_operation failed: ${op.name}`);
    }
    await remove_operation(client, op);
    return op;
}

export async function wait_operation(client: SignifyClient, op: OperationType): Promise<OperationType> {
    return await wait_async_operation(async () => {
        op = await client.operations().get(op.name);
        if (op.done !== true) return undefined;
        await remove_operation(client, op);
        return op;
    });
}

export async function list_operations(client: SignifyClient, type: string | undefined = undefined): Promise<OperationType[]> {
    let params = new URLSearchParams();
    if (type !== undefined) {
        params.append("type", type);
    }
    let path = `/operations?${params}`;
    let response: Response = await client.fetch(path, "GET", null);
    if (!response.ok) throw new Error(await response.text());
    let res: OperationType[] = await response.json();
    debug_json("list_operations", res);
    return res;
}

export async function remove_operation(client: SignifyClient, op: OperationType): Promise<void> {
    let path = `/operations/${op.name}`;
    let response: Response = await client.fetch(path, "DELETE", null);
    if (!response.ok) throw new Error(await response.text());
}
