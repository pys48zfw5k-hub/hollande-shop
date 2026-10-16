# Hollande Shop — starter de boutique en ligne

Le projet contient le site statique et des fonctions Cloudflare Pages pour initier un paiement GeniusPay et recevoir les webhooks signés.

## Ce qui fonctionne dans ce starter
- Catalogue de démonstration, panier et formulaire de commande.
- Création de commande côté serveur; prix recalculés côté serveur.
- Initialisation d'une page de checkout GeniusPay en XOF.
- Webhook HMAC-SHA256 avec contrôle de fraîcheur (5 min) et vérification du montant/devise avant de marquer payé.
- Les clés secrètes restent côté serveur.

## Configuration demandée pour Hollande Shop
- WhatsApp de la boutique : `+225 05 66 55 12 59` (lien wa.me configuré dans le site).
- Approvisionnement : fournisseurs. Le parcours public demande d'abord de confirmer le stock par WhatsApp avant tout paiement, afin d'éviter d'encaisser un article indisponible.
- Livraison : Abidjan uniquement. Le formulaire demande la commune et l'adresse/repère; l'équipe doit confirmer les frais.
- Domaine : domaine personnalisé à acheter ou à connecter par le propriétaire.
- Les prix et articles présents sont des exemples de démonstration, pas un catalogue réel.

## Avant de vendre
1. Crée un compte marchand GeniusPay, vérifie les frais, les justificatifs requis, les délais de règlement et l'accès à Wave/Orange Money/MTN MoMo/Moov Money en Côte d'Ivoire.
2. Crée une base Cloudflare D1 puis exécute `schema.sql`. Remplace `REMPLACER_PAR_ID_D1` dans `wrangler.toml`.
3. Déploie le projet sur Cloudflare Pages avec Functions activées.
4. Ajoute le domaine personnalisé dans Cloudflare Pages > Custom domains. Si tu achètes le domaine chez un autre registrar, suis les instructions DNS affichées par Cloudflare; pour le domaine racine, il faudra généralement ajouter le domaine comme zone Cloudflare et changer les nameservers. Le nom de domaine et son coût ne sont pas inclus.
5. Ajoute les variables/Secrets côté serveur dans les paramètres du projet: `GENIUSPAY_API_KEY`, `GENIUSPAY_API_SECRET`, `GENIUSPAY_WEBHOOK_SECRET`. Ne mets jamais les clés dans `public/index.html`, Git ou un message.
6. Configure le webhook GeniusPay vers `https://TON-DOMAINE/api/webhook` pour `payment.success`, `payment.failed`, `payment.cancelled`, `payment.expired`. Enregistre le secret `whsec_...` reçu à la création.
7. Teste d'abord en sandbox avec des transactions simulées. Passe en production uniquement après vérification du webhook, des montants, des commandes et du remboursement.
8. Remplace les quatre articles de démonstration dans `public/index.html` ET dans `functions/api/create-payment.js` par ton vrai catalogue. Garde les prix synchronisés côté serveur. Ajoute les photos réelles, tailles, couleurs, variantes, stocks, frais de livraison, politique de retour et coordonnées du service client.
9. Prévois une gestion de stock et un tableau de bord sécurisé avant d'avoir beaucoup de commandes. Ce starter n'inclut pas encore de connexion administrateur ni de tableau de bord.

## Déploiement gratuit
Cloudflare Pages propose un hébergement statique gratuit et les Pages Functions s'exécutent côté serveur. D1 est la base de données. Les limites du forfait gratuit peuvent évoluer; vérifie-les dans le tableau de bord Cloudflare.
GitHub Pages n'est pas adapté à la production d'une boutique commerciale, car ses conditions indiquent qu'il n'est pas destiné à héberger des sites principalement destinés aux transactions commerciales.

## Fichiers
- `public/index.html` : vitrine, catalogue et panier.
- `functions/api/create-payment.js` : validation et création du paiement.
- `functions/api/webhook.js` : vérification de signature et mise à jour du statut de commande.
- `schema.sql` : table des commandes.
- `wrangler.toml` : configuration Cloudflare à compléter.

## Parcours adapté aux fournisseurs
Le formulaire envoie d'abord la demande de disponibilité vers le WhatsApp de la boutique. Confirme manuellement auprès du fournisseur les tailles/couleurs et la disponibilité, puis confirme les frais de livraison à Abidjan. N'envoie un lien de paiement qu'après confirmation du stock. L'API de paiement est un squelette serveur pour l'étape suivante; elle doit être testée avec les vraies clés GeniusPay et adaptée au workflow de confirmation avant sa mise en production.

## Sécurité / limites
- Aucun paiement réel n'a été testé ici; le compte marchand et les clés sont à fournir par le propriétaire.
- Le webhook marque une commande payée seulement après événement signé, statut completed, montant et devise concordants.
- Le site ne comporte pas encore de back-office, gestion des tailles/stock, mails/SMS, calcul de livraison, facture, retours, ou protection anti-spam avancée.
- Ne considère jamais la redirection du navigateur comme preuve de paiement: le webhook signé est la source de confirmation.
