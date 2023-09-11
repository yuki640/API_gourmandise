const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const app = express();


//variable de l'environement
require("dotenv").config();
const PORT = process.env.PORT;

// definition parametre du sevreur
const hostname = "localhost";
const monRouteur = express.Router();

// pour utiliser bodyparser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// permet de passer les requêtes
app.use(express.json());

// bcrypt
const bcrypt = require("bcrypt");

// conexion a la base de donné
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password : process.env.DB_PASS,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: process.env.DB_POOL_LIMIT,
    queueLimit: 0,
})

// nous permet de définir les origines et le type de requêtes

app.use(function (req, res, next){
    res.header("Access-Control-Allox-Origin", "*");
    res.header("Access-Control-Allow-Methods", "Get, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Header", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Type", "application/json");
    next();
})

// Démarrage du serveur

http.createServer(app).listen(PORT, hostname, function(){
    console.log("Mon serveur fonctionne sur http://" + hostname + ":" + PORT + "\n");
})


app.use("/api", monRouteur);

require("./endpoints")(monRouteur, pool, bcrypt, jwt);

