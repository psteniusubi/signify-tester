import { SignifyClient } from 'signify-ts';
import { NotificationType } from './signify';
import { debug_json } from '../util/helper';

// GroupRequest

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

export async function get_group_request(client: SignifyClient, note: NotificationType): Promise<GroupRequest[]> {
    let res: GroupRequest[] = await client.groups().getRequest(note.a.d);
    debug_json(`get_group_request(${note.a.d})`, res, "GroupRequest");
    return res;
}

// /multisig/icp

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

export async function get_icp_request(client: SignifyClient, note: NotificationType): Promise<GroupIcpRequest[]> {
    let r: GroupIcpRequest[] = await get_group_request(client, note);
    return r;
}

// /multisig/rpy

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

export async function get_rpy_request(client: SignifyClient, note: NotificationType): Promise<GroupRpyRequest[]> {
    let r: GroupRpyRequest[] = await get_group_request(client, note);
    return r;
}
