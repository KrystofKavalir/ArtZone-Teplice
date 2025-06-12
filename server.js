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
const connection = require("./connection");
const fullcalendar = require("fullcalendar");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 16 * 1024 * 1024 }
});

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
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
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
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        connection.query(
            `SELECT role.nazev, uzivatel.popis, uzivatel.email, uzivatel.role_id, profilfoto.data AS profilePhoto
             FROM role
             JOIN uzivatel ON role.id = uzivatel.role_id
             LEFT JOIN profilfoto ON uzivatel.profilFoto_id = profilfoto.id
             WHERE uzivatel.id = ?`,
            [req.user.id],
            (error, results) => {
                if (error) {
                    return next(error);
                }
                res.locals.name = req.user.jmeno;
                res.locals.roleName = results[0].nazev;
                res.locals.description = results[0].popis || "uživatel nemá popis";
                res.locals.email = results[0].email;
                res.locals.roleId = results[0].role_id;
                res.locals.profilePhoto = results[0].profilePhoto
                    ? `data:image/jpeg;base64,${results[0].profilePhoto.toString("base64")}`
                    : "/Img/default_profile.jpg";
                next();
            }
        );
    } else {
        res.locals.name = null;
        res.locals.roleName = null;
        res.locals.description = null;
        res.locals.email = null;
        res.locals.roleId = null;
        res.locals.profilePhoto = "/Img/default_profile.jpg";
        next();
    }
});

