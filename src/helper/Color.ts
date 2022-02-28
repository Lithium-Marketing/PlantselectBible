import {computed, Ref} from "vue";
import {ContextMenu} from "@/helper/ContextMenu";
import {MyServices} from "@/config/dataConfig";

export interface ColorInfo {
	table: string,
	field: string,
	entityId: any
}

export function colorMenu(services: MyServices,elem: Ref<HTMLElement>,colorInfo: ColorInfo | undefined){
	const color = computed<string>({
		get() {
			return services.data.tables[colorInfo?.table]?.value[colorInfo?.entityId]?.[colorInfo?.field]
		},
		set(val) {
			services.modification.mod("manual", {
				table: colorInfo.table,
				field: colorInfo.field,
				id: colorInfo.entityId,
				val
			}, "Changement de couleur")
		}
	});
	
	ContextMenu.addInSetup((x, y) => {
		if (!colorInfo || !elem.value)
			return false;
		
		const rect = elem.value.getBoundingClientRect();
		if (rect.left < x && rect.right > x && rect.top < y && rect.bottom > y) {
			window.electronAPI.colorMenu(color.value, x, y).then((newColor) => newColor!==false && (color.value = newColor));
			return true;
		}
		return false;
	});
	
	return color;
}
