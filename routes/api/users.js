const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

const User = require("../../models/User");

/*
*   @route POST api/users/register
*   @desc Register user and return JWT token
*   @access Public
*/
router.post("/register", (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(400).json({ email: "Email is already associated with a user, please proceed with login." });
        } else {
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => {
                            const payload = {
                                id: user.id,
                                name: user.name
                            };
                            // Sign token
                            jwt.sign(
                                payload,
                                process.env.secretOrKey,
                                {
                                    expiresIn: 31556926 // 1 year in seconds
                                },
                                (err, token) => {
                                    res.json({
                                        success: true,
                                        token: "Bearer " + token
                                    });
                                }
                            );
                        })
                        .catch(err => console.log(err));
                });
            });
        }
    });
});


/*
*   @route POST api/users/login
*   @desc Login user and return JWT token
*   @access Public
*/
router.post("/login", (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email }).then(user => {
        if (!user) {
            return res.status(404).json({ emailnotfound: "Email not found" });
        }
        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = {
                    id: user.id,
                    name: user.name
                };
                // Sign token
                jwt.sign(
                    payload,
                    process.env.secretOrKey,
                    {
                        expiresIn: 31556926 // 1 year in seconds
                    },
                    (err, token) => {
                        res.json({
                            success: true,
                            token: "Bearer " + token
                        });
                    }
                );
            } else {
                return res
                    .status(400)
                    .json({ passwordincorrect: "Password incorrect" });
            }
        });
    });
});

module.exports = router;