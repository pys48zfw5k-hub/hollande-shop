# Checklist avant ouverture de Hollande Shop

## À faire par le propriétaire
- [ ] Confirmer le nom légal / identité du marchand et ouvrir un compte marchand GeniusPay.
- [ ] Obtenir les clés sandbox et réaliser des tests avant les clés live.
- [ ] Acheter/posséder le nom de domaine souhaité et avoir accès au registrar.
- [ ] Créer un compte Cloudflare et un dépôt GitHub (ou utiliser Wrangler en ligne de commande).
- [ ] Créer la base D1 et exécuter `schema.sql`.
- [ ] Configurer `GENIUSPAY_API_KEY`, `GENIUSPAY_API_SECRET`, `GENIUSPAY_WEBHOOK_SECRET` comme secrets serveur.
- [ ] Configurer et tester le webhook sur `/api/webhook`.
- [ ] Remplacer les produits/prix de démonstration par les articles réels et synchroniser les prix serveur.
- [ ] Ajouter photos autorisées, tailles, couleurs, disponibilité fournisseur et règles d'échange/retour.
- [ ] Définir les frais de livraison par commune d'Abidjan et la personne qui confirme les commandes.
- [ ] Tester le parcours WhatsApp, stock indisponible, paiement réussi/échoué, commande annulée et remboursement.
- [ ] Publier sur Cloudflare Pages, ajouter le domaine dans Custom domains et vérifier HTTPS.

## Ce qui n'est pas configuré automatiquement
- Aucun compte marchand, clé API, webhook, base D1, compte Cloudflare, dépôt Git ou domaine n'a été créé.
- Aucun paiement réel n'a été initié ou testé.
- Le propriétaire doit saisir les secrets dans son tableau de bord sécurisé. Ne les envoyez pas dans le chat.