app.get("/", (req, res) => {
    connection.query(
        `SELECT id, title, start, podrobnosti 
         FROM akce 
         WHERE start >= NOW() 
         ORDER BY start ASC 
         LIMIT 1`,
        (error, results) => {
            if (error) {
                console.error("Error fetching closest akce:", error);
                return res.render("index.ejs", { name: res.locals.name, closestAkce: null });
            }
            const closestAkce = results.length > 0 ? results[0] : null;
            res.render("index.ejs", { name: res.locals.name, closestAkce });
        }
    );
});
app.get("/kalendar", (req, res) => {
    connection.query('SELECT * FROM akce', (error, results) => {
        if (error) {
            throw error;
        }
        const events = results.map(event => ({
            id: event.id,
            title: event.title.replace(/\r?\n|\r/g, " "),
            start: event.start,
            end: event.end,
            extendedProps: {
                misto: event.misto,
                pro_koho: event.pro_koho
            }
        }));
        res.render("kalendar.ejs", { events, name: res.locals.name });
    });
})
app.get("/kontakt", (req, res) => {
    res.render("kontakt.ejs", {name: res.locals.name});
})
app.get("/profil", checkLogIn, (req, res) => {
    res.render("profil.ejs", { name: res.locals.name, roleName: res.locals.roleName, description: res.locals.description });
})
app.get("/profilEdit", checkLogIn, (req, res) => {
    res.render("profilEdit.ejs", {
        name: res.locals.name,
        roleName: res.locals.roleName,
        description: res.locals.description,
        email: res.locals.email,
        profilePhoto: res.locals.profilePhoto
    });
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
app.post("/profilEdit/uploadPhoto", checkLogIn, upload.single("profilePhoto"), (req, res) => {
    const file = req.file;

    if (!file) {
        req.flash("error", "Nebyla vybrána žádná fotografie!");
        return res.redirect("/profilEdit");
    }

    const fileData = file.buffer;

    connection.query(
        "SELECT profilFoto_id FROM uzivatel WHERE id = ?",
        [req.user.id],
        (error, results) => {
            if (error) {
                req.flash("error", "Nastala chyba při získávání aktuální fotografie!");
                return res.redirect("/profilEdit");
            }

            const currentPhotoId = results[0]?.profilFoto_id;

            connection.query(
                "INSERT INTO profilfoto (data) VALUES (?)",
                [fileData],
                (error, results) => {
                    if (error) {
                        req.flash("error", "Nastala chyba při nahrávání nové fotografie!");
                        return res.redirect("/profilEdit");
                    }

                    const newPhotoId = results.insertId;

                    connection.query(
                        "UPDATE uzivatel SET profilFoto_id = ? WHERE id = ?",
                        [newPhotoId, req.user.id],
                        (error) => {
                            if (error) {
                                req.flash("error", "Nastala chyba při aktualizaci profilu!");
                                return res.redirect("/profilEdit");
                            }

                            if (currentPhotoId) {
                                connection.query(
                                    "DELETE FROM profilfoto WHERE id = ?",
                                    [currentPhotoId],
                                    (error) => {
                                        if (error) {
                                            req.flash("error", "Nastala chyba při odstraňování staré fotografie!");
                                            return res.redirect("/profilEdit");
                                        }

                                        req.flash("success", "Profilová fotografie byla úspěšně změněna!");
                                        res.redirect("/profilEdit");
                                    }
                                );
                            } else {
                                req.flash("success", "Profilová fotografie byla úspěšně nahrána!");
                                res.redirect("/profilEdit");
                            }
                        }
                    );
                }
            );
        }
    );
});
app.get("/umelci", (req, res) => {
    connection.query(
        `SELECT uzivatel.id, uzivatel.jmeno, uzivatel.email, uzivatel.popis, 
                profilfoto.data AS profilePhoto
         FROM uzivatel
         LEFT JOIN profilfoto ON uzivatel.profilFoto_id = profilfoto.id
         WHERE uzivatel.role_id = 2 AND uzivatel.authorized = 1`,
        (error, results) => {
            if (error) {
                throw error;
            }
            const artists = results.map(artist => {
                if (artist.profilePhoto) {
                    artist.profilePhoto = `data:image/jpeg;base64,${artist.profilePhoto.toString("base64")}`;
                } else {
                    artist.profilePhoto = "/Img/ProfImgDefault.jpg";
                }
                return artist;
            });

            res.render("umelci.ejs", { artists });
        }
    );
});
app.get("/umelec/:id", (req, res) => {
    const artistId = req.params.id; 
    connection.query(
        `SELECT uzivatel.jmeno, uzivatel.email, uzivatel.popis, 
                profilfoto.data AS profilePhoto
         FROM uzivatel
         LEFT JOIN profilfoto ON uzivatel.profilFoto_id = profilfoto.id
         WHERE uzivatel.id = ?`,
        [artistId],
        (error, results) => {
            if (error) {
                return res.status(500).send("Chyba serveru");
            }
            if (results.length === 0) {
                return res.status(404).send("Umělec nenalezen");
            }
            const artist = results[0];
            artist.profilePhoto = artist.profilePhoto
                ? `data:image/jpeg;base64,${artist.profilePhoto.toString("base64")}`
                : "/Img/ProfImgDefault.jpg";
            
            connection.query(
                `SELECT id, title, start, end, misto, podrobnosti 
                 FROM akce 
                 WHERE poradatel_id = ? 
                   AND (start >= NOW() OR (start <= NOW() AND end >= NOW()))
                 ORDER BY start ASC`,
                [artistId],
                (err, akce) => {
                    if (err) {
                        return res.status(500).send("Chyba serveru při načítání akcí");
                    }
                    res.render("umelec.ejs", { artist, akce });
                }
            );
        }
    );
});
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
            return next(err);
        }
        res.redirect("/login");
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

app.get("/userAddAkce", checkLogIn, (req, res) => {
    if (res.locals.roleId === 2) {
        res.render("userAddAkce.ejs", { name: res.locals.name });
    } else {
        res.redirect("/profil");
    }
});

app.post("/userAddAkce", checkLogIn, (req, res) => {
    if (res.locals.roleId === 2) {
        const { title, start, end, misto, podrobnosti, pro_koho } = req.body;
        const poradatelId = req.user.id;

        connection.query(
            'INSERT INTO akce (title, start, end, misto, podrobnosti, pro_koho, poradatel_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, start, end, misto, podrobnosti, pro_koho, poradatelId],
            (error, results) => {
                if (error) {
                    console.error("Chyba při vkládání akce:", error);
                    return res.status(500).send("Chyba při vkládání akce do databáze.");
                }
                res.redirect("/profil");
            }
        );
    } else {
        res.redirect("/profil");
    }
});
app.get("/akce/:id", (req, res) => {
    const akceId = req.params.id;
    connection.query(
        `SELECT akce.*, uzivatel.jmeno AS poradatel_jmeno, uzivatel.id AS poradatel_id
         FROM akce
         LEFT JOIN uzivatel ON akce.poradatel_id = uzivatel.id
         WHERE akce.id = ?`,
        [akceId],
        (error, results) => {
            if (error) return res.status(500).send("Chyba serveru");
            if (results.length === 0) return res.status(404).send("Akce nenalezena");
            const akce = results[0];
            res.render("akce.ejs", { akce, name: res.locals.name });
        }
    );
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
