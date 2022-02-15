import {MyServices, MyTablesDef} from "@/config/dataConfig";
import {BaseMod, Operations} from "@/services/ModificationService";

type Payload<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]> = {
    table: T,
    id: any
}

function genId(p: Payload<any, any>, i = p.id) {
    return `delete:${p.table}:${i}`;
}

export class Delete implements BaseMod<Payload<any, any>, MyServices, MyTablesDef> {
    
    getId(payload: Payload<any, any>, services: MyServices): string {
        return genId(payload);
    }
    
    apply<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]>(payload: Payload<T, F>, services: MyServices, op: Operations<MyTablesDef>) {
        
        op.del(payload.table, payload.id);
        
        return genId(payload);
    }
    
}
