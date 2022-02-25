import {onMounted, onUnmounted} from "vue";

export class ContextMenu {
	
	private static cnt = 0;
	private static elems: Record<any, (x, y) => boolean> = {};
	
	private static initialized = false;
	
	static init() {
		if (this.initialized)
			throw new Error();
		this.initialized = true;
		
		window.addEventListener('contextmenu', (e) => {
			e.preventDefault()
			const elems = Object.values(this.elems);
			for (const elem of elems) {
				if (elem(e.x, e.y))
					return;
			}
		})
	}
	
	static add(fn: (x, y) => boolean): () => void {
		const id = this.cnt++;
		this.elems[id] = fn;
		return () => {
			delete this.elems[id];
		}
	}
	
	static addInSetup(fn: (x, y) => boolean) {
		let unregister = () => {
		};
		onMounted(() => {
			unregister = this.add(fn)
		});
		
		onUnmounted(() => {
			unregister();
		});
	}
}
