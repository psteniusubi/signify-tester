import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { AID, Group, GroupIxnRequest, IdentifierType, InteractionRequest, InteractionResponse, MULTISIG_IXN, MultisigIxnRequest, MultisigIxnRequestEmbeds, MultisigIxnRequestPayload, NotificationType, get_ixn_requests, get_name_by_identifier } from "./signify";
import { debug_out } from "../util/helper";

export class MultisigIxnBuilder {
    static async create(client: SignifyClient) {
        let builder = new MultisigIxnBuilder(client);
        return builder;
    }
    client: SignifyClient;
    constructor(client: SignifyClient) {
        this.client = client;
    }
    async buildMultisigIxnRequest(interactionResponse: InteractionResponse): Promise<MultisigIxnRequest> {
        let group_name: string = await get_name_by_identifier(this.client, interactionResponse.serder.pre as AID);
        let group: Group = await Group.create(this.client, group_name)
        let sender: IdentifierType = group.getIdentifier().group?.mhab!;
        let smids: AID[] = group.members.signing.map(i => i.aid);
        let rmids: AID[] = group.members.rotation.map(i => i.aid);
        let payload: MultisigIxnRequestPayload = {
            gid: group.getId(),
            smids: smids,
            rmids: rmids
        };
        let sigers: Siger[] = interactionResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims: string = d(messagize(interactionResponse.serder, sigers));
        let atc: string = ims.substring(interactionResponse.serder.size);
        let embeds: MultisigIxnRequestEmbeds = {
            ixn: [interactionResponse.serder, atc]
        };
        let recipients: AID[] = payload.smids!.filter(i => i !== sender.prefix);
        let request: MultisigIxnRequest = {
            sender: sender,
            topic: group.alias,
            route: MULTISIG_IXN,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        debug_out("buildMultisigIxnRequest", request, "MultisigIxnRequest");
        return request;
    }
    async acceptGroupIxnNotification(notification: NotificationType): Promise<[string, InteractionRequest][]> {
        let res: [string, InteractionRequest][] = [];
        for (let ixn of await get_ixn_requests(this.client, notification)) {
            res.push(await this.acceptGroupIxnRequest(ixn));
        }
        return res;
    }
    async acceptGroupIxnRequest(ixn: GroupIxnRequest): Promise<[string, InteractionRequest]> {
        let name = await get_name_by_identifier(this.client, ixn.exn.a.gid);
        let request: [string, InteractionRequest] = [name, ixn.exn.e.ixn.a];
        debug_out("acceptGroupIxnRequest", request, "InteractionRequest");
        return request;
    }
}
