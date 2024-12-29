if(process.env.NODE_ENV !== "production"){
    require("dotenv").config()
}

const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");

const initializePassport = require("./passport-config");
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

//jenom pro testovaci ucely, bude napojeno na DTBS
const users = []

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/Style', express.static(path.join(__dirname, 'style')));
app.use('/Img', express.static(path.join(__dirname, 'Img')));

app.get("/", (req, res) => {
    res.render("index.ejs", {name: req.user.name});
})
app.get("/kalendar", (req, res) => {
    res.render("kalendar.ejs");
})
app.get("/kontakt", (req, res) => {
    res.render("kontakt.ejs");
})
app.get("/profil", (req, res) => {
    res.render("profil.ejs");
})
app.get("/umelci", (req, res) => {
    res.render("umelci.ejs");
})
app.get("/login", (req, res) => {
    res.render("login.ejs");
})
app.post("/login", passport.authenticate("local", {
    successRedirect: "/profil",
    failureRedirect: "/login",
    failureFlash: true
}))

app.get("/register", (req, res) => {
    res.render("register.ejs");
})
app.post("/register", async (req, res) => {
    try {
        const hashedPass = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(), //s DTSB neni potreba
            name: req.body.name,
            email: req.body.email,
            password: hashedPass
        })
        res.redirect("/login")
    } catch {
        res.redirect("/register")
    }
})

app.listen(3000)
