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
   * /fiche_products:
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
  app.get("/fiche_products", async (req, res) => {
    const { reference } = req.body;
    const values = [reference];
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM produit WHERE reference = ?",
        values
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /new_products:
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
  app.get("/new_products", async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM produit WHERE dateCreation >= date_sub(now(),INTERVAL 1 month)"
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /liste_promo:
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
  app.get("/liste_promo", async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM `produit` WHERE etatPromo > 0 AND prixPromo > 0"
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /addPanier:
   *   post:
   *     summary: Ajouter un produit au panier
   *     description: Ajoute un produit au panier d'un utilisateur.
   *     tags:
   *       - Panier
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               codec:
   *                 type: string
   *               total_prix:
   *                 type: number
   *               numero_ligne:
   *                 type: string
   *               reference:
   *                 type: string
   *               quantite:
   *                 type: number
   *     responses:
   *       201:
   *         description: Produit ajouté au panier avec succès.
   *       500:
   *         description: Erreur serveur. Une erreur s'est produite lors de l'enregistrement dans le panier.
   */
  app.post("/addPanier", async (req, res) => {
    const { codec, total_prix, numero_ligne, reference, quantite } = req.body;
    const values = [codec, total_prix, numero_ligne, reference, quantite];
    try {
      await pool.execute(
        "INSERT INTO panier (codec, total_prix, numero_ligne, reference, quantite) VALUES (?,?,?,?,?)",
        values
      );
      res.status(201).send();
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message:
          "Une erreur est survenue lors de l'enregistrement dans le panier",
      });
    }
  });
  /**
   * @swagger
   * /addPanier:
   *   post:
   *     summary: Ajouter un produit au panier
   *     description: Ajoute un produit au panier d'un utilisateur.
   *     tags:
   *       - Panier
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               codec:
   *                 type: string
   *               total_prix:
   *                 type: number
   *               numero_ligne:
   *                 type: string
   *               reference:
   *                 type: string
   *               quantite:
   *                 type: number
   *     responses:
   *       201:
   *         description: Produit ajouté au panier avec succès.
   *       500:
   *         description: Erreur serveur. Une erreur s'est produite lors de l'enregistrement dans le panier.
   */
  app.post("/addCommande", async (req, res) => {
    const { token, paye } = req.body;
    const infoClient = await pool.execute(
      "SELECT codec from client where token= ?",
      token
    );
    const codev = 999;
    const total_prix = await pool.execute(
      "SELECT sum(total_prix) from panier where codec = ?",
      infoClient.codec
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
        values
      );

      let lastid = await pool.execute(
        "select max(numero) as lastid from commande"
      );

      const [rows] = await pool.execute(
        "select * from panier where codec = ?",
        infoClient.codec
      );
      for (const row of rows) {
        values = [lastid, row.numero_ligne, row.reference, row.quantite];
        await pool.execute(
          "INSERT INTO ligne_commande (numero,numero_ligne, reference, quantite_demandee) VALUES (?,?,?,?)",
          values
        );
      }
      await pool.execute("DELETE FROM panier where codec= ?", codec);
      res.status(201).json({ message: "Voter commande a bien été effectué" });
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
        [codec]
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
        [codec]
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
        [codec]
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
        [codec]
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
        [codec]
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
        [numero, codec]
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
        [numero]
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Inscription d'un utilisateur
   *     description: Permet à un utilisateur de s'inscrire.
   *     parameters:
   *       - in: query
   *         name: nom
   *         schema:
   *           type: string
   *         required: true
   *         description: Nom de l'utilisateur
   *       - in: query
   *         name: adresse
   *         schema:
   *           type: string
   *         required: true
   *         description: Adresse de l'utilisateur
   *       - in: query
   *         name: cp
   *         schema:
   *           type: string
   *         required: true
   *         description: Code postal de l'utilisateur
   *       - in: query
   *         name: ville
   *         schema:
   *           type: string
   *         required: true
   *         description: Ville de l'utilisateur
   *       - in: query
   *         name: telephone
   *         schema:
   *           type: string
   *         required: true
   *         description: Numéro de téléphone de l'utilisateur
   *       - in: query
   *         name: motdepasse
   *         schema:
   *           type: string
   *         required: true
   *         description: Mot de passe de l'utilisateur
   *       - in: query
   *         name: mail
   *         schema:
   *           type: string
   *         required: true
   *         description: Adresse e-mail de l'utilisateur
   *       - in: query
   *         name: adrLivraison
   *         schema:
   *           type: string
   *         required: true
   *         description: Adresse de livraison de l'utilisateur
   *     tags:
   *       - Utilisateurs
   *     responses:
   *       201:
   *         description: Utilisateur enregistré avec succès
   *       500:
   *         description: Erreur serveur
   */
  app.post("/register", async (req, res) => {
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
        values
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
        [token]
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /updateprofil:
   *   post:
   *     summary: Mettre à jour le profil d'un client
   *     description: Permet à un utilisateur de mettre à jour son profil.
   *     tags:
   *       - Utilisateurs
   *     parameters:
   *       - in: query
   *         name: nom
   *         schema:
   *           type: string
   *         required: true
   *         description: Nom de l'utilisateur
   *       - in: query
   *         name: adresse
   *         schema:
   *           type: string
   *         required: true
   *         description: Adresse de l'utilisateur
   *       - in: query
   *         name: cp
   *         schema:
   *           type: string
   *         required: true
   *         description: Code postal de l'utilisateur
   *       - in: query
   *         name: ville
   *         schema:
   *           type: string
   *         required: true
   *         description: Ville de l'utilisateur
   *       - in: query
   *         name: telephone
   *         schema:
   *           type: string
   *         required: true
   *         description: Numéro de téléphone de l'utilisateur
   *       - in: query
   *         name: mail
   *         schema:
   *           type: string
   *         required: true
   *         description: Adresse e-mail de l'utilisateur
   *       - in: query
   *         name: adrLivraison
   *         schema:
   *           type: string
   *         required: true
   *         description: Adresse de livraison de l'utilisateur
   */
  app.post("/updateprofil", async (req, res) => {
    const { nom, adresse, cp, ville, telephone, mail, adrLivraison } = req.body;
    try {
      const [rows] = await pool.execute(
        "UPDATE client SET nom = ?, adresse = ?, cp = ?, ville = ?, telephone = ?, adrLivraison = ? WHERE mail = ?",
        [nom, adresse, cp, ville, telephone, adrLivraison, mail]
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
};
