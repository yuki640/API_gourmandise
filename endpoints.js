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

  //GET all client
  app.get("/clients", async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM client");
      res.status(200).json(rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Register
  app.post("/register", async (req, res) => {
    const { nom, adresse, cp, ville, telephone, motdepasse, mail } = req.body;
    const hashedPassword = await bcrypt.hash(motdepasse, 10);
    const values = [nom, adresse, cp, ville, telephone, hashedPassword, mail];
    try {
      await pool.execute(
        "INSERT INTO client (nom, adresse, cp, ville, telephone, motdepasse, mail) VALUES (?,?,?,?,?,?,?)",
        values
      );
      res.sendStatus(201);
    } catch (err) {
      console.log(err);
      res.json({
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement",
      });
    }
  });
};
