import {BaseService} from "@/helper/baseService";
import {Schema, SchemaField} from "@/services/dataService";
import {format} from 'sql-formatter';
import {LogService} from "@/services/logService";
import {TableConfig, TableConfigs, TablesDef} from "@/services/index";

const logger = LogService.logger({name: "SaveService"});

export class SaveService<T extends TablesDef, C extends TableConfigs<T>> extends BaseService<T, C, any> {
    
    public apply() {
        const sqls = [];
        
        logger.log(format(sqls.reduce((a, v) => {
            return a + v + ";";
        }, ""), {
            linesBetweenQueries: 3,
            uppercase: true
        }));
    }
    
}

function quote(v: any, def: SchemaField<any>) {
    const type = def.Type.split("(")[0];
    switch (type) {
        case "bigint":
        case "int":
            return v ? parseInt(v) : def.Default;
        case "decimal":
            return v ? parseFloat(v) : def.Default;
        case "text":
        default:
            return v ? `"${v?.toString()}"` : 'NULL';
    }
}
