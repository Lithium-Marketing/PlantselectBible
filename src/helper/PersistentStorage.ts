import {computed, ComputedRef, ref, WritableComputedRef} from "vue";

const cache: any = {};

export function persistentStorage<T>(name: string, def?: T): WritableComputedRef<T> {
    if (cache[name])
        return cache[name];
    
    let _value = ref(localStorage.getItem(name));
    
    const c = computed<T>({
        get() {
            return _value.value ? JSON.parse(_value.value) : def;
        },
        set(val) {
            const str = JSON.stringify(val);
            _value.value = str;
            try{
                localStorage.setItem(name, str);
            }catch (e) {
                localStorage.removeItem(name);
            }
        }
    });
    
    cache[name] = c;
    
    return c;
}
