import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { Contact, GroupIcpRequest, Identifier, IdentifierOrContact, IdentifierType, get_identifier, get_names_by_identifiers } from "./signify";
import { KeyStateType, get_keyState } from "./signify";
import { Configuration } from "./config";
import { CreateIdentifierRequest, CreateIdentifierResponse } from "./signify";
import { Algos } from "signify-ts";
import { NotificationType } from "./signify";
import { get_icp_request } from "./signify";
import { MULTISIG_ICP, MultisigIcpRequest, MultisigIcpRequestEmbeds, MultisigIcpRequestPayload } from "./signify";

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
        let isith = this.getSith();
        let nsith = isith;
        let states = await this.getKeyStates();
        let rstates = states;
        console.assert(this.lead !== undefined);
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
        return request;
    }
    async getLead(icp: GroupIcpRequest): Promise<IdentifierType | undefined> {
        for await (let name of get_names_by_identifiers(this.client, icp.exn.a.smids)) {
            return await get_identifier(this.client, name);
        }
        return undefined;
    }
    async *acceptCreateIdentifierRequest(notification: NotificationType): AsyncGenerator<CreateIdentifierRequest> {
        for (let icp of await get_icp_request(this.client, notification)) {
            let lead_id = await this.getLead(icp);
            let exn = icp.exn;
            let isith = exn.e.icp.kt;
            let nsith = exn.e.icp.nt;
            let states = await Promise.all(exn.a.smids.map(i => get_keyState(this.client, i)));
            let rstates = await Promise.all(exn.a.rmids.map(i => get_keyState(this.client, i)));
            console.assert(lead_id !== undefined);
            let request: CreateIdentifierRequest = {
                algo: Algos.group,
                mhab: lead_id,
                isith: isith,
                nsith: nsith,
                toad: parseInt(exn.e.icp.bt),
                wits: exn.e.icp.b,
                states: states,
                rstates: rstates
            };
            yield request;
        }
    }
    async buildMultisigIcpRequest(identifierRequest: CreateIdentifierRequest, identifierResponse: CreateIdentifierResponse): Promise<MultisigIcpRequest> {
        let payload: MultisigIcpRequestPayload = {
            gid: identifierResponse.serder.pre,
            smids: identifierRequest.states?.map(i => i.i),
            rmids: identifierRequest.rstates?.map(i => i.i),
        };
        let sigers = identifierResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims = d(messagize(identifierResponse.serder, sigers));
        let atc = ims.substring(identifierResponse.serder.size);
        let embeds: MultisigIcpRequestEmbeds = {
            icp: [identifierResponse.serder, atc]
        };
        let recipients: string[] = identifierRequest.states!.map(i => i.i);
        let request: MultisigIcpRequest = {
            sender: identifierRequest.mhab?.name,
            topic: this.alias,
            sender_id: identifierRequest.mhab,
            route: MULTISIG_ICP,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        return request;
    }
}
