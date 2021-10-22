export const tables = {
    "produits": {},
    "ordres_assemblages": {},
    "bible": {},
    "bible_saves": {},
    "clients": {},
    "clients_commandes": {},
    "clients_commandes_produits": {
        indexes: ["Produit"]
    },
    "produits_prix": {},
    "Archive": {},
} as const;
export type Tables = typeof tables;

//TODO bring cacheService config here
