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

app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        connection.query('SELECT role.nazev, uzivatel.popis, uzivatel.email, uzivatel.role_id FROM role JOIN uzivatel ON role.id = uzivatel.role_id WHERE uzivatel.id = ?', [req.user.id], (error, results) => {
            if (error) {
                return next(error);
            }
            res.locals.name = req.user.jmeno;
            res.locals.roleName = results[0].nazev;
            res.locals.description = results[0].popis || "uživatel nemá popis";
            res.locals.email = results[0].email;
            res.locals.roleId = results[0].role_id;
            next();
        });
    } else {
        res.locals.name = null;
        res.locals.roleName = null;
        res.locals.description = null;
        res.locals.email = null;
        res.locals.roleId = null;
        next();
    }
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
    res.render("profil.ejs", { name: res.locals.name, roleName: res.locals.roleName, description: res.locals.description });
})
app.get("/profilEdit", checkLogIn, (req, res) => {
    res.render("profilEdit.ejs", { name: res.locals.name, roleName: res.locals.roleName, description: res.locals.description });
});
app.post("/profilEdit", checkLogIn, async (req, res) => {
    let { name, description, email, password, confirmPassword } = req.body;

    name = name || res.locals.name;
    description = description || res.locals.description;
    email = email || res.locals.email;

    if (password && password !== confirmPassword) {
        req.flash("error", "Hesla se neshodují!");
        return res.redirect("/profilEdit");
    }

    try {
        if (password) {
            const hashedPass = await bcrypt.hash(password, 10);
            connection.query('UPDATE uzivatel SET jmeno = ?, popis = ?, email = ?, heslo = ? WHERE id = ?', [name, description, email, hashedPass, req.user.id], (error, results) => {
                if (error) {
                    throw error;
                }
                res.redirect("/profil");
            });
        } else {
            connection.query('UPDATE uzivatel SET jmeno = ?, popis = ?, email = ? WHERE id = ?', [name, description, email, req.user.id], (error, results) => {
                if (error) {
                    throw error;
                }
                res.redirect("/profil");
            });
        }
    } catch (error) {
        req.flash("error", "Nastala chyba při aktualizaci profilu!");
        res.redirect("/profilEdit");
    }
});
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
    const { name, email, password } = req.body;

    if (password.length < 8) {
        req.flash("error", "Heslo musí mít alespoň 8 znaků");
        return res.redirect("/register");
    }

    connection.query('SELECT * FROM uzivatel WHERE email = ?', [email], async (error, results) => {
        if (error) {
            throw error;
        }
        if (results.length > 0) {
            req.flash("error", "Uživatel s tímto emailem již existuje");
            return res.redirect("/register");
        }

        try {
            const hashedPass = await bcrypt.hash(password, 10);
            connection.query('INSERT INTO uzivatel (jmeno, email, heslo, authorized) VALUES (?, ?, ?, ?)', [name, email, hashedPass, 0], (error, results) => {
                if (error) {
                    throw error;
                }
                req.flash("success", "Účet vytvořen, vyčkejte na potvrzení administrátorem");
                res.redirect("/login");
            });
        } catch {
            res.redirect("/register");
        }
    });
})

app.delete("/logout", (req, res) => {
    req.logOut((err) => {
        if (err) {
            return next(err); // Handle error if any
        }
        res.redirect("/login"); // Redirect after successful logout
    });
});

app.get("/adminSettings", checkLogIn, (req, res) => {
    if (res.locals.roleId === 1) {
        connection.query('SELECT title, start FROM akce ORDER BY start ASC', (error, events) => {
            if (error) {
                throw error;
            }
            connection.query('SELECT id, jmeno, email FROM uzivatel WHERE role_id = 2 AND authorized = 0', (error, users) => {
                if (error) {
                    throw error;
                }
                connection.query('SELECT id, jmeno, email FROM uzivatel', (error, allUsers) => {
                    if (error) {
                        throw error;
                    }
                    res.render("adminSettings.ejs", { name: res.locals.name, events, users, allUsers });
                });
            });
        });
    } else {
        res.redirect("/profil");
    }
});

