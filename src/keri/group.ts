import { SignifyClient } from 'signify-ts';

export interface GroupRequestType {
    exn: GroupExchangeType;
    paths: {
        icp: string
    }
}

export interface GroupExchangeType {
    t: string;
    i: string;
    r: string;
    a: {
        gid: string;
        smids: string[],
        rmids: string[]
    }
    e: {
        icp: {
            kt: string | number | string[],
            nt: string | number | string[],
            bt: string,
            b: string[]
        }
        d: string;
    }
    // [property: string]: any;
}

export async function get_group_request(client: SignifyClient, id: string): Promise<GroupRequestType[]> {
    let res: GroupRequestType[] = await client.groups().getRequest(id);
    return res;
}
