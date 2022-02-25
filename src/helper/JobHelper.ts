import {ComputedRef} from "vue";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "JobHelper"})

export function loadWhenIdle(ref: ComputedRef, name) {
	// @ts-ignore //TODO remove ts-ignore
	window.requestIdleCallback(({timeRemaining}) => {
		logger.group(`requestIdleCallback ${name}`)
		logger.time(`requestIdleCallback ${name}`)
		try {
			ref.value
		} finally {
			logger.timeEnd(`requestIdleCallback ${name}`)
			logger.groupEnd()
		}
	});
}
