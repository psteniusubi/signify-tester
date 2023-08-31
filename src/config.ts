const WITS_PUBLIC: string[] = [
    "BMwi0qCA499qYI7bU95PKYb5HCHYQpqCzTU2KfBrUF4A",
    "BNIekMfCpuvISWeqzXLuI9rcsm79u67aBtOShacvzbJM",
    "BAe5X1Ey4VMeGrb37VRooSX8QpHkUZQaqdCT2ibQS-Lo"
];
const KERIA_HOSTNAME_PUBLIC: string = "10.44.1.71";

const WITS_LOCAL: string[] = [
    "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
    "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
    "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX"
];
const KERIA_HOSTNAME_LOCAL: string = "localhost";

let _WITS: string[];
let _KERIA_HOSTNAME: string;

let url = new URL(import.meta.url);
switch (url.hostname) {
    case "localhost":
        _WITS = WITS_LOCAL;
        _KERIA_HOSTNAME = KERIA_HOSTNAME_LOCAL;
        break;
    default:
        _WITS = WITS_PUBLIC;
        _KERIA_HOSTNAME = KERIA_HOSTNAME_PUBLIC;
        break;
}

export const WITS = _WITS;
export const KERIA_HOSTNAME = _KERIA_HOSTNAME;
