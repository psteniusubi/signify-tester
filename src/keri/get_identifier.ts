import { SignifyClient } from 'signify-ts';
import { KeyStateType, RangeType } from './signify';
import { debug_json } from '../util/helper';

export interface IdentifierType {
    name: string;
    prefix: string;
    salty: any;
    group: any;
    transferable: boolean;
    state: KeyStateType;
    windexes: any[];
    // [property: string]: any;
}

export interface IdentifierRangeType extends RangeType {
    aids: IdentifierType[]
}

export async function list_identifiers(client: SignifyClient, start?: number, end?: number): Promise<IdentifierRangeType> {
    let res: IdentifierRangeType = await client.identifiers().list(start, end);
    debug_json(`list_identifiers(start=${start},end=${end})`, res);
    return res;
}

export async function* get_identifiers(client: SignifyClient): AsyncGenerator<IdentifierType> {
    const PAGE = 20;
    let start = 0;
    let end = start + PAGE - 1;
    let total = Number.MAX_VALUE;
    while (start < total) {
        let range = await list_identifiers(client, start, end);
        total = range.total;
        start += range.aids.length;
        end = start + PAGE - 1;
        for (let i of range.aids) {
            yield i;
        }
    }
}

export async function get_identifier(client: SignifyClient, alias: string): Promise<IdentifierType> {
    let res: IdentifierType = await client.identifiers().get(alias);
    debug_json(`get_identifier(${alias})`, res);
    return res;
}

export async function* get_names_by_identifiers(client: SignifyClient, ids: string[]): AsyncGenerator<string> {
    if (ids.length < 1) return;
    ids = Array.from(ids);
    for await (let i of get_identifiers(client)) {
        let n = ids.indexOf(i.prefix);
        if (n === -1) continue;
        yield i.name;
        ids.splice(n, 1);
        if (ids.length < 1) return;
    }
}
