import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { AGENT, AddEndRoleRequest, AddEndRoleResponse, MULTISIG_RPY, MultisigRpyRequestEmbeds, MultisigRpyRequestPayload } from "./signify";
import { Identifier, MembersType, MultisigRpyRequest, NotificationType, get_members, get_rpy_request } from "./signify";
import { date2string } from "../util/helper";

export class AddEndRoleBuilder {
    /**
     * @param group Name of new group
     * @param lead Name of local member (local identifier)
     */
    static async create(client: SignifyClient, group: string, lead: string): Promise<AddEndRoleBuilder> {
        let builder = new AddEndRoleBuilder(client, group, lead);
        return builder;
    }
    client: SignifyClient;
    group: string;
    lead: string;
    _group: Promise<Identifier>;
    _lead: Promise<Identifier>;
    _members: Promise<MembersType>;
    constructor(client: SignifyClient, group: string, lead: string) {
        this.client = client;
        this.group = group;
        this.lead = lead;
        this._group = Identifier.create(client, group);
        this._lead = Identifier.create(client, lead);
        this._members = get_members(client, group);
    }
    static *getEids(members: MembersType) {
        for (let s of members.signing) {
            yield* Object.keys(s.ends.agent);
        }
    }
    async *buildAddEndRoleRequest(): AsyncGenerator<AddEndRoleRequest> {
        let members = await this._members;
        let stamp = date2string(new Date());
        for (let eid of AddEndRoleBuilder.getEids(members)) {
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
    async buildMultisigRpyRequest(addEndRoleRequest: AddEndRoleRequest, addEndRoleResponse: AddEndRoleResponse): Promise<MultisigRpyRequest> {
        let group = await this._group;
        let lead = await this._lead;
        let members = await this._members;
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
            sender: this.lead,
            topic: this.group,
            sender_id: lead.getIdentifier(),
            route: MULTISIG_RPY,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        return request;
    }
}
