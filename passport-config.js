const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const connection = require("./connection"); // Import the database connection

function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        connection.query('SELECT * FROM uzivatel WHERE email = ?', [email], async (error, results) => {
            if (error) {
                return done(error);
            }
            if (results.length === 0) {
                return done(null, false, { message: "Uživatel s tímto emailem neexistuje!" });
            }

            const user = results[0];

            if (user.role_id !== 1 && !user.authorized) {
                return done(null, false, { message: "Účet nebyl zatím schválen" });
            }

            try {
                if (await bcrypt.compare(password, user.heslo)) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: "Nesprávné heslo!" });
                }
            } catch (e) {
                return done(e);
            }
        });
    };

    passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        connection.query('SELECT * FROM uzivatel WHERE id = ?', [id], (error, results) => {
            if (error) {
                return done(error);
            }
            return done(null, results[0]);
        });
    });
}

module.exports = initialize;