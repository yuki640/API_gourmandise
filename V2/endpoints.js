const auth = require("./auth"); // Importez le fichier auth.js

module.exports = function (app, monRouteur, pool, bcrypt) {
  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Récupérer la liste de tous les produits
   *     description: Récupère la liste de tous les produits.
   *     tags:
   *       - Produits
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/products", async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM produit");
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /ficheProducts:
   *   get:
   *     summary: Récupérer la fiche d'un produit par référence
   *     description: Récupère la fiche d'un produit en utilisant sa référence.
   *     tags:
   *       - Produits
   *     parameters:
   *       - in: query
   *         name: reference
   *         schema:
   *           type: string
   *         required: true
   *         description: Référence du produit
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/ficheProducts", async (req, res) => {
    const { reference } = req.body;
    const values = [reference];
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM produit WHERE reference = ?",
        values,
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /newProducts:
   *   get:
   *     summary: Récupérer les nouveaux produits
   *     description: Récupère les produits créés au cours du dernier mois.
   *     tags:
   *       - Produits
   *     responses:
   *       200:
   *         description: Succès. Retourne la liste des nouveaux produits.
   *       500:
   *         description: Erreur serveur. Une erreur s'est produite lors de la récupération des nouveaux produits.
   */
  app.get("/newProducts", async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM produit WHERE dateCreation >= date_sub(now(),INTERVAL 1 month)",
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /listePromo:
   *   get:
   *     summary: Récupérer la liste des produits en promotion
   *     description: Récupère la liste des produits qui sont en promotion (avec un état de promotion supérieur à 0 et un prix promotionnel supérieur à 0).
   *     tags:
   *       - Produits
   *     responses:
   *       200:
   *         description: Succès. Retourne la liste des produits en promotion.
   *       500:
   *         description: Erreur serveur. Une erreur s'est produite lors de la récupération des produits en promotion.
   */
  app.get("/listePromo", async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM `produit` WHERE etatPromo > 0 AND prixPromo > 0",
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /addPanier:
   *   put:
   *     summary: Ajouter un produit au panier ou mettre à jour la quantité
   *     description: >
   *       Ajoute un produit au panier d'un utilisateur si le produit n'est pas déjà présent. Si le produit est déjà présent, met à jour la quantité.
   *     tags:
   *       - Panier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *                 description: Token du client.
   *               total_prix:
   *                 type: number
   *                 description: Prix total pour la quantité de produit ajoutée.
   *               reference:
   *                 type: string
   *                 description: Référence du produit à ajouter ou mettre à jour dans le panier.
   *               quantite:
   *                 type: number
   *                 description: Quantité du produit à ajouter ou la nouvelle quantité à mettre à jour.
   *     responses:
   *       200:
   *         description: >
   *           Si le produit est nouvellement ajouté ou la quantité est mise à jour avec succès, renvoie un succès.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 affectedRows:
   *                   type: number
   *                   description: Le nombre de lignes affectées par la requête SQL.
   *                 message:
   *                   type: string
   *                   example: Le produit a été ajouté au panier.
   *       404:
   *         description: >
   *           Client non trouvé. Indique que le client avec le token spécifié n'a pas été trouvé.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Client non trouvé.
   *       500:
   *         description: >
   *           Erreur serveur. Une erreur s'est produite lors de la tentative d'ajout d'un produit au panier ou de la mise à jour de sa quantité.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Une erreur est survenue lors de l'enregistrement dans le panier.
   */
  app.put("/addPanier", async (req, res) => {
    console.log("req_body : " + req.body);
    const { token, total_prix, reference, quantite } = req.body;
    let codec;

    const [infoClient] = await pool.execute(
      "SELECT codec from client where token= ?",
      [token],
    );
    if (infoClient && infoClient.length > 0 && infoClient[0].codec) {
      codec = infoClient[0].codec;
    } else {
      // Gérer le cas où infoClient est indéfini ou vide
      return res.status(404).json({ message: "Client non trouvé" });
    }

    try {
      let numero_ligne;
      const [ReqNumLigne] = await pool.execute(
        "SELECT numero_ligne FROM panier WHERE codec = ?",
        [codec],
      );

      if (ReqNumLigne.length === 0) {
        numero_ligne = 1;
      } else {
        numero_ligne = ReqNumLigne[0].numero_ligne + 1;
      }

      const [ReqVerifieExiste] = await pool.execute(
        "SELECT reference FROM panier WHERE codec = ? and reference = ?",
        [codec, reference],
      );
      console.log(ReqVerifieExiste);
      const values = [codec, total_prix, numero_ligne, reference, quantite];

      if (ReqVerifieExiste.length === 0) {
        const rows = await pool.execute(
          "INSERT INTO panier (codec, total_prix, numero_ligne, reference, quantite) VALUES (?,?,?,?,?)",
          values,
        );
        console.log(rows, values);
        res.status(200).json(rows);
      } else {
        await pool.execute(
          "UPDATE panier SET quantite = quantite + ? WHERE reference = ?",
          [quantite, reference],
        );
        res.status(200).json({
          message: "Le produit a été ajouté au panier",
        });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /lookPanier:
   *   get:
   *     summary: Obtenir le panier de l'utilisateur
   *     description: Obtient le panier d'un utilisateur en fonction du token fourni.
   *     tags:
   *       - Panier
   *     parameters:
   *       - in: query
   *         name: token
   *         required: true
   *         type: string
   *         description: Token JWT pour authentifier l'utilisateur.
   *     responses:
   *       200:
   *         description: Panier récupéré avec succès.
   *       404:
   *         description: Token introuvable.
   *       500:
   *         description: Erreur serveur lors de la récupération du panier.
   */

  app.get("/lookPanier", async (req, res) => {
    const token = req.query.token;
    try {
      const [rows] = await pool.execute(
        "SELECT panier.total_prix,panier.reference,panier.quantite,produit.designation,produit.image,panier.codepa from panier,produit WHERE codec = (SELECT codec FROM client WHERE token = ?) AND panier.reference = produit.reference ",
        [token],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  /**
   * @swagger
   * /updatePanier:
   *   put:
   *     summary: Modifier la quantité d'un produit dans le panier
   *     description: >
   *       Modifie la quantité d'un produit dans le panier en fonction du code produit et de la nouvelle quantité.
   *     tags:
   *       - Panier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - codepa
   *               - nouvelleQuantite
   *             properties:
   *               codepa:
   *                 type: string
   *                 description: Code produit dont la quantité doit être modifiée.
   *               nouvelleQuantite:
   *                 type: integer
   *                 description: Nouvelle quantité du produit dans le panier.
   *     responses:
   *       200:
   *         description: Quantité du produit mise à jour avec succès.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Quantité du produit mise à jour avec succès."
   *       404:
   *         description: >
   *           L'élément du panier spécifié n'existe pas ou la nouvelle quantité est invalide.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Élément du panier introuvable ou nouvelle quantité invalide."
   *       500:
   *         description: Erreur serveur lors de la mise à jour de la quantité du produit dans le panier.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Erreur serveur lors de la mise à jour de la quantité du produit dans le panier."
   */
  app.put("/updatePanier", async (req, res) => {
    const { codepa, nouvelleQuantite } = req.body;

    try {
      if (!codepa || codepa.length === 0 || nouvelleQuantite < 0) {
        return res.status(404).json({ message: "Paramètres invalides." });
      }

      // Mettre à jour la quantité du produit dans le panier
      const [rows] = await pool.execute(
        "UPDATE panier SET quantite = ? WHERE codepa = ?",
        [nouvelleQuantite, codepa],
      );

      if (rows && rows.affectedRows > 0) {
        res
          .status(200)
          .json({ message: "Quantité du produit mise à jour avec succès." });
      } else {
        // L'élément du panier spécifié n'existe pas
        res.status(404).json({ message: "Élément du panier introuvable." });
      }
    } catch (err) {
      res.status(500).json({
        message:
          "Erreur serveur lors de la mise à jour de la quantité du produit dans le panier.",
      });
    }
  });

  /**
   * @swagger
   * /deletePanier:
   *   delete:
   *     summary: Supprimer un élément du panier
   *     description: >
   *       Supprime un élément du panier en fonction du code client et éventuellement du code produit.
   *       Si le code produit (codepa) est fourni, il supprime uniquement cet article.
   *       Si le code produit est vide et le jeton d'authentification (token) est fourni, il supprime tous les articles du panier pour le client spécifié.
   *     tags:
   *       - Panier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *                 description: Jeton d'authentification du client.
   *               codepa:
   *                 type: string
   *                 description: Code produit à supprimer du panier (facultatif).
   *     responses:
   *       200:
   *         description: Élément(s) du panier supprimé(s) avec succès.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Élément(s) du panier supprimé(s) avec succès."
   *       404:
   *         description: >
   *           Le client n'a pas été trouvé ou l'élément du panier spécifié n'existe pas.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Élément(s) du panier introuvable(s) ou client non trouvé."
   *       500:
   *         description: Erreur serveur lors de la suppression de l'élément du panier.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Erreur serveur lors de la suppression de l'élément du panier."
   */
  app.delete("/deletePanier", async (req, res) => {
    const { token, codepa } = req.body;
    let codec;
    try {
      let rows;

      if (codepa === "") {
        // Supprimer tous les éléments du panier pour le client spécifié par 'codec' (si 'token' est renseigné)
        // Ne rien faire si 'token' n'est pas renseigné
        if (token && token.length !== 0) {
          const [infoClient] = await pool.execute(
            "SELECT codec from client where token= ?",
            [token],
          );

          if (infoClient && infoClient.length > 0 && infoClient[0].codec) {
            codec = infoClient[0].codec;
            [rows] = await pool.execute("DELETE FROM panier WHERE codec = ?", [
              codec,
            ]);
          } else {
            // Gérer le cas où infoClient est indéfini ou vide
            return res.status(404).json({ message: "Client non trouvé" });
          }
        }
      } else {
        // Supprimer uniquement le produit spécifié par 'codepa', indépendamment du client
        [rows] = await pool.execute("DELETE FROM panier WHERE codepa = ?", [
          codepa,
        ]);
      }
      console.log("ici,", codepa, " rows :", rows);
      if (rows && rows.affectedRows > 0) {
        res
          .status(200)
          .json({ message: "Élément(s) du panier supprimé(s) avec succès." });
      } else {
        res
          .status(404)
          .json({ message: "Élément(s) du panier introuvable(s)." });
      }
    } catch (err) {
      res.status(500).json({
        message:
          "Erreur serveur lors de la suppression de l'élément du panier.",
      });
    }
  });

  /**
   * @swagger
   * /addCommande:
   *   put:
   *     summary: Ajouter une commande
   *     description: Enregistre une nouvelle commande pour le client authentifié par le token fourni.
   *     tags:
   *       - Commandes
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - paye
   *             properties:
   *               token:
   *                 type: string
   *                 description: Token JWT pour authentifier l'utilisateur.
   *               paye:
   *                 type: boolean
   *                 description: Indique si la commande a été payée.
   *     responses:
   *       201:
   *         description: Commande ajoutée avec succès.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Votre commande a bien été effectuée."
   *       500:
   *         description: Erreur serveur lors de l'ajout de la commande.
   */
  app.put("/addCommande", async (req, res) => {
    const { token, paye } = req.body;
    const infoClient = await pool.execute(
      "SELECT codec from client where token= ?",
      token,
    );
    const codev = 999;
    const total_prix = await pool.execute(
      "SELECT sum(total_prix) from panier where codec = ?",
      infoClient.codec,
    );
    let etatcommande;
    if (!paye) {
      etatcommande = 2;
    } else {
      etatcommande = 3;
    }
    let values = [codev, infoClient.codec, total_prix, etatcommande, paye];
    try {
      await pool.execute(
        "INSERT INTO commande (codev, codec, date_livraison, date_commande, total_prix, etat, paye) VALUES (?,?,?,?,?,?,?)",
        values,
      );

      let lastid = await pool.execute(
        "select max(numero) as lastid from commande",
      );

      const [rows] = await pool.execute(
        "select * from panier where codec = ?",
        infoClient.codec,
      );
      for (const row of rows) {
        values = [lastid.lastid, row.numero_ligne, row.reference, row.quantite];
        await pool.execute(
          "INSERT INTO ligne_commande (numero,numero_ligne, reference, quantite_demandee) VALUES (?,?,?,?)",
          values,
        );
      }
      await pool.execute("DELETE FROM panier where codec= ?", codec);
      res.status(201).json({ message: "Votre commande a bien été effectuée." });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message:
          "Une erreur est survenue lors de l'enregistrement de la commande.",
      });
    }
  });

  /**
   * @swagger
   * /allorderClientEC:
   *   get:
   *     summary: Récupérer toutes les commandes en cours d'un client
   *     description: Récupère toutes les commandes en cours d'un client.
   *     tags:
   *       - Commandes
   *     parameters:
   *       - in: query
   *         name: codec
   *         schema:
   *           type: string
   *         required: true
   *         description: Code client
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/allorderClientEC", async (req, res) => {
    const codec = req.query.codec;
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE codec = ? and etat IN (2, 3)",
        [codec],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /VerifieOrderPaiement:
   *   get:
   *     summary: Vérifier l'état de paiement d'une commande
   *     description: Vérifie l'état de paiement d'une commande pour un client.
   *     tags:
   *       - Commandes
   *     parameters:
   *       - in: query
   *         name: codec
   *         schema:
   *           type: string
   *         required: true
   *         description: Code client
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/VerifieOrderPaiement", async (req, res) => {
    const codec = req.query.codec;
    try {
      const [rows] = await pool.execute(
        "SELECT paye FROM commande WHERE codec = ? ",
        [codec],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  /**
   * @swagger
   * /allorderClientNP:
   *   get:
   *     summary: Récupérer toutes les commandes en cours non payé d'un client
   *     description: Récupère toutes les commandes en cours non payé d'un client.
   *     tags:
   *       - Commandes
   *     parameters:
   *       - in: query
   *         name: codec
   *         schema:
   *           type: string
   *         required: true
   *         description: Code client
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/allorderClientNP", async (req, res) => {
    const codec = req.query.codec;
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE codec = ? and etat = 2",
        [codec],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /allorderClientP:
   *   get:
   *     summary: Récupérer toutes les commandes en cours payé d'un client
   *     description: Récupère toutes les commandes en cours payé d'un client.
   *     tags:
   *       - Commandes
   *     parameters:
   *       - in: query
   *         name: codec
   *         schema:
   *           type: string
   *         required: true
   *         description: Code client
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/allorderClientP", async (req, res) => {
    const codec = req.query.codec;
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE codec = ? and etat = 3",
        [codec],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /allorderClientCL:
   *   get:
   *     summary: Récupérer toutes les commandes clôturées d'un client
   *     description: Récupère toutes les commandes clôturées d'un client.
   *     tags:
   *       - Commandes
   *     parameters:
   *       - in: query
   *         name: codec
   *         schema:
   *           type: string
   *         required: true
   *         description: Code client
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/allorderClientCL", async (req, res) => {
    const codec = req.query.codec;
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE codec = ? and etat = 4",
        [codec],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /oneorderclient:
   *   get:
   *     summary: Récupérer une seule commande d'un client
   *     description: Récupère une seule commande d'un client.
   *     tags:
   *       - Commandes
   *     parameters:
   *       - in: query
   *         name: numero
   *         schema:
   *           type: string
   *         required: true
   *         description: Numéro de commande
   *       - in: query
   *         name: codec
   *         schema:
   *           type: string
   *         required: true
   *         description: Code client
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/oneorderclient", async (req, res) => {
    const { numero, codec } = req.query;
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE numero = ? and codec = ?",
        [numero, codec],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /order_ligne:
   *   get:
   *     summary: Récupérer la liste de toutes les lignes de commande
   *     description: Récupère la liste de toutes les lignes de commande.
   *     tags:
   *       - Commandes
   *     responses:
   *       200:
   *         description: Succès
   *       500:
   *         description: Erreur serveur
   */
  app.get("/order_ligne", async (req, res) => {
    const { numero } = req.query;
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM ligne_commande where numero = ?",
        [numero],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /register:
   *   put:
   *     summary: Inscription d'un utilisateur
   *     description: Permet à un utilisateur de s'inscrire.
   *     tags:
   *       - Utilisateurs
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nom:
   *                 type: string
   *               adresse:
   *                 type: string
   *               cp:
   *                 type: string
   *               ville:
   *                 type: string
   *               telephone:
   *                 type: string
   *               motdepasse:
   *                 type: string
   *               mail:
   *                 type: string
   *               adrLivraison:
   *                 type: string
   *     responses:
   *       201:
   *         description: Utilisateur enregistré avec succès
   *       500:
   *         description: Erreur serveur
   */
  app.put("/register", async (req, res) => {
    const {
      nom,
      adresse,
      cp,
      ville,
      telephone,
      motdepasse,
      mail,
      adrLivraison,
    } = req.body;
    const hashedPassword = await bcrypt.hash(motdepasse, 10);
    const values = [
      nom,
      adresse,
      cp,
      ville,
      telephone,
      hashedPassword,
      mail,
      adrLivraison,
    ];
    try {
      await pool.execute(
        "INSERT INTO client (nom, adresse, cp, ville, telephone, motdepasse, mail, adrLivraison) VALUES (?,?,?,?,?,?,?,?)",
        values,
      );
      res.status(201).send();
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement",
      });
    }
  });

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Authentification d'un utilisateur
   *     description: Permet à un utilisateur de se connecter.
   *     parameters:
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *         required: true
   *         description: Adresse e-mail de l'utilisateur
   *       - in: query
   *         name: motdepasse
   *         schema:
   *           type: string
   *         required: true
   *         description: Mot de passe de l'utilisateur
   *     tags:
   *       - Utilisateurs
   *     responses:
   *       200:
   *         description: Authentification réussie
   *       401:
   *         description: Adresse e-mail non enregistrée ou mot de passe incorrect
   *       500:
   *         description: Erreur serveur
   */
  app.post("/login", async (req, res) => {
    const { email, motdepasse } = req.body;
    try {
      const [rows] = await pool.execute("SELECT * FROM client WHERE mail = ?", [
        email,
      ]);

      if (rows.length === 0) {
        return res
          .status(401)
          .json({ message: "L'adresse e-mail n'est pas enregistrée." });
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(motdepasse, user.motdepasse);

      if (passwordMatch) {
        const token = auth.generateToken(user);
        // Mise à jour du client avec le token généré
        const updateTokenQuery = "UPDATE client SET token = ? WHERE codec = ?";
        const updateTokenValues = [token, user.codec];

        await pool.execute(updateTokenQuery, updateTokenValues);
        res.status(200).json({ message: "Authentification réussie", token });
      } else {
        res.status(401).json({ message: "Mot de passe incorrect." });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /verify-token:
   *   post:
   *     summary: Vérification de la validité d'un token JWT
   *     description: Vérifie si un token JWT n'est pas expiré.
   *     parameters:
   *       - in: query
   *         name: token
   *         schema:
   *           type: string
   *         required: true
   *         description: Token JWT de l'utilisateur
   *     tags:
   *       - Utilisateurs
   *     responses:
   *       200:
   *         description: Token valide
   *       401:
   *         description: Token expiré ou invalide
   *       500:
   *         description: Erreur serveur
   */
  app.post("/verify-token", async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "Token manquant." });
    }

    const user = auth.verifyToken(token);

    if (user) {
      // Le token est valide
      res.status(200).json({ message: "Token valide" });
    } else {
      // Le token est expiré ou invalide
      const updateTokenQuery = "UPDATE client SET token = '' WHERE token = ?";
      const updateTokenValues = [token];

      try {
        await pool.execute(updateTokenQuery, updateTokenValues);
        res.status(401).json({ message: "Token expiré ou invalide." });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Erreur serveur lors de la mise à jour du token." });
      }
    }
  });

  /**
   * @swagger
   * /lookprofil:
   *   get:
   *     summary: Recherche de profil client par token
   *     description: Recherche un profil client en utilisant le token JWT fourni en tant que paramètre de requête.
   *     parameters:
   *       - in: query
   *         name: token
   *         schema:
   *           type: string
   *         required: true
   *         description: Token JWT de l'utilisateur.
   *     tags:
   *       - Utilisateurs
   *     responses:
   *       200:
   *         description: Succès
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   codec:
   *                     type: string
   *                   nom:
   *                     type: string
   *                   adresse:
   *                     type: string
   *                   cp:
   *                     type: string
   *                   ville:
   *                     type: string
   *                   telephone:
   *                     type: string
   *                   mail:
   *                     type: string
   *                   adrLivraison:
   *                     type: string
   *             example:
   *               - codec: 1
   *                 nom: Doe John
   *                 adresse: 29ter route du Mariland
   *                 cp: "41575"
   *                 ville: Mariland
   *                 telephone: 0756487584
   *                 mail: thomas.campus.fr
   *                 adrLivraison: 29ter route du Mariland
   *       401:
   *         description: Token manquant ou invalide
   *       500:
   *         description: Erreur du serveur
   */
  app.get("/lookprofil", async (req, res) => {
    const token = req.query.token;
    try {
      const [rows] = await pool.execute(
        "SELECT * from client WHERE token = ?",
        [token],
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /updateprofil:
   *   put:
   *     summary: Mettre à jour le profil d'un client
   *     description: Permet à un utilisateur de mettre à jour son profil.
   *     tags:
   *       - Utilisateurs
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nom:
   *                 type: string
   *                 description: Nom de l'utilisateur
   *               adresse:
   *                 type: string
   *                 description: Adresse de l'utilisateur
   *               cp:
   *                 type: string
   *                 description: Code postal de l'utilisateur
   *               ville:
   *                 type: string
   *                 description: Ville de l'utilisateur
   *               telephone:
   *                 type: string
   *                 description: Numéro de téléphone de l'utilisateur
   *               mailactuel:
   *                 type: string
   *                 description: Adresse e-mail actuelle de l'utilisateur
   *               mail:
   *                 type: string
   *                 description: Nouvelle adresse e-mail de l'utilisateur
   *               adrLivraison:
   *                 type: string
   *                 description: Adresse de livraison de l'utilisateur
   *               codec:
   *                 type: string
   *                 description: Codec de l'utilisateur (identifiant unique)
   *     responses:
   *       200:
   *         description: Profil mis à jour avec succès
   *         content:
   *           application/json:
   *             example: {"message": "Profil mis à jour avec succès"}
   *       400:
   *         description: Mauvaise requête, vérifiez les paramètres fournis
   *         content:
   *           application/json:
   *             example: {"error": "Mauvaise requête, vérifiez les paramètres fournis"}
   *       404:
   *         description: Utilisateur non trouvé
   *         content:
   *           application/json:
   *             example: {"error": "Utilisateur non trouvé"}
   *       500:
   *         description: Erreur interne du serveur
   *         content:
   *           application/json:
   *             example: {"error": "Erreur interne du serveur"}
   */

  app.put("/updateprofil", async (req, res) => {
    const {
      nom,
      adresse,
      cp,
      ville,
      telephone,
      mailactuel, // Assurez-vous de normaliser la casse
      mail,
      adrLivraison,
      codec,
    } = req.body;

    try {
      const sqlQuery =
        "UPDATE client SET nom = ?, adresse = ?, cp = ?, ville = ?, telephone = ?, adrLivraison = ?, mail = ? WHERE codec = ?";

      const [rows] = await pool.execute(sqlQuery, [
        nom,
        adresse,
        cp,
        ville,
        telephone,
        adrLivraison,
        mail,
        codec,
      ]);

      console.log("Après l'exécution de la requête SQL");

      if (rows.affectedRows > 0) {
        res.status(200).json({ message: "Profil mis à jour avec succès" });
      } else {
        res.status(404).json({ error: "Utilisateur non trouvé" });
      }
    } catch (err) {
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });
};
