import {ComputedRef} from "vue";

export function loadWhenIdle(ref: ComputedRef, name) {
    // @ts-ignore //TODO remove ts-ignore
    window.requestIdleCallback(({timeRemaining}) => {
        console.groupCollapsed(`requestIdleCallback ${name}`)
        console.time(`requestIdleCallback ${name}`)
        try {
            ref.value
        } finally {
            console.timeEnd(`requestIdleCallback ${name}`)
            console.groupEnd()
        }
    });
}
