const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise")

const app = express();

// variable d'environnement
require("dotenv").config();
const PORT = process.env.PORT

// Nous définissons les paramètres du serveur
const hostname = "localhost";
const monRouteur = express.Router();

//Pour utiliser bodyparser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//permet de parser les requêtes
app.use(express.json());

// bcrypt
const bcrypt = require("bcrypt");

// Connexion a la base de donnée
const pool = mysql.createPool({
    host:process.env.DB_HOST,
    port:process.env.DB_PORT,
    user:process.env.DB_USER,
    password:process.env.DB_PASS,
    database:process.env.MYSQL_DB,
    waitForConnections:true,
    connectionLimit:process.env.CONNECTION_LIMIT,
    queueLimit:0,
})

app.use(function (req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Methods","GET,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-type, Accept");
    res.header("Access-Control-Type","application/json");
    next();
})

// Démarrage du Serveur
http.createServer(app).listen(PORT,hostname,function (){
    console.log("Mon serveur fonctionne sur http://" + hostname +":"+PORT + "\n");
})


// nous demandons a l'application d'utiliser notre routeur et de le préfixer par /api
app.use("/api",monRouteur);

require("./endpoints")(monRouteur,pool,bcrypt,jwt);






