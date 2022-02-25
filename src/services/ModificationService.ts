import {Services, TableConfigs, TablesDef} from "@/services/index";
import {reactive, WritableComputedRef} from "vue";
import {persistentStorage} from "@/helper/PersistentStorage";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "ModificationService"})

type ModDict<T extends TablesDef> = {
	[table in keyof T]: {
		[id: number]: {
			[key in keyof T[table]]?: T[table][key]
		}
	}//Record<number, Partial<Record<keyof T[table], any>>>
}

export interface BaseMod<P, S extends Services<T, any, any>, T extends TablesDef> {
	
	getId(payload: P, services: S): string | false;
	
	apply(payload: P, services: S, op: Operations<T>): string;
	
}

export type ToModifications<S extends Services<T, any, any>, T extends TablesDef, M extends Modifications<any, S, T>> = {
	[name in keyof M]: Parameters<M[name]["apply"]>[0];
}

export type Modifications<M, S extends Services<T, any, any>, T extends TablesDef> = {
	[name in keyof M]: BaseMod<M[name], S, T>
};

type RawMod<M, N extends keyof M> = {
	id: string,
	name: N,
	desc: string,
	payload: M[N]
}

export interface Operations<D extends TablesDef> {
	mod<T extends keyof D, F extends keyof D[T]>(table: T, field: F, id: any, val: D[T][F])
	
	del<T extends keyof D>(table: T, id: any)
}

const genCreatedId = function* () {
	while (true) {
		let cnt = -1;
		while (!(yield cnt--)) ;
		yield;
	}
}

export class ModificationService<T extends TablesDef, C extends TableConfigs<T>, M> {
	
	private readonly services: Services<T, C, M>;
	private readonly modifications: Modifications<M, Services<T, C, M>, T>;
	
	private readonly _createdId = genCreatedId();
	public readonly createId = (() => this._createdId.next().value) as () => number;
	
	public readonly mods: ModDict<T>;
	
	public readonly raw: RawMod<M, keyof M>[]
	private rawStorage: WritableComputedRef<RawMod<M, keyof M>[]>;
	
	constructor(services: Services<T, C, M>, tables: C, modifications: Modifications<M, Services<T, C, M>, T>) {
		this.services = services;
		this.modifications = modifications;
		
		this.mods = reactive(Object.keys(tables).reduce((a, t) => {
			a[t] = {};
			return a;
		}, {})) as ModDict<T>;
		
		this.raw = reactive([]);
		this.rawStorage = persistentStorage("modRaw", []);
	}
	
	mod<K extends keyof M>(modName: K, payload: M[K], desc: string) {
		this._mod(modName, payload, desc);
		this.save();
	}
	
	private _mod<K extends keyof M>(modName: K, payload: M[K], desc: string) {
		logger.trace("mod", modName, payload, desc);
		
		if (!this.modifications[modName])
			return false;
		
		const todos = {
			mods: [],
			dels: []
		}
		const op = {
			mod(t, f, i, v) {
				todos.mods.push({t, f, i, v})
			},
			del(t, i) {
				todos.dels.push({t, i})
			}
		};
		
		let id = this.modifications[modName].apply(payload, this.services, op);
		
		todos.mods.forEach(({t, f, i, v}) => {
			this.mods[t][i] = {
				...this.mods[t][i],
				[f]: v
			};
		});
		
		todos.dels.forEach(({t, i}) => {
			delete this.mods[t][i];
		});
		
		if (id)
			this.raw.push({
				id: id,
				payload: payload,
				name: modName,
				desc
			});
		else
			logger.warn("Could not apply modification")
	}
	
	removeAll() {
		this.raw.length = 0;
		this.reapply();
	}
	
	public reapply() {
		Object.keys(this.services.tables).forEach(table => {
			this.mods[table as keyof T] = {};
		});
		console.log(this._createdId.next(true))
		
		const raw = this.fragmentedRaw();
		
		this.raw.length = 0;
		
		raw.forEach((mod) => {
			this._mod(mod.name, mod.payload, mod.desc);
		});
		
		this.save();
	}
	
	private fragmentedRaw() {
		return this.raw.filter((v1, i1) => !this.raw.find((v2, i2) => i1 < i2 && v1.id === v2.id));
	}
	
	public save() {
		console.log("--- raw saved ---");
		this.rawStorage.value = this.fragmentedRaw();
	}
	
	public load() {
		this.raw.length = 0;
		this.rawStorage.value.forEach((mod) => {
			this._mod(mod.name, mod.payload, mod.desc);
		});
		this.save();
	}
	
	public toJSON() {
		this.reapply();
		return JSON.stringify(this.raw);
	}
	
	public fromJSON(raw: string) {
		this.removeAll();
		
		const rawP: RawMod<any, any>[] = JSON.parse(raw);
		rawP.forEach((mod) => {
			this._mod(mod.name, mod.payload, mod.desc);
		});
		this.save();
	}
}
