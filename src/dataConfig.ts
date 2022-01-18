import {TableConfig, TableConfigs, TablesDef} from "@/services";

function defConfig<T extends TableConfig>(config: T): T{
    return config;
}

export const tablesConfig = {
    Archive: {
        key: "id"
    },
    bible: {},
    // bible_saves: {},
    // clients: {},
    clients_commandes: {},
    clients_commandes_produits: {
        indexes: ["Produit"]
    },
    // clients_previsions: {},
    // clients_prix_details: {},
    // commandes: {},
    // currency_rates: {},
    // empotages: {},
    // fournisseurs: {},
    // groups: {},
    InventaireBase: {},
    InventaireBaseEntry: {},
    // matieres_premieres: {},
    // mort: {},
    ordres_assemblages: {},
    prix: {},
    produits: {},
    produits_prix: {
        indexes: ["Produit_ID"]
    },
    // receptions: {},
    // settings: {},
    // utilisateurs: {}
} as const;
export type MyTablesConfig = typeof tablesConfig;

export interface MyTablesDef extends TablesDef {
    Archive
    bible
    // bible_saves
    // clients
    clients_commandes
    clients_commandes_produits
    // clients_previsions
    // clients_prix_details
    // commandes
    // currency_rates
    // empotages
    // fournisseurs
    // groups
    InventaireBase
    InventaireBaseEntry
    // matieres_premieres
    // mort
    ordres_assemblages:{
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
    },
    prix
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
    },
    produits_prix
    // receptions
    // settings
    // utilisateurs
}

//TODO bring cacheService config here
