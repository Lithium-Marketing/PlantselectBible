import {TableConfig, TableConfigs, TablesDef} from "@/services";

function defConfig<T extends TableConfig>(config: T): T {
    return config;
}

export const tablesConfig = {
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
    // clients_previsions: {},
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
    matieres_premieres: {},
    // mort: {},
    ordres_assemblages: {},
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
    // clients_previsions
    // clients_prix_details
    commandes:{
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

//TODO bring cacheService config here
