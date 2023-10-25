import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { AGENT, AddEndRoleRequest, AddEndRoleResponse, IdentifierType, MULTISIG_RPY, MultisigRpyRequestEmbeds, MultisigRpyRequestPayload, get_identifier, get_names_by_identifiers } from "./signify";
import { Identifier, MembersType, MultisigRpyRequest, NotificationType, get_members, get_rpy_request } from "./signify";
import { date2string } from "../util/helper";

export class AddEndRoleBuilder {
    /**
     * @param group Name of new group
     */
    static async create(client: SignifyClient, group: string): Promise<AddEndRoleBuilder> {
        let builder = new AddEndRoleBuilder(client, group);
        return builder;
    }
    client: SignifyClient;
    group: string;
    _group: Promise<Identifier>;
    _members: Promise<MembersType>;
    constructor(client: SignifyClient, group: string) {
        this.client = client;
        this.group = group;
        this._group = Identifier.create(client, group);
        this._members = get_members(client, group);
    }
    async *getEids(): AsyncGenerator<string> {
        let members = await this._members;
        for (let s of members.signing) {
            for (let eid of Object.keys(s.ends.agent)) {
                yield eid;
            }
        }
    }
    async *buildAddEndRoleRequest(): AsyncGenerator<AddEndRoleRequest> {
        let stamp = date2string(new Date());
        for await (let eid of this.getEids()) {
            let request: AddEndRoleRequest = {
                alias: this.group,
                role: AGENT,
                eid: eid,
                stamp: stamp
            };
            yield request;
        }
    }
    async *acceptAddEndRoleRequest(notification: NotificationType): AsyncGenerator<AddEndRoleRequest> {
        for (let rpy of await get_rpy_request(this.client, notification)) {
            let request: AddEndRoleRequest = {
                alias: this.group,
                role: rpy.exn.e.rpy.a.role,
                eid: rpy.exn.e.rpy.a.eid,
                stamp: rpy.exn.e.rpy.dt
            };
            yield request;
        }
    }
    async getLead(members: MembersType): Promise<IdentifierType | undefined> {
        let ids = members.signing.map(i => i.aid);
        for await (let i of get_names_by_identifiers(this.client, ids)) {
            return await get_identifier(this.client, i.name);
        }
        return undefined;
    }
    async buildMultisigRpyRequest(addEndRoleRequest: AddEndRoleRequest, addEndRoleResponse: AddEndRoleResponse): Promise<MultisigRpyRequest> {
        let group = await this._group;
        let members = await this._members;
        let lead = await this.getLead(members);
        let payload: MultisigRpyRequestPayload = {
            gid: group.getId()
        };
        let seal = [
            "SealEvent",
            {
                i: group.getId(),
                s: group.getIdentifier().state.ee.s,
                d: group.getIdentifier().state.ee.d,
            }
        ];
        let sigers = addEndRoleResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims = d(messagize(addEndRoleResponse.serder, sigers, seal));
        let atc = ims.substring(addEndRoleResponse.serder.size);;
        let embeds: MultisigRpyRequestEmbeds = {
            rpy: [addEndRoleResponse.serder, atc]
        };
        let recipients = members.signing.map(i => i.aid);
        let request: MultisigRpyRequest = {
            sender: lead?.name,
            topic: this.group,
            sender_id: lead,
            route: MULTISIG_RPY,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        return request;
    }
}
