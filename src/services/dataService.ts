import {Services, TableConfigs, TablesDef} from "@/services/index";
import {persistentStorage} from "@/helper/PersistentStorage";
import {computed, ComputedRef, watchEffect, WritableComputedRef} from "vue";
import {createPool, Pool, PoolOptions, RowDataPacket} from "mysql2/promise";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "DataService"})

type IndexesByTable<T extends TablesDef, C extends TableConfigs<T>> = {
	[name in keyof T]: {
		[index in C[name]["indexes"][number]]: ComputedRef<Record<number, number[] | undefined>>
	}
}

export interface SchemaField<K extends string> {
	Field: K
	Type: string
	Null: boolean,
	Key: string,
	Default: any | null | undefined,
	Extra: string
}

export type Schema = {
	[key: string]: SchemaField<typeof key>
}

export class DataService<T extends TablesDef, C extends TableConfigs<T>> {
	private readonly services: Services<T, C, any>;
	
	public readonly mysqlLogin: WritableComputedRef<PoolOptions>;
	public conn: Pool;
	
	private readonly tablesName: string[];
	private readonly tablesConfig: C;
	
	public readonly raw: { [table in keyof T]: WritableComputedRef<Record<number, T[table]>> };
	public readonly tables: { [table in keyof T]: ComputedRef<Record<number, T[table]>> };
	
	
	//private readonly tablesRaw: Record<keyof T, WritableComputedRef<any[]>>;
	private readonly tablesSchema: Record<keyof T, WritableComputedRef<Schema>>;
	public readonly indexesByTable: IndexesByTable<T, C>;//TODO add reactivity
	
	private readonly tableDefault: ComputedRef<Record<keyof T, any>>;
	
	constructor(services: Services<T, C, any>, tables: C) {
		this.services = services;
		
		this.mysqlLogin = persistentStorage<PoolOptions>("mysqlLogin", {});
		watchEffect(() => {
			this.conn = createPool(Object.assign({namedPlaceholders: true}, this.mysqlLogin.value));
		});
		
		this.tablesName = Object.keys(tables);
		this.tablesConfig = tables;
		
		this.raw = Object.keys(tables).reduce((a, t) => {
			const cache = persistentStorage("raw:" + t, {});
			a[t as keyof T] = computed({
				get() {
					return Object.freeze(cache.value);
				},
				set(val) {
					cache.value = val;
				}
			});
			return a;
		}, {} as Record<keyof T, WritableComputedRef<Record<number, any>>>);
		
		this.tables = Object.keys(tables).reduce((a, table) => {
			a[table as keyof T] = computed(() => {//add all modifications to all rows of the table (heavy)
				const result = {};
				for (const id in this.raw[table].value) {
					if (this.services.modification.mods[table][id]) {
						const obj = result[id] = {...this.raw[table].value[id]};
						Object.entries(this.services.modification.mods[table][id]).forEach(([key, value]) => {
							obj[key as keyof T[string]] = value;
						});
						Object.freeze(obj);
					} else
						result[id] = this.raw[table].value[id];
				}
				
				Object.entries(this.services.modification.mods[table]).forEach(([id, val]) => {
					if (this.raw[table].value[id])
						return;
					
					result[id] = Object.freeze(Object.assign({}, val));
				})
				
				return result;
			});
			return a;
		}, {} as Record<keyof T, ComputedRef<Record<number, any>>>)


		//this.tablesRaw = this._initRawDatas();
		this.tablesSchema = this._initSchema();

		this.indexesByTable = Object.keys(tables).reduce((a, t) => {
			const table = t as keyof T;
			a[t] = {};
			this.tablesConfig[table].indexes?.forEach(index => {
				logger.debug("table index init", table, index);
				a[t][index] = computed(() => {
					logger.time(`index ${table} . ${index}`);
					try {
						const tableData = this.tables[table].value;
						return Object.entries(tableData).reduce((a, [id, entity]) => {
							a[entity[index]] = a[entity[index]] || [];
							a[entity[index]].push(id);
							return a;
						}, {})
					} finally {
						logger.timeEnd(`index ${table} . ${index}`)
					}
				})
			});
			return a;
		}, {}) as IndexesByTable<T, C>;
		
		
		this.tableDefault = computed(() => {
			return Object.entries(this.tablesSchema).reduce((a, v) => {
				a[v[0] as keyof T] = Object.values(v[1].value).reduce((a, v) => {
					a[v.Field] = v.Default;
					return a;
				}, {} as any)
				return a;
			}, {} as Record<keyof T, any>);
		})
	}
	
