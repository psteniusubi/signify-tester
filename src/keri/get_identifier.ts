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

export async function list_identifiers(client: SignifyClient): Promise<IdentifierRangeType> {
    let res: IdentifierRangeType = await client.identifiers().list();
    return res;
}

export async function get_identifier(client: SignifyClient, alias: string): Promise<IdentifierType> {
    let res: IdentifierType = await client.identifiers().get(alias);
    debug_json(`get_identifier(${alias})`, res);
    return res;
}

