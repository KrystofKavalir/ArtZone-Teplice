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
const methodOverride = require("method-override");

/*const database = require("ArtZone-Teplice/connection");*/

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
app.use(methodOverride("_method"))

app.use('/Style', express.static(path.join(__dirname, 'style')));
app.use('/Img', express.static(path.join(__dirname, 'Img')));

app.get("/", (req, res) => {
    res.render("index.ejs");
})
app.get("/kalendar", (req, res) => {
    res.render("kalendar.ejs");
})
app.get("/kontakt", (req, res) => {
    res.render("kontakt.ejs");
})
app.get("/profil", checkLogIn, (req, res) => {
    res.render("profil.ejs", {name: req.user.name});
})
app.get("/umelci", (req, res) => {
    res.render("umelci.ejs");
})
app.get("/login", checkNoLogIn, (req, res) => {
    res.render("login.ejs");
})
app.post("/login", checkNoLogIn, passport.authenticate("local", {
    successRedirect: "/profil",
    failureRedirect: "/login",
    failureFlash: true
}))

app.get("/register", checkNoLogIn, (req, res) => {
    res.render("register.ejs");
})
app.post("/register", checkNoLogIn, async (req, res) => {
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

app.delete("/logout", (req, res) => {
    req.logOut((err) => {
        if (err) {
            return next(err); // Handle error if any
        }
        res.redirect("/login"); // Redirect after successful logout
    });
});

function checkLogIn (req, res, next) { 
    if (req.isAuthenticated()) {
        return next()
    } else {
        res.redirect("/login")
    }
}
function checkNoLogIn (req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/profil")
    } else {
        return next();
    }
}

app.listen(3000)