	private _initSchema() {
		const datas = {}
		for (const table of this.tablesName) {
			datas[table] = persistentStorage("schema:" + table, {});
		}
		return datas as Record<keyof T, WritableComputedRef<Schema>>;
	}
	
	refresh(table: keyof T | true = true) {
		const promises: Promise<unknown>[] = [];
		
		const refresh = (table: keyof T) => {
			const promise = (async () => {
				this.tablesSchema[table].value = await this.refreshSchema(table);
				
				const sql = this.tablesConfig[table].sql ?? `SELECT * FROM ${table}`;

				logger.log(table, this.tablesConfig[table]);
				const register = (() => {
					const key = this.tablesConfig[table].key;
					if (key && key.indexOf(",") !== -1) {
						const keys = key.split(",");
						return (a, v) => {
							a[keys.map(k => v[k]).join(",")] = v;
							return a;
						};
					}
					return (a, v) => {
						a[v[key ?? "ID"]] = v
						return a;
					};
				})();
				
				const result = ((await this.conn.query(sql))[0] as any[]).reduce(register, {});

				
				this.raw[table as keyof T].value = result;
				
				logger.log(table, Object.entries(result).length);
			})();
			promises.push(promise);
			this.services.job.add(promise, "Downloading data from " + table)
		}
		
		if (table !== true)
			refresh(table);
		else
			for (const table of this.tablesName)
				refresh(table);
		return Promise.all(promises);
	}
	
	private async refreshSchema(table: keyof T) {
		const sql = `show columns from ${table}`;
		const result = (await this.conn.execute(sql))[0] as RowDataPacket[];
		
		return result.reduce((a, v) => {
			a[v.Field] = {
				...v,
				Field: v.Field,
				Null: v.Null === 'yes',
				Type: v.Type,
				Key: v.Key,
				Default: v.Default,
				Extra: v.Extra
			};
			return a;
		}, {} as Schema);
	}
	
	getSchema(table: T) {
		return computed(() => {
			return this.tablesSchema[table as any].value;
		})
	}
	
	private readonly getCache: Record<any, WeakRef<any>> = {};
	
	get<K extends keyof T>(table: K, id: number, field: string): WritableComputedRef<any>;
	get<K extends keyof T>(table: K, id: number): ComputedRef<T[K]>;
	get<K extends keyof T>(table: K): ComputedRef<Record<number, T[K]>>;
	
	get<K extends keyof T>(table: K, id?: number, field?: string) {
		if (field !== undefined)
			throw new Error("Not Implemented")
		if (id !== undefined)
			return this.getCache[table + ":::" + id]?.deref() ?? (this.getCache[table + ":::" + id] = new WeakRef(computed(() => {//add modification to the row of the table
				return this.tables[table].value[id];
			}))).deref();
		else
			return this.tables[table];
	}
	
	getByIndex<K extends keyof T>(table: K, index: keyof IndexesByTable<T, C>[K], id: number): ComputedRef<number[] | undefined>;
	getByIndex<K extends keyof T>(table: K, index: keyof IndexesByTable<T, C>[K]): ComputedRef<Record<number, number[] | undefined>>;
	
	getByIndex<K extends keyof T>(table: K, index: keyof IndexesByTable<T, C>[K], id?: number) {
		if (id !== undefined)
			return computed(() => this.indexesByTable[table][index].value[id]); else
			return computed(() => this.indexesByTable[table][index].value || {});
	}
}

function sleep(time: number) {
	return new Promise(resolve => setTimeout(resolve, time));
}
