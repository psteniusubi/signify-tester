import { SignifyClient } from 'signify-ts/src';
import { sleep } from './helper';

export async function wait_operation(client: SignifyClient, op: any): Promise<any> {
    let ms = 500;
    while (!op.done) {
        await sleep(ms);
        op = await client.operations().get(op.name);
        ms *= 1.2;
    }
    return op;
}
