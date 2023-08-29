import { ready, SignifyClient, Tier } from 'signify-ts/src';

export async function connect(bran: string, hostname: string): Promise<SignifyClient> {
    await ready();
    let client = new SignifyClient(`http://${hostname}:3901`, bran.padEnd(21, "_"), Tier.low, `http://${hostname}:3903`);
    try {
        await client.connect();
    } catch {
        await client.boot();
        await client.connect();
    }
    return client;
}

export async function wait_operation(client: SignifyClient, op: any): Promise<any> {
    while (!op.done) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        op = await client.operations().get(op.name);
    }
    return op;
}