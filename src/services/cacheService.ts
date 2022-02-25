import {Services} from "@/services/index";
import {computed, ComputedRef} from "vue";

export type CacheDef<S extends Services<any, any, any>> = { [name: string]: (services: S) => any }

type cacheType<C extends CacheDef<S>, S extends Services<any, any, any>> = { [name in keyof C]: ComputedRef<ReturnType<C[name]>> };

export class CacheService<C extends CacheDef<S>, S extends Services<any, any, any>> {
	private readonly services: S;
	
	public readonly caches: cacheType<C, S>;
	
	constructor(services: S, caches: C) {
		this.services = services;
		this.caches = Object.entries(caches).reduce((a, v) => {
			a[v[0]] = computed(() => v[1](services));
			return a;
		}, {}) as cacheType<C, S>;
		Object.freeze(this.caches);
	}
	
}
