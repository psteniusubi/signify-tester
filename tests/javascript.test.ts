import { json2string } from "../src/util/helper";

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

describe("JavaScript", () => {
    test("test1", () => {
        let request: RequestType = {
            name: "name",
            prop1: "prop1"
        }
        console.log(json2string(request));
        let args = new RequestArgsImpl(request);
        console.log(json2string(args));
    })
});
