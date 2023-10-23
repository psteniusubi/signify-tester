import { SignifyClient, Tier, ready } from "signify-ts";

export interface Configuration {
    admin: string,
    boot: string,
    toad: number,
    wits: string[]
}

const WITS_PUBLIC: string[] = [
    "BOyuCyHFluqsV0rAYLxJuBSY-ObuLSOL3RaCQdwN1aL0",
    "BJqgbfyC0ZLIOSLqYLtwrVYo44o-VMA4l5kX7Ooxe3y0",
    "BNAsMJ69E5kxnpzAQKDzDghZMdk3nr1-zosV22oXmQGw"
];
const KERIA_ADMIN_PUBLIC: string = "https://keri-admin.io.ubidemo1.com";
const KERIA_BOOT_PUBLIC: string = "https://keri-boot.io.ubidemo1.com";
const PUBLIC: Configuration = {
    admin: KERIA_ADMIN_PUBLIC,
    boot: KERIA_BOOT_PUBLIC,
    toad: WITS_PUBLIC.length,
    wits: WITS_PUBLIC
}

const WITS_LOCAL: string[] = [
    "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
    "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
    "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"
];
const KERIA_ADMIN_LOCAL: string = "http://localhost:3901";
const KERIA_BOOT_LOCAL: string = "http://localhost:3903";
const LOCAL: Configuration = {
    admin: KERIA_ADMIN_LOCAL,
    boot: KERIA_BOOT_LOCAL,
    toad: WITS_LOCAL.length,
    wits: WITS_LOCAL
}

export function getLocalConfig(): Configuration { return LOCAL; }

export function getPublicConfig(): Configuration { return PUBLIC; }

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