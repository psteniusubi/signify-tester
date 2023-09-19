import { SignifyClient, CreateIdentiferArgs, Algos, Siger, d, messagize } from 'signify-ts';
import { sleep } from './helper';
import { WITS } from "./config";
import { json2string } from "./helper";

export interface OperationType {
    name: string,
    metadata: any,
    done: boolean,
    error?: any,
    response?: any
}

export async function wait_operation(client: SignifyClient, op: OperationType): Promise<any> {
    let ms = 500;
    while (!op.done) {
        await sleep(ms);
        op = await client.operations().get(op.name);
        ms *= 1.2;
    }
    return op;
}

export interface RangeType {
    start: number,
    end: number,
    total: number,
}

export interface IdentifierType {
    name: string,
    prefix: string,
    [property: string]: any
}

export interface IdentifierRangeType extends RangeType {
    aids: IdentifierType[]
}

export async function list_identifiers(client: SignifyClient): Promise<IdentifierRangeType> {
    let res: IdentifierRangeType = await client.identifiers().list();
    return res;
}

export async function get_identifier(client: SignifyClient, alias: string): Promise<IdentifierType> {
    let res = await client.identifiers().get(alias);
    return res;
}

export interface ContactType {
    id: string,
    alias: string,
    oobi: string,
    challenges?: any[],
    wellKnowns?: any[]
}

export async function list_contacts(client: SignifyClient): Promise<ContactType[]> {
    let res: ContactType[] = await client.contacts().list();
    return res;
}

export async function get_contact(client: SignifyClient, alias: string): Promise<ContactType> {
    let res: ContactType[] = await client.contacts().list(undefined, "alias", `^${alias}$`);
    if (res.length < 1) throw Error(`get_contact: ${alias}`);
    return res.pop()!;
}

export async function get_contacts(client: SignifyClient, aliases: string[]): Promise<ContactType[]> {
    let tasks: Promise<ContactType>[] = [];
    for (let alias of aliases) {
        tasks.push(get_contact(client, alias));
    }
    return await Promise.all(tasks);
}

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

export interface OobiType {
    role: string,
    oobis: string[]
}

export async function get_oobi(client: SignifyClient, alias: string, role: string = "agent"): Promise<OobiType> {
    let res = await client.oobis().get(alias, role);
    return res;
}

export async function resolve_oobi(client: SignifyClient, alias: string, value: string): Promise<void> {
    let op: OperationType = await client.oobis().resolve(value, alias);
    await wait_operation(client, op);
}

export interface NotificationType {
    i: string,
    dt: string,
    r: boolean,
    a: {
        r: string,
        d: string
    }
}

export interface NotificationRangeType extends RangeType {
    notes: NotificationType[]
}

export async function list_notifications(client: SignifyClient): Promise<NotificationRangeType> {
    let res: NotificationRangeType = await client.notifications().list();
    return res;
}

export async function create_single_identifier(client: SignifyClient, alias: string, salt: string | undefined): Promise<void> {
    let args: CreateIdentiferArgs = {
        toad: WITS.length,
        wits: WITS,
        bran: salt ?? undefined
    };
    let res = client.identifiers().create(alias, args);
    let op: OperationType = await res.op();
    await wait_operation(client, op);
    op = await client.identifiers().addEndRole(alias, "agent", client.agent?.pre);
    await wait_operation(client, op);
}

export async function create_group_identifier(client: SignifyClient, alias: string, name: string, contacts: string[]): Promise<void> {
    let sith = new Array(1 + contacts.length);
    sith = sith.fill(`1/${sith.length}`);
    // let name_id = await client.identifiers().get(name);
    let name_id = await get_identifier(client, name);
    console.log(json2string(name_id));
    let contact_ids = await get_contacts(client, contacts);
    let states = await get_keyStates(client, [name_id.prefix].concat(contact_ids.map(contact => contact.id)));
    let rstates = states;
    let kargs: CreateIdentiferArgs = {
        algo: Algos.group,
        mhab: name_id,
        isith: sith,
        nsith: sith,
        toad: WITS.length,
        wits: WITS,
        states: states,
        rstates: rstates
    };
    console.log(json2string(kargs));

    let res = await client.identifiers().create(alias, kargs);
    let op: OperationType = await res.op();
    console.log(json2string(op));

    let serder = res.serder
    let sigs = res.sigs
    let sigers = sigs.map((sig) => new Siger({ qb64: sig }));
    let ims = d(messagize(serder, sigers));
    let atc = ims.substring(serder.size);
    let embeds = {
        icp: [serder, atc],
    }
    let smids = states.map((state) => state.i);
    let rmids = smids;
    let recp = states.map((state) => state.i);
    await client.exchanges().send(name, alias, name_id, "/multisig/icp",
        { 'gid': serder.pre, smids: smids, rmids: rmids }, embeds, recp)
}

export async function accept_group_identifier(client: SignifyClient, alias: string, name: string, id: string): Promise<void> {
    let exn = (await client.groups().getRequest(id)).pop().exn;
    console.log(json2string(exn));
    // let name_id = await client.identifiers().get(name);
    let name_id = await get_identifier(client, name);
    let icp = exn.e.icp;
    let states = await get_keyStates(client, exn.a.smids);
    let rstates = await get_keyStates(client, exn.a.rmids);
    let kargs: CreateIdentiferArgs = {
        algo: Algos.group,
        mhab: name_id,
        isith: icp.kt,
        nsith: icp.nt,
        toad: parseInt(icp.bt),
        wits: icp.b,
        states: states,
        rstates: rstates
    };
    console.log(json2string(kargs));

    let res = client.identifiers().create(alias, kargs);
    let op: OperationType = await res.op();
    console.log(json2string(op));

    let serder = res.serder
    let sigs = res.sigs
    let sigers = sigs.map((sig) => new Siger({ qb64: sig }));
    let ims = d(messagize(serder, sigers));
    let atc = ims.substring(serder.size);
    let embeds = {
        icp: [serder, atc],
    }
    let smids = states.map((state) => state.i);
    let rmids = rstates.map((state) => state.i);
    let recp = states.map((state) => state.i);
    await client.exchanges().send(name, alias, name_id, "/multisig/icp",
        { 'gid': serder.pre, smids: smids, rmids: rmids }, embeds, recp)
}
