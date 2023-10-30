import { SignifyClient, Tier, ready } from "signify-ts";
import { AID } from "./primitives";

export const NAME1 = "name1";
export const CONTACT1 = "contact1";
export const CONTACT2 = "contact2";
export const CONTACT3 = "contact3";
export const GROUP1 = "group1";

export interface Configuration {
    admin: string,
    boot: string,
    toad: number,
    wits: AID[]
}

const WITS_PUBLIC: AID[] = [
    "BOyuCyHFluqsV0rAYLxJuBSY-ObuLSOL3RaCQdwN1aL0" as AID,
    "BJqgbfyC0ZLIOSLqYLtwrVYo44o-VMA4l5kX7Ooxe3y0" as AID,
    "BNAsMJ69E5kxnpzAQKDzDghZMdk3nr1-zosV22oXmQGw" as AID
];
const KERIA_ADMIN_PUBLIC: string = "https://keri-admin.io.ubidemo1.com";
const KERIA_BOOT_PUBLIC: string = "https://keri-boot.io.ubidemo1.com";
const PUBLIC: Configuration = {
    admin: KERIA_ADMIN_PUBLIC,
    boot: KERIA_BOOT_PUBLIC,
    toad: WITS_PUBLIC.length,
    wits: WITS_PUBLIC
}

const WITS_LOCAL: AID[] = [
    "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha" as AID,
    "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM" as AID,
    "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX" as AID
];
const KERIA_ADMIN_LOCAL: string = "http://localhost:3901";
const KERIA_BOOT_LOCAL: string = "http://localhost:3903";
const LOCAL: Configuration = {
    admin: KERIA_ADMIN_LOCAL,
    boot: KERIA_BOOT_LOCAL,
    toad: WITS_LOCAL.length,
    wits: WITS_LOCAL
}

export async function getLocalConfig(): Promise<Configuration> { return LOCAL; }

export async function getPublicConfig(): Promise<Configuration> { return PUBLIC; }

export async function create_client(config: Configuration, bran: string): Promise<SignifyClient> {
    await ready();
    const client = new SignifyClient(config.admin, bran.padEnd(21, "_"), Tier.low, config.boot);
    return client;
}

export async function connect_or_boot(config: Configuration, bran: string): Promise<SignifyClient> {
    const client = await create_client(config, bran);
    try {
        await client.connect();
    } catch {
        let res = await client.boot();
        if (!res.ok) throw new Error(`SignifyClient: ${res.status} ${res.statusText}: ${config.admin}`);
        await client.connect();
    }
    return client;
}