import { SignifyClient } from 'signify-ts';
import { NotificationType } from './notification';
import { debug_json } from '../util/helper';

export interface GroupRequestExn {
    t: string;
    i: string;
    r: string;
    a: any;
    e: any;
    [property: string]: any;
}

export interface GroupRequest {
    exn: GroupRequestExn;
    paths: any
}

export interface GroupIcpRequestA {
    gid: string;
    smids: string[];
    rmids: string[];
}

export interface GroupIcpRequestE {
    icp: any;
    d: string;
}

export interface GroupIcpRequestExn extends GroupRequestExn {
    a: GroupIcpRequestA;
    e: GroupIcpRequestE;
}

export interface GroupIcpRequestP {
    icp: string;
}

export interface GroupIcpRequest extends GroupRequest {
    exn: GroupIcpRequestExn;
    paths: GroupIcpRequestP;
}

export interface GroupRpyRequestA {
    gid: string;
}

export interface GroupRpyRequestE {
    rpy: {
        dt: string;
        r: string;
        a: {
            cid: string;
            role: string;
            eid: string;
        }
    };
    d: string;
}

export interface GroupRpyRequestExn extends GroupRequestExn {
    a: GroupRpyRequestA;
    e: GroupRpyRequestE;
}

export interface GroupRpyRequestP {
    rpy: string;
}

export interface GroupRpyRequest extends GroupRequest {
    exn: GroupRpyRequestExn;
    paths: GroupRpyRequestP;
}

export async function get_group_request(client: SignifyClient, note: NotificationType): Promise<GroupRequest[]> {
    let res: GroupRequest[] = await client.groups().getRequest(note.a.d);
    debug_json(`get_group_request(${note.a.d})`, res);
    return res;
}

export async function get_icp_request(client: SignifyClient, note: NotificationType): Promise<GroupIcpRequest[]> {
    return await get_group_request(client, note);
}

export async function get_rpy_request(client: SignifyClient, note: NotificationType): Promise<GroupRpyRequest[]> {
    return await get_group_request(client, note);
}

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
    debug_json(`get_members(${alias})`, res);
    return res;
}