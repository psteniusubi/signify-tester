import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { AID, Contact, GroupIcpRequest, GroupIcpRequestExn, Identifier, IdentifierOrContact, IdentifierType, get_icp_requests, get_names_by_identifiers } from "./signify";
import { KeyStateType, get_keyState } from "./signify";
import { Configuration } from "./config";
import { CreateIdentifierRequest, CreateIdentifierResponse } from "./signify";
import { Algos } from "signify-ts";
import { NotificationType } from "./signify";
import { MULTISIG_ICP, MultisigIcpRequest, MultisigIcpRequestEmbeds, MultisigIcpRequestPayload } from "./signify";
import { debug_out } from "../util/helper";

export class MultisigIcpBuilder {
    /**
     * @param alias Name of new group
     * @param lead Name of local member (local identifier)
     * @param members Names of remote members (contact)
     */
    static async create(client: SignifyClient, alias: string, lead?: string, members?: string[]): Promise<MultisigIcpBuilder> {
        let tasks = members?.map(member => Contact.create(client, member)) ?? [];
        let lead_id = (lead !== undefined) ? await Identifier.create(client, lead) : undefined;
        let builder = new MultisigIcpBuilder(client, alias, lead_id);
        builder.addMember(lead_id);
        for (let task of tasks) {
            builder.addMember(await task);
        }
        // builder.sortMembers();
        return builder;
    }
    client: SignifyClient;
    alias: string;
    lead?: Identifier;
    members: IdentifierOrContact[];
    constructor(client: SignifyClient, alias: string, lead?: Identifier) {
        this.client = client;
        this.alias = alias;
        this.lead = lead;
        this.members = new Array<Contact>(0);
    }
    addMember(member?: IdentifierOrContact) {
        if (member !== undefined) {
            this.members.push(member);
        }
    }
    sortMembers() {
        this.members.sort((a, b) => a.compare(b));
    }
    getIds(): IdentifierOrContact[] {
        return this.members;
    }
    async getKeyStates(): Promise<KeyStateType[]> {
        let tasks = this.getIds().map(id => id.getKeyState());
        return await Promise.all(tasks);
    }
    getSith(): string[] {
        let sith = new Array<string>(this.members.length);
        sith = sith.fill(`1/${sith.length}`);
        return sith;
    }
    async buildCreateIdentifierRequest(config: Configuration): Promise<CreateIdentifierRequest> {
        let isith: string[] = this.getSith();
        let nsith: string[] = isith;
        let states: KeyStateType[] = await this.getKeyStates();
        let rstates: KeyStateType[] = states;
        let request: CreateIdentifierRequest = {
            algo: Algos.group,
            mhab: this.lead?.getIdentifier(),
            isith: isith,
            nsith: nsith,
            toad: config.toad,
            wits: config.wits,
            states: states,
            rstates: rstates
        };
        debug_out(`buildCreateIdentifierRequest(${this.lead?.alias})`, request, "CreateIdentifierRequest");
        return request;
    }
    async getSelf(icp: GroupIcpRequest): Promise<Identifier | undefined> {
        let ids = icp.exn.a.smids.filter(i => i !== icp.exn.i);
        for (let i of await get_names_by_identifiers(this.client, ids)) {
            return await Identifier.createFromIdentifier(this.client, i); // TODO: what if there are more?
        }
        return undefined;
    }
    async acceptGroupIcpNotification(notification: NotificationType): Promise<CreateIdentifierRequest[]> {
        let res: CreateIdentifierRequest[] = [];
        for (let icp of await get_icp_requests(this.client, notification)) {
            res.push(await this.acceptGroupIcpRequest(icp));
        }
        return res;
    }
    async acceptGroupIcpRequest(icp: GroupIcpRequest): Promise<CreateIdentifierRequest> {
        let lead: Identifier | undefined = await this.getSelf(icp);
        let exn: GroupIcpRequestExn = icp.exn;
        let isith = exn.e.icp.kt;
        let nsith = exn.e.icp.nt;
        let states: KeyStateType[] = await Promise.all(exn.a.smids.map(i => get_keyState(this.client, i)));
        let rstates: KeyStateType[] = await Promise.all(exn.a.rmids.map(i => get_keyState(this.client, i)));
        let request: CreateIdentifierRequest = {
            algo: Algos.group,
            mhab: lead?.getIdentifier(),
            isith: isith,
            nsith: nsith,
            toad: parseInt(exn.e.icp.bt),
            wits: exn.e.icp.b,
            states: states,
            rstates: rstates,
            delpre: exn.e.icp.di
        };
        debug_out(`acceptGroupIcpRequest(${lead?.alias})`, request, "CreateIdentifierRequest");
        return request;
    }
    async buildMultisigIcpRequest(identifierRequest: CreateIdentifierRequest, identifierResponse: CreateIdentifierResponse): Promise<MultisigIcpRequest> {
        let payload: MultisigIcpRequestPayload = {
            gid: identifierResponse.serder.pre as AID,
            smids: identifierRequest.states?.map(i => i.i),
            rmids: identifierRequest.rstates?.map(i => i.i),
        };
        let sigers: Siger[] = identifierResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims: string = d(messagize(identifierResponse.serder, sigers));
        let atc: string = ims.substring(identifierResponse.serder.size);
        let embeds: MultisigIcpRequestEmbeds = {
            icp: [identifierResponse.serder, atc]
        };
        let recipients: AID[] = identifierRequest.states!
            .map(i => i.i)
            .filter(i => i !== identifierRequest.mhab?.prefix);
        let request: MultisigIcpRequest = {
            sender: identifierRequest.mhab,
            topic: this.alias,
            route: MULTISIG_ICP,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        debug_out(`buildMultisigIcpRequest(${identifierRequest.mhab?.name})`, request, "MultisigIcpRequest");
        return request;
    }
}
