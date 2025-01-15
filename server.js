if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const connection = require("./connection"); // Import the database connection
const fullcalendar = require("fullcalendar");

const initializePassport = require("./passport-config");
initializePassport(
    passport,
    email => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM uzivatel WHERE email = ?', [email], (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results[0]);
            });
        });
    },
    id => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM uzivatel WHERE id = ?', [id], (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results[0]);
            });
        });
    }
);

//jenom pro testovaci ucely, bude napojeno na DTBS
const users = []

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use('/Style', express.static(path.join(__dirname, 'style')));
app.use('/Img', express.static(path.join(__dirname, 'Img')));

// Middleware to set the name variable
app.use((req, res, next) => {
    res.locals.name = req.isAuthenticated() ? req.user.name : null;
    next();
});

app.get("/", (req, res) => {
    res.render("index.ejs", {name: res.locals.name});
})
app.get("/kalendar", (req, res) => {
    connection.query('SELECT * FROM akce', (error, results) => {
        if (error) {
            throw error;
        }
        const events = results.map(event => ({
            title: event.title,
            start: event.start,
            end: event.end
        }));
        res.render("kalendar.ejs", { events });
    });
})
app.get("/kontakt", (req, res) => {
    res.render("kontakt.ejs", {name: res.locals.name});
})
app.get("/profil", checkLogIn, (req, res) => {
    res.render("profil.ejs", {name: res.locals.name});
})
app.get("/umelci", (req, res) => {
    res.render("umelci.ejs", {name: res.locals.name});
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
        const hashedPass = await bcrypt.hash(req.body.password, 10);
        connection.query('INSERT INTO uzivatel (jmeno, email, heslo) VALUES (?, ?, ?)', [req.body.name, req.body.email, hashedPass], (error, results) => {
            if (error) {
                throw error;
            }
            res.redirect("/login");
        });
    } catch {
        res.redirect("/register");
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
