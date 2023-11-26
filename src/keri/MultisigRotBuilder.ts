import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { AID, Group, GroupRotRequest, IdentifierType, KeyStateType, MULTISIG_ROT, MultisigRotRequest, MultisigRotRequestEmbeds, MultisigRotRequestPayload, NotificationType, RotationRequest, RotationResponse, get_keyState, get_name_by_identifier, get_rot_request } from "./signify";
import { debug_out } from "../util/helper";

export class MultisigRotBuilder {
    static async create(client: SignifyClient) {
        let builder = new MultisigRotBuilder(client);
        return builder;
    }
    client: SignifyClient;
    constructor(client: SignifyClient) {
        this.client = client;
    }
    async buildMultisigRotRequest(rotationResponse: RotationResponse): Promise<MultisigRotRequest> {
        let group_name: string = await get_name_by_identifier(this.client, rotationResponse.serder.pre as AID);
        let group: Group = await Group.create(this.client, group_name)
        let sender: IdentifierType = group.getIdentifier().group?.mhab!;
        let smids: AID[] = group.members.signing.map(i => i.aid);
        let rmids: AID[] = group.members.rotation.map(i => i.aid);
        let payload: MultisigRotRequestPayload = {
            gid: group.getId(),
            smids: smids,
            rmids: rmids
        };
        let sigers: Siger[] = rotationResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims: string = d(messagize(rotationResponse.serder, sigers));
        let atc: string = ims.substring(rotationResponse.serder.size);
        let embeds: MultisigRotRequestEmbeds = {
            rot: [rotationResponse.serder, atc]
        };
        let recipients: AID[] = payload.smids!.filter(i => i !== sender.prefix);
        let request: MultisigRotRequest = {
            sender: sender,
            topic: group.alias,
            route: MULTISIG_ROT,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        debug_out("buildMultisigRotRequest", request, "MultisigRotRequest");
        return request;
    }
    async acceptGroupRotNotification(notification: NotificationType): Promise<[string, RotationRequest][]> {
        let res: [string, RotationRequest][] = [];
        for (let rot of await get_rot_request(this.client, notification)) {
            res.push(await this.acceptGroupRotRequest(rot));
        }
        return res;
    }
    async acceptGroupRotRequest(rot: GroupRotRequest): Promise<[string, RotationRequest]> {
        let name: string = await get_name_by_identifier(this.client, rot.exn.a.gid);
        let states: KeyStateType[] = await Promise.all(rot.exn.a.smids.map(i => get_keyState(this.client, i)));
        let rstates: KeyStateType[] = await Promise.all(rot.exn.a.rmids.map(i => get_keyState(this.client, i)));
        let rotRequest: RotationRequest = {
            // toad: rot.exn.e.rot.bt,
            // adds: rot.exn.e.rot.ba,
            // cuts: rot.exn.e.rot.br,
            states: states,
            rstates: rstates
        };
        let request: [string, RotationRequest] = [name, rotRequest];
        debug_out("acceptGroupRotRequest", request, "RotationRequest");
        return request;
    }
}
