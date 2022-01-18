export const tables = {
    "produits": {
        sql: "SELECT * FROM produits WHERE Active=1"
    },
    "ordres_assemblages": {},
    "bible": {},
    "bible_saves": {},
    "clients": {},
    "clients_commandes": {},
    "clients_commandes_produits": {
        indexes: ["Produit"]
    },
    "produits_prix": {
        indexes: ["Produit_ID"]
    },
    "Archive": {
        key: "id"
    },
} as const;
export type Tables = typeof tables;

//TODO bring cacheService config here