app.post("/authorizeUser", checkLogIn, (req, res) => {
    if (res.locals.roleId === 1) {
        const { userId } = req.body;
        connection.query('UPDATE uzivatel SET authorized = 1 WHERE id = ?', [userId], (error, results) => {
            if (error) {
                throw error;
            }
            res.redirect("/adminSettings");
        });
    } else {
        res.redirect("/profil");
    }
});

app.get("/adminAddAkce", checkLogIn, (req, res) => {
    if (res.locals.roleId === 1) {
        res.render("adminAddAkce.ejs", { name: res.locals.name });
    } else {
        res.redirect("/profil");
    }
});

app.post("/adminAddAkce", checkLogIn, (req, res) => {
    const { title, start, end, misto, podrobnosti, pro_koho } = req.body;

    connection.query('INSERT INTO akce (title, start, end, misto, podrobnosti, pro_koho) VALUES (?, ?, ?, ?, ?, ?)', [title, start, end, misto, podrobnosti, pro_koho], (error, results) => {
        if (error) {
            throw error;
        }
        res.redirect("/adminSettings");
    });
});

app.get("/adminEditAkce", checkLogIn, (req, res) => {
    if (res.locals.roleId === 1) {
        const { eventTitle } = req.query;
        connection.query('SELECT * FROM akce WHERE title = ?', [eventTitle], (error, results) => {
            if (error) {
                throw error;
            }
            const event = results[0];
            event.start = event.start ? new Date(event.start).toISOString().slice(0, 16) : '';
            event.end = event.end ? new Date(event.end).toISOString().slice(0, 16) : '';
            res.render("adminEditAkce.ejs", { name: res.locals.name, event });
        });
    } else {
        res.redirect("/profil");
    }
});

app.post("/adminEditAkce", checkLogIn, (req, res) => {
    const { id, title, start, end, misto, podrobnosti, pro_koho } = req.body;

    connection.query('UPDATE akce SET title = ?, start = ?, end = ?, misto = ?, podrobnosti = ?, pro_koho = ? WHERE id = ?', [title, start, end, misto, podrobnosti, pro_koho, id], (error, results) => {
        if (error) {
            throw error;
        }
        res.redirect("/adminSettings");
    });
});

app.get("/adminEditUzivatel", checkLogIn, (req, res) => {
    if (res.locals.roleId === 1) {
        const { userId } = req.query;
        connection.query('SELECT * FROM uzivatel WHERE id = ?', [userId], (error, results) => {
            if (error) {
                throw error;
            }
            const user = results[0];
            connection.query('SELECT * FROM role', (error, roles) => {
                if (error) {
                    throw error;
                }
                res.render("adminEditUzivatel.ejs", { user, roles });
            });
        });
    } else {
        res.redirect("/profil");
    }
});

app.post("/adminEditUzivatel", checkLogIn, async (req, res) => {
    const { id, name, email, password, description, role } = req.body;

    try {
        if (password) {
            const hashedPass = await bcrypt.hash(password, 10);
            connection.query('UPDATE uzivatel SET jmeno = ?, email = ?, heslo = ?, popis = ?, role_id = ? WHERE id = ?', [name, email, hashedPass, description, role, id], (error, results) => {
                if (error) {
                    throw error;
                }
                res.redirect("/adminSettings");
            });
        } else {
            connection.query('UPDATE uzivatel SET jmeno = ?, email = ?, popis = ?, role_id = ? WHERE id = ?', [name, email, description, role, id], (error, results) => {
                if (error) {
                    throw error;
                }
                res.redirect("/adminSettings");
            });
        }
    } catch (error) {
        req.flash("error", "Nastala chyba při aktualizaci uživatele!");
        res.redirect("/adminEditUzivatel?userId=" + id);
    }
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
