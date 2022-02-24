import {MyServices, MyTablesDef} from "@/config/dataConfig";
import {BaseMod, Operations} from "@/services/ModificationService";

type Payload<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]> = {
    table: T,
    field: F,
    id?: number,
    val: any,
    createInfo?: Partial<MyTablesDef[T]>
}

function genId(p: Payload<any, any>, i = p.id) {
    return `manual:${p.table}:${p.field}:${i}`;
}

export class Manual implements BaseMod<Payload<any, any>, MyServices, MyTablesDef> {
    
    getId(payload: Payload<any, any>, services: MyServices) {
        return payload.id !== undefined ? genId(payload) : false;
    }
    
    apply<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]>(payload: Payload<T, F>, services: MyServices, op: Operations<MyTablesDef>) {
        const id = payload.id ?? services.modification.createId();
        
        if ((payload.id === undefined || payload.id < 0) && payload.createInfo)
            Object.entries(payload.createInfo).forEach(([f, v]) => op.mod(payload.table, f, id, v))
        
        op.mod(payload.table, payload.field, id, payload.val);
        
        return genId(payload, id);
    }
    
}
