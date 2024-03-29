import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { AGENT, AID, AddEndRoleRequest, AddEndRoleResponse, Group, GroupRpyRequest, IdentifierType, KeyStateType, MULTISIG_RPY, MembersType, MultisigRpyRequestEmbeds, MultisigRpyRequestPayload, SEAL_EVENT, SealEventType, get_name_by_identifier } from "./signify";
import { MultisigRpyRequest, NotificationType, get_rpy_requests } from "./signify";
import { date2string, debug_out } from "../util/helper";

export class AddEndRoleBuilder {
    /**
     * @param alias Name of new group
     */
    static async create(client: SignifyClient, alias?: string): Promise<AddEndRoleBuilder> {
        let builder = new AddEndRoleBuilder(client, alias);
        return builder;
    }
    client: SignifyClient;
    alias?: string;
    private _group?: Promise<Group>;
    constructor(client: SignifyClient, alias?: string) {
        this.client = client;
        this.alias = alias;
        this._group = undefined;
    }
    async getGroup(): Promise<Group | undefined> {
        if (this.alias === undefined) return undefined;
        return await (this._group ??= Group.create(this.client, this.alias));
    }
    async isLead(): Promise<boolean> {
        let group: Group | undefined = await this.getGroup();
        return (await group?.isLead()) ?? false;
    }
    async getEids(): Promise<AID[]> {
        let group: Group | undefined = await this.getGroup();
        if (group === undefined) throw new Error("AddEndRoleBuilder.getEids()");
        let members: MembersType = await group.getMembers();
        let res: AID[] = [];
        for (let s of members.signing ?? []) {
            for (let eid of Object.keys(s.ends.agent)) {
                res.push(eid as AID);
            }
        }
        return res;
    }
    async buildAddEndRoleRequest(): Promise<AddEndRoleRequest[]> {
        let res: AddEndRoleRequest[] = [];
        let stamp: string = date2string(new Date());
        for (let eid of await this.getEids()) {
            let request: AddEndRoleRequest = {
                alias: this.alias,
                role: AGENT,
                eid: eid,
                stamp: stamp
            };
            debug_out("buildAddEndRoleRequest", request, "AddEndRoleRequest");
            res.push(request);
        }
        return res;
    }
    async acceptGroupRpyNotification(notification: NotificationType): Promise<AddEndRoleRequest[]> {
        let res: AddEndRoleRequest[] = [];
        for (let rpy of await get_rpy_requests(this.client, notification)) {
            res.push(await this.acceptGroupRpyRequest(rpy));
        }
        return res;
    }
    async acceptGroupRpyRequest(rpy: GroupRpyRequest): Promise<AddEndRoleRequest> {
        let name: string = await get_name_by_identifier(this.client, rpy.exn.a.gid);
        let request: AddEndRoleRequest = {
            alias: name,
            role: rpy.exn.e.rpy.a.role,
            eid: rpy.exn.e.rpy.a.eid,
            stamp: rpy.exn.e.rpy.dt
        };
        debug_out("acceptGroupRpyRequest", request, "AddEndRoleRequest");
        return request;
    }
    async buildMultisigRpyRequest(addEndRoleRequest: AddEndRoleRequest, addEndRoleResponse: AddEndRoleResponse): Promise<MultisigRpyRequest> {
        let group: Group | undefined = await Group.create(this.client, addEndRoleRequest.alias!);
        if (group === undefined) throw new Error("AddEndRoleBuilder.buildMultisigRpyRequest()");
        let members: MembersType = await group.getMembers();
        let state: KeyStateType = await group.getKeyState();
        let lead: IdentifierType = group.getIdentifier().group!.mhab;
        let payload: MultisigRpyRequestPayload = {
            gid: state.i
        };
        let seal: SealEventType = [
            SEAL_EVENT,
            {
                i: state.i,
                s: state.ee.s,
                d: state.ee.d,
            }
        ];
        let sigers: Siger[] = addEndRoleResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims: string = d(messagize(addEndRoleResponse.serder, sigers, seal));
        let atc: string = ims.substring(addEndRoleResponse.serder.size);;
        let embeds: MultisigRpyRequestEmbeds = {
            rpy: [addEndRoleResponse.serder, atc]
        };
        let recipients = members.signing
            .map(i => i.aid)
            .filter(i => i !== lead.prefix);
        let request: MultisigRpyRequest = {
            sender: lead,
            topic: group.alias,
            route: MULTISIG_RPY,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        debug_out("buildMultisigRpyRequest", request, "MultisigRpyRequest");
        return request;
    }
}
