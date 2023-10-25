module.exports = function (app, pool, bcrypt, jwt) {
  // GET all products
  app.get("/products", async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM produit");
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  //GET all order
  app.get("/order", async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM commande");
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  //GET all order_ligne
  app.get("/order_ligne", async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM ligne_commande");
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Register
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
        "INSERT INTO client (nom, adresse, cp, ville, telephone, motdepasse, mail, adrLivraison) VALUES (?,?,?,?,?,?,?)",
        values
      );
      res.status(201).send(); // Utilisez res.status(201).send() pour une réponse vide avec un code 201.
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement",
      });
    }
  });

  // aller chercher toutes les commandes en cours d'un client
  app.get("/allorderClientEC", async (req, res) => {
    // Assurez-vous de récupérer correctement les données de la requête.
    const codec = req.query.codec; // Si vous voulez récupérer le codec depuis la requête GET, utilisez req.query.codec

    try {
      // Utilisez des backticks (`) pour définir la requête SQL si vous utilisez des paramètres.
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE codec = ? and etat = 1",
        [codec] // Utilisez un tableau pour passer les valeurs des paramètres.
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Aller chercher toutes les commandes cloturée d'un client
  app.get("/allorderClientCL", async (req, res) => {
    // Assurez-vous de récupérer correctement les données de la requête.
    const codec = req.query.codec; // Si vous voulez récupérer le codec depuis la requête GET, utilisez req.query.codec

    try {
      // Utilisez des backticks (`) pour définir la requête SQL si vous utilisez des paramètres.
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE codec = ? and etat = 2",
        [codec] // Utilisez un tableau pour passer les valeurs des paramètres.
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // aller chercher une seule commande d'un client
  app.get("/oneorderclient", async (req, res) => {
    // Assurez-vous de récupérer correctement les données de la requête.
    const { numero, codec } = req.query; // Utilisez req.query pour récupérer les paramètres de la requête GET.

<<<<<<< HEAD
    //Register
    app.post("/register", async (req, res) => {
        const {nom, adresse, cp, ville, telephone, motdepasse, mail} = req.body;
        const hashedPassword = await bcrypt.hash(motdepasse, 10);
        const values = [nom, adresse, cp, ville, telephone, hashedPassword, mail];
        try {
            await pool.execute(
                "INSERT INTO client (nom, adresse, cp, ville, telephone, motdepasse, mail) VALUES (?,?,?,?,?,?,?)",
                 values
                 );
                res.sendStatus(201);
        } catch (err){
            console.log(err);
            res.json({
                succes: false,
                message: "Une erreur est survenue lors de l'enregistrement.",
            });
        }
    });
}
=======
    try {
      // Utilisez des backticks (`) pour définir la requête SQL si vous utilisez des paramètres.
      const [rows] = await pool.execute(
        "SELECT * FROM commande WHERE numero = ? and codec = ?",
        [numero, codec] // Utilisez un tableau pour passer les valeurs des paramètres.
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // aller passer une commande

  //PAS TROUVER COMMENT FAIRE

  // se logger(middleware)
  app.post("/login", async (req, res) => {
    const { email, motdepasse } = req.body;

    try {
      // Recherchez l'utilisateur par adresse e-mail dans la base de données.
      const [rows] = await pool.execute("SELECT * FROM client WHERE mail = ?", [
        email,
      ]);

      if (rows.length === 0) {
        // Aucun utilisateur trouvé avec cette adresse e-mail.
        return res
          .status(401)
          .json({ message: "L'adresse e-mail n'est pas enregistrée." });
      }

      // Vérifiez le mot de passe haché.
      const user = rows[0];
      const passwordMatch = await bcrypt.compare(motdepasse, user.motdepasse);

      if (passwordMatch) {
        // Le mot de passe correspond, l'utilisateur est authentifié.
        res.status(200).json({ message: "Authentification réussie" });
      } else {
        // Le mot de passe ne correspond pas.
        res.status(401).json({ message: "Mot de passe incorrect." });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // mettre a jour le profil client
  app.post("/updateprofil", async (req, res) => {
    // Assurez-vous de récupérer correctement les données de la requête.
    const { nom, adresse, cp, ville, telephone, mail, adrLivraison } = req.body;

    try {
      // Utilisez des backticks (`) pour définir la requête SQL si vous utilisez des paramètres.
      const [rows] = await pool.execute(
        "UPDATE client SET nom = ?, adresse = ?, cp = ?, ville = ?, telephone = ?, adrLivraison = ? WHERE mail = ?",
        [nom, adresse, cp, ville, telephone, adrLivraison, mail] // Utilisez un tableau pour passer les valeurs des paramètres.
      );
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
};
>>>>>>> origin/thomas
