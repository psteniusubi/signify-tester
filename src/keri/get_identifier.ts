import { SignifyClient } from 'signify-ts';
import { IDENTIFIER, KeyStateType, RangeType, invoke_lookup } from './signify';
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

export type IdentifierPredicate = (notification: ListIdentifierType) => boolean;

export async function* get_identifiers(client: SignifyClient, predicate: IdentifierPredicate | undefined = undefined): AsyncGenerator<ListIdentifierType, any, undefined> {
    const PAGE = 20;
    let start = 0;
    let end = start + PAGE - 1;
    let total = Number.MAX_VALUE;
    while (start < total) {
        let range = await list_identifiers(client, start, end);
        total = range.total;
        start += range.aids.length;
        end = start + PAGE - 1;
        if (predicate === undefined) {
            debug_json("get_identifiers", range.aids, "ListIdentifierType");
            yield* range.aids;
        } else {
            for (let i of range.aids) {
                debug_json("get_identifiers", i, "ListIdentifierType");
                if (predicate(i)) {
                    yield i;
                }
            }
        }
    }
}

export async function get_identifier(client: SignifyClient, alias: string): Promise<IdentifierType> {
    let res: IdentifierType = await client.identifiers().get(alias);
    debug_json(`get_identifier(${alias})`, res, "IdentifierType");
    return res;
}

export async function get_names_by_identifiers(client: SignifyClient, ids: string[]): Promise<IdentifierType[]> {
    let tasks: Promise<IdentifierType>[] = [];
    for (let i of await invoke_lookup(client, { type: [IDENTIFIER], id: ids })) {
        if (i.name !== undefined) {
            tasks.push(get_identifier(client, i.name));
        }
    }
    return Promise.all(tasks);
}

export async function get_name_by_identifier(client: SignifyClient, id: string): Promise<string> {
    for (let i of await invoke_lookup(client, { type: [IDENTIFIER], id: [id] })) {
        if (i.name !== undefined) {
            return i.name;
        }
    }
    throw new Error(`get_name_by_identifier(${id}): not found`);
}