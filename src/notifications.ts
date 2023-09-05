import { sleep } from "./helper";
import { signify } from "./client";

export async function load_notifications(): Promise<void> {
    const div = document.querySelector("#notifications div") as HTMLDivElement;
    while (true) {
        div.innerText = "";
        if (signify !== null) {
            let list = await signify.notifications().list();
            div.innerText = JSON.stringify(list, undefined, 2);
        }
        await sleep(2500);
    }
}
