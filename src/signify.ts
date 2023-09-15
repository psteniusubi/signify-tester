import { SignifyClient } from 'signify-ts';
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

export async function get_contact(client: SignifyClient, alias: string): Promise<any> {
    let res = await client.contacts().list(undefined, "alias", `^${alias}$`);
    return res.pop();
}
