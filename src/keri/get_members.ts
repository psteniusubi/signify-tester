import { SignifyClient } from 'signify-ts';
import { debug_in } from '../util/helper';
import { AID } from './signify';

export interface SchemesType {
    http?: string;
    tcp?: string;
}

export interface EndsType {
    [id: AID]: SchemesType;
}

export interface RolesType {
    [role: string]: EndsType;
}

export interface MemberType {
    aid: AID;
    ends: RolesType;
}

export interface MembersType {
    signing: MemberType[];
    rotation: MemberType[];
}

export async function get_members(client: SignifyClient, alias: string): Promise<MembersType> {
    let res: MembersType = await client.identifiers().members(alias);
    debug_in(`get_members(${alias})`, res, "MembersType");
    return res;
}