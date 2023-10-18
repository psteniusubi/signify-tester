import { SignifyClient } from 'signify-ts';

export interface KeyStateType {
    i: string,
    [property: string]: any,
}

export async function get_keyState(client: SignifyClient, id: string): Promise<KeyStateType> {
    let res = await client.keyStates().get(id);
    return res.pop();
}

export async function get_keyStates(client: SignifyClient, ids: string[]): Promise<KeyStateType[]> {
    let tasks: Promise<KeyStateType>[] = [];
    for (let id of ids) {
        tasks.push(get_keyState(client, id));
    }
    return await Promise.all(tasks);
}

