module.exports = function (app, pool, bcrypt, jwt) {

    // get all produit
    app.get("/produit", async (req, res) => {
        try{
            const [rows] = await pool.execute("SELECT * FROM produit");
            res.status(200).json(rows);
        } catch (err){
            res.status(500).json({message : err.message})
        }
    })

     // get all client
     app.get("/client", async (req, res) => {
        try{
            const [rows] = await pool.execute("SELECT * FROM client");
            res.status(200).json(rows);
        } catch (err){
            res.status(500).json({message : err.message})
        }
    })



     // get all commande
     app.get("/commande", async (req, res) => {
        try{
            const [rows] = await pool.execute("SELECT * FROM commande");
            res.status(200).json(rows);
        } catch (err){
            res.status(500).json({message : err.message})
        }
    })


    // get all ligne_commande
    app.get("/ligne_commande", async (req, res) => {
        try{
            const [rows] = await pool.execute("SELECT * FROM ligne_commande");
            res.status(200).json(rows);
        } catch (err){
            res.status(500).json({message : err.message})
        }
    })

    //Register
    app.post("/regestier", async (req, res) => {
        const {nom, adresse, cp, ville, telephone, motdepasse, email} = req.body;
        const hashedPassword = await bcrypt.hash(motdepasse, 10);
        const values = [mon, adresse, cp, ville, telephone, hashedPassword, email];
        try {
            await pool.execute(
                "INSERT INTO client (nom, adresse, cp, ville, telephone, motdepasse, email) VALUES (?,?,?,?,?,?,?)",
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