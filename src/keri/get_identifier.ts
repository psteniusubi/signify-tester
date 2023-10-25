import { SignifyClient } from 'signify-ts';
import { KeyStateType, RangeType } from './signify';
import { debug_json } from '../util/helper';

export interface ListIdentifierType {
    name: string;
    prefix: string;
    salty?: any;
    group?: {
        mhab: IdentifierType;
        keys: string[];
        ndigs: string[]
    };
}

export interface IdentifierType extends ListIdentifierType {
    // name: string;
    // prefix: string;
    // salty: any;
    // group: any;
    transferable?: boolean;
    state?: KeyStateType;
    windexes?: number[];
    // [property: string]: any;
}

export interface IdentifierRangeType extends RangeType {
    aids: ListIdentifierType[]
}

export async function list_identifiers(client: SignifyClient, start?: number, end?: number): Promise<IdentifierRangeType> {
    let res: IdentifierRangeType = await client.identifiers().list(start, end);
    // debug_json(`list_identifiers(start=${start},end=${end})`, res, "IdentifierRangeType");
    return res;
}

export async function* get_identifiers(client: SignifyClient): AsyncGenerator<ListIdentifierType> {
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
    debug_json(`get_identifier(${alias})`, res, "IdentifierType");
    return res;
}

export async function* get_names_by_identifiers(client: SignifyClient, ids: string[]): AsyncGenerator<ListIdentifierType> {
    if (ids.length < 1) return;
    ids = Array.from(ids);
    for await (let i of get_identifiers(client)) {
        let n = ids.indexOf(i.prefix);
        if (n === -1) continue;
        yield i;
        ids.splice(n, 1);
        if (ids.length < 1) return;
    }
}

export async function get_name_by_identifier(client: SignifyClient, id: string): Promise<string> {
    for await (let i of get_names_by_identifiers(client, [id])) {
        return i.name;
    }
    throw new Error(`get_name_by_identifier(${id}): not found`);
}