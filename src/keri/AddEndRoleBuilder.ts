import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { AGENT, AID, AddEndRoleRequest, AddEndRoleResponse, Group, GroupRpyRequest, MULTISIG_RPY, MultisigRpyRequestEmbeds, MultisigRpyRequestPayload, get_name_by_identifier } from "./signify";
import { MultisigRpyRequest, NotificationType, get_rpy_request } from "./signify";
import { date2string } from "../util/helper";

export class AddEndRoleBuilder {
    /**
     * @param group Name of new group
     */
    static async create(client: SignifyClient, group?: string): Promise<AddEndRoleBuilder> {
        let builder = new AddEndRoleBuilder(client, group);
        return builder;
    }
    client: SignifyClient;
    group?: string;
    _group?: Promise<Group>;
    constructor(client: SignifyClient, group?: string) {
        this.client = client;
        this.group = group;
        this._group = (group !== undefined) ? Group.create(client, group) : undefined;
    }
    async isLead(): Promise<boolean> {
        let group = await this._group;
        return group?.isLead() ?? false;
    }
    async *getEids(): AsyncGenerator<AID> {
        if (this._group === undefined) return;
        let group = await this._group;
        for (let s of group.members.signing) {
            for (let eid of Object.keys(s.ends.agent)) {
                yield eid as AID;
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
    async *acceptGroupRpyNotification(notification: NotificationType): AsyncGenerator<AddEndRoleRequest> {
        for (let rpy of await get_rpy_request(this.client, notification)) {
            yield await this.acceptGroupRpyRequest(rpy);
        }
    }
    async acceptGroupRpyRequest(rpy: GroupRpyRequest): Promise<AddEndRoleRequest> {
        let name = await get_name_by_identifier(this.client, rpy.exn.a.gid);
        let request: AddEndRoleRequest = {
            alias: name,
            role: rpy.exn.e.rpy.a.role,
            eid: rpy.exn.e.rpy.a.eid,
            stamp: rpy.exn.e.rpy.dt
        };
        return request;
    }
    async buildMultisigRpyRequest(addEndRoleRequest: AddEndRoleRequest, addEndRoleResponse: AddEndRoleResponse): Promise<MultisigRpyRequest> {
        let group = await this._group ?? await Group.create(this.client, addEndRoleRequest.alias!);
        let lead = group.getIdentifier().group!.mhab;
        let payload: MultisigRpyRequestPayload = {
            gid: group.getId()
        };
        let seal = [
            "SealEvent",
            {
                i: group.getId(),
                s: group.getIdentifier().state!.ee.s,
                d: group.getIdentifier().state!.ee.d,
            }
        ];
        let sigers = addEndRoleResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims = d(messagize(addEndRoleResponse.serder, sigers, seal));
        let atc = ims.substring(addEndRoleResponse.serder.size);;
        let embeds: MultisigRpyRequestEmbeds = {
            rpy: [addEndRoleResponse.serder, atc]
        };
        let recipients = group.members.signing
            .map(i => i.aid)
            .filter(i => i !== lead.prefix);
        let request: MultisigRpyRequest = {
            sender: lead.name,
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
