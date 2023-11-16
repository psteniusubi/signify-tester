import { SignifyClient } from 'signify-ts';
import { AID, NotificationType } from './signify';
import { debug_in } from '../util/helper';

// GroupRequest

export interface GroupRequestExn {
    t: string;
    i: AID;
    r: string;
    a: any;
    e: any;
    [property: string]: any;
}

export interface GroupRequest {
    exn: GroupRequestExn;
    paths: any
}

export async function get_group_request(client: SignifyClient, note: NotificationType): Promise<GroupRequest[]> {
    let res: GroupRequest[] = await client.groups().getRequest(note.a.d);
    debug_in(`get_group_request(${note.a.d})`, res, "GroupRequest");
    return res;
}

// /multisig/icp

export interface GroupIcpRequestA {
    gid: AID;
    smids: AID[];
    rmids: AID[];
}

export interface GroupIcpRequestE {
    icp: any;
    d: AID;
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

export async function get_icp_request(client: SignifyClient, note: NotificationType): Promise<GroupIcpRequest[]> {
    let r: GroupIcpRequest[] = await get_group_request(client, note);
    return r;
}

// /multisig/rpy

export interface GroupRpyRequestA {
    gid: AID;
}

export interface GroupRpyRequestE {
    rpy: {
        dt: string;
        r: string;
        a: {
            cid: AID;
            role: string;
            eid: AID;
        }
    };
    d: AID;
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

export async function get_rpy_request(client: SignifyClient, note: NotificationType): Promise<GroupRpyRequest[]> {
    let r: GroupRpyRequest[] = await get_group_request(client, note);
    return r;
}
