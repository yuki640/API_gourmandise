module.exports = function (app, monRouteur, pool, bcrypt) {
  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Récupérer la liste de tous les produits
   *     description: Récupère la liste de tous les produits.
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
   * /register:
   *   post:
   *     summary: Inscription d'un utilisateur
   *     description: Permet à un utilisateur de s'inscrire.
   *     requestBody:
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
   * /allorderClientEC:
   *   get:
   *     summary: Récupérer toutes les commandes en cours d'un client
   *     description: Récupère toutes les commandes en cours d'un client.
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
        "SELECT * FROM commande WHERE codec = ? and etat = 1",
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
   * /oneorderclient:
   *   get:
   *     summary: Récupérer une seule commande d'un client
   *     description: Récupère une seule commande d'un client.
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
   * /login:
   *   post:
   *     summary: Authentification d'un utilisateur
   *     description: Permet à un utilisateur de se connecter.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               motdepasse:
   *                 type: string
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
        res.status(200).json({ message: "Authentification réussie" });
      } else {
        res.status(401).json({ message: "Mot de passe incorrect." });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * @swagger
   * /lookprofil:
   *   post:
   *     summary: Recherche de profil client par code client
   *     description: Recherche un profil client en utilisant le code client fourni.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               codec:
   *                 type: string
   *           example:
   *             codec: "123456"
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
   *                 nomprenom: Doe John
   *                 adresse: 29ter route du mariland
   *                 cp: "41575"
   *                 ville: Mariland
   *                 telephone: 0756487584
   *                 mail: thomas.campus.fr
   *                 adrLivraison: 29ter route du mariland
   *
   *       500:
   *         description: Erreur du serveur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             example:
   *               message: "Une erreur s'est produite lors de la recherche du profil client."
   */

  app.post("/lookprofil", async (req, res) => {
    const { codec } = req.body;
    try {
      const [rows] = await pool.execute(
        "SELECT * from client WHERE codec = ?",
        [codec]
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
   *     requestBody:
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
   *               mail:
   *                 type: string
   *               adrLivraison:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profil mis à jour avec succès
   *       500:
   *         description: Erreur serveur
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
