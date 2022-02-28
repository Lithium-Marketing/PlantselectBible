import {Services, ServicesPlugin, TablesDef, useServices} from "@/services";
import {ToModifications} from "@/services/ModificationService";
import {PriceCalc} from "@/config/mods/priceCalc";
import {Manual} from "@/config/mods/manual";
import {computed, ComputedRef} from "vue";
import moment from "moment";
import {Create} from "@/config/mods/create";
import {Delete} from "@/config/mods/delete";

export type MyServices = Services<MyTablesDef, MyTablesConfig, MyModifications, MyCacheDef>;

export function createMyServices() {
	return ServicesPlugin(tablesConfig, modifications, caches);
}

export function useMyServices(): MyServices {
	return useServices()
}

const modifications = {
	priceCalc: new PriceCalc(),
	manual: new Manual(),
	create: new Create(),
	delete: new Delete(),
} as const;
export type MyModifications = ToModifications<MyServices, MyTablesDef, typeof modifications>;

const tablesConfig = {
	achats_futur: {
		indexes: ["matiere"]
	},
	Archive: {
		key: "id"
	},
	bible: {
		indexes: ["Produit", "OA"]
	},
	// bible_saves: {},
	// clients: {},
	clients_commandes: {},
	clients_commandes_produits: {
		indexes: ["Produit"]
	},
	clients_previsions: {
		indexes: ["Produit", "Client"]
	},
	// clients_prix_details: {},
	commandes: {},
	currency_rates: {
		key: "from,to"
	},
	// empotages: {},
	fournisseurs: {},
	// groups: {},
	InventaireBase: {},
	InventaireBaseEntry: {},
	matieres_premieres: {
		indexes: ["Produit"]
	},
	// mort: {},
	ordres_assemblages: {
		indexes: ["Matiere_premiere", "Produit"]
	},
	prix: {},
	produits: {},
	produits_prix: {
		indexes: ["Produit_ID"]
	},
	// receptions: {},
	// settings: {},
	// utilisateurs: {},
	vue_inventaire: {}
} as const;
export type MyTablesConfig = typeof tablesConfig;

export interface MyTablesDef extends TablesDef {
	achats_futur: {
		ID
		qty
		matiere
		reception
		color
	}
	Archive
	bible: {
		ID
		OA
		Quantite
		Note
		Color
		Produit
		Vendant
		prixC
	}
	// bible_saves
	// clients
	clients_commandes
	clients_commandes_produits
	clients_previsions: {
		ID
		Client
		Quantite
		Produit
		Date
		Date_Modification
		Creator
		Visible
	}
	// clients_prix_details
	commandes: {
		Date
		Date_Modification
		Oas
		Fournisseur
		Date_commande
		Parent
		Position
		Visible
		Creator
		ID
		Code
	}
	currency_rates: {
		from
		to
		rate
		date
	}
	// empotages
	fournisseurs: {
		Date
		Date_Modification
		Titre
		Abbreviation
		Adresse
		Ville
		Province
		Code_postal
		Pays
		Telephone
		Telephone_2
		Courriel
		Transport
		Parent
		Position
		Visible
		Creator
		ID
		Code
		Num
		Currency
	}
	// groups
	InventaireBase
	InventaireBaseEntry
	matieres_premieres: {
		Date
		Date_Modification
		Code
		Fournisseur
		Format
		Finition
		Prix
		Equivalences
		Parent
		Position
		Visible
		Creator
		ID
		Produit
		pw
	}
	// mort
	ordres_assemblages: {
		Date
		Date_Modification
		Recette
		Quantite_produire
		Quantite_recevoir
		Quantite_recu
		Date_reception
		Quantite_attente
		Inventaire
		Etiquette
		Statut
		Parent
		Position
		Visible
		Creator
		ID
		Quantite_toorder
		Produit
		Matiere_premiere
		Equivalence
		_Quantite_toorder
		Code
		EtiquetteText
		Commande
		Color
	}
	prix: {
		Date
		Date_Modification
		Titre
		Parent
		Position
		Visible
		Creator
		ID
	}
	produits: {
		Date
		Date_Modification
		Image
		Code
		Variete
		Format
		Description_fr
		Description_en
		Hauteur_fr
		Hauteur_en
		Largeur_fr
		Largeur_en
		Floraison_fr
		Floraison_en
		Exposition_fr
		Exposition_en
		Rusticite
		Information_fr
		Information_en
		Catalogue
		Disponibilites
		Codebar
		Etiquette
		Parent
		Position
		Visible
		Creator
		ID
		Unite
		Bouton
		Fleur
		Coup_de_coeur
		Localisation
		Inventaire
		Color
		Type
		Active
		Amel
		Soleil
		VarieteE
		CultivarE
		Pictograme
		Emplacement
		Prevision
		EnReservation
		Nouveau
		Modifier
		Valeur
		Color_Inv
		Color_A0
		Color_V0
	}
	produits_prix: {
		Date
		Date_Modification
		Prix_ID
		Produit_ID
		Prix
		Parent
		Position
		Visible
		Creator
		ID
	}
	// receptions
	// settings
	// utilisateurs
	vue_inventaire: {
		Quantite
		ID
		Active
	}
}

const caches = {
	archives(services: MyServices): {
		[type: number]: {
			[year: number]: {
				[id: number]: {
					id: number,
					value: number
				} & any
			}
		}
	} {
		return Object.values(services.data.get("Archive").value).reduce((a, entry) => {
			a[entry.type] = a[entry.type] || {};
			a[entry.type][entry.year] = a[entry.type][entry.year] || {};
			a[entry.type][entry.year][entry.produit] = entry;
			return a;
		}, {})
	},
	
	achatFuturByProd(services: MyServices): Record<number, MyTablesDef["achats_futur"][]> {
		return Object.entries(services.data.tables.achats_futur.value).reduce((a, [id, v]) => {
			const pId = services.data.tables.matieres_premieres.value[v.matiere]?.Produit;
			a[pId] = a[pId] || [];
			a[pId].push({...v, ID: id});
			return a;
		}, {})
	},
	
	byProd(services: MyServices): {
		[produit: number]: ComputedRef<{
			prices: Record<number, MyTablesDef["produits_prix"]>,
			vente(year: number): number;
		}>
	} {
		const priceByProd = services.data.getByIndex("produits_prix", "Produit_ID").value;
		const cmdProdByProd = services.data.getByIndex("clients_commandes_produits", "Produit").value
		
		
		return Object.entries(services.data.get("produits").value).reduce((a, [prod_id, prod]) => {
			a[prod_id] = computed(() => {
				const prices: Record<number, MyTablesDef["produits_prix"]> = priceByProd[prod_id]?.reduce((a, id) => {
					const price = services.data.get("produits_prix", id).value;
					a[price.Prix_ID] = price;
					return a;
				}, {});
				
				return {
					prices,
					vente(year: number) {
						let result = 0;
						if (cmdProdByProd[prod_id])
							for (const id of cmdProdByProd[prod_id]) {
								const prod = services.data.get("clients_commandes_produits", id).value;
								const cmd = services.data.get("clients_commandes", prod.Commande).value;
								if (!cmd || moment.unix(cmd.Date).year() !== year)
									continue;
								result += prod.Quantite;
							}
						return result;
					}
				}
			});
			
			return a;
		}, {});
	}
};
export type MyCacheDef = typeof caches;
