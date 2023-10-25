import { SignifyClient } from 'signify-ts';
import { debug_json } from '../util/helper';

export interface SchemesType {
    http?: string;
    tcp?: string;
}

export interface EndsType {
    [id: string]: SchemesType;
}

export interface RolesType {
    [role: string]: EndsType;
}

export interface MemberType {
    aid: string;
    ends: RolesType;
}

export interface MembersType {
    signing: MemberType[];
    rotation: MemberType[];
}

export async function get_members(client: SignifyClient, alias: string): Promise<MembersType> {
    let res: MembersType = await client.identifiers().members(alias);
    debug_json(`get_members(${alias})`, res, "MembersType");
    return res;
}