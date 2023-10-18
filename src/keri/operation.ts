import { SignifyClient } from 'signify-ts';
import { sleep } from '../util/helper';

export interface OperationType {
    name: string,
    metadata: any,
    done: boolean,
    error?: any,
    response?: any
}

export async function wait_operation(client: SignifyClient, op: OperationType): Promise<OperationType> {
    let ms = 500;
    let retries = 10;
    while (!op.done) {
        await sleep(ms);
        op = await client.operations().get(op.name);
        ms *= 1.2;
        if (--retries < 1) throw new Error(`wait_operation failed: ${op.name}`);
    }
    await remove_operation(client, op);
    return op;
}

export async function list_operations(client: SignifyClient, type: string | undefined = undefined): Promise<OperationType[]> {
    let params = new URLSearchParams();
    if (type !== undefined) {
        params.append("type", type);
    }
    let path = `/operations?${params}`;
    let res = await client.fetch(path, "GET", null);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

export async function remove_operation(client: SignifyClient, op: OperationType): Promise<void> {
    let path = `/operations/${op.name}`;
    let res = await client.fetch(path, "DELETE", null);
    if (!res.ok) throw new Error(await res.text());
}
