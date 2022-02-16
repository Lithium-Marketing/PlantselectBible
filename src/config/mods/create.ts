import {MyServices, MyTablesDef} from "@/config/dataConfig";
import {BaseMod, Operations} from "@/services/ModificationService";

type Payload<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]> = {
    table: T,
    createInfo: Partial<MyTablesDef[T]>
}

function genId(p: Payload<any, any>, i) {
    return `create:${p.table}:${i}`;
}

export class Create implements BaseMod<Payload<any, any>, MyServices, MyTablesDef> {
    
    getId(payload: Payload<any, any>, services: MyServices): false {
        return false;
    }
    
    apply<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]>(payload: Payload<T, F>, services: MyServices, op: Operations<MyTablesDef>) {
        const id = services.modification.createId();
        
        Object.entries(payload.createInfo).forEach(([f, v]) => op.mod(payload.table, f, id, v))
        
        return genId(payload, id);
    }
    
}
