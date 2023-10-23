import { debug_json, json2string } from "../src/util/helper";

interface RequestType {
    name?: string;
    prop1?: string;
    prop2?: string;
}

interface RequestArgs {
    prop1?: string;
    prop2?: string;
}

class RequestArgsImpl implements RequestArgs {
    prop1?: string;
    prop2?: string;
    constructor(request: RequestType) {
        this.prop1 = request.prop1;
        this.prop2 = request.prop2;
    }
}

interface Generic {
    a: any | undefined;
    b: any | undefined;
}

interface Specific extends Generic {
    a: string;
    b: string;
}

describe("JavaScript", () => {
    test("test1", () => {
        let request: RequestType = {
            name: "name",
            prop1: "prop1"
        }
        debug_json("RequestType", request);
        let args = new RequestArgsImpl(request);
        debug_json("RequestArgsImpl", args);
    })
    test("test2", () => {
        let g: Generic = {
            "a": "aa",
            "b": "bb"
        }
        let ga = g.a;
        let s: Specific = g;
        let sa = s.a;
    });
});
