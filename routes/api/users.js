const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
            return res.status(400).send("Email already exists, please login");
        } else {
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });
            bcrypt.genSalt(10, (err, salt) => {
                if (err) res.send(500).send(err);
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) res.send(500).send(err);
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => {
                            const payload = {
                                _id: user._id,
                                email: user.email
                            };
                            // Sign token
                            jwt.sign(
                                payload,
                                process.env.SECRET_OR_KEY,
                                {
                                    expiresIn: 31556926 // 1 year in seconds
                                },
                                (err, token) => {
                                    if (err)
                                        res.status(500).send(err);
                                    res.status(201).json({
                                        success: true,
                                        token: token
                                    });
                                }
                            );
                        })
                        .catch(err => res.send(400).send(err));
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
            return res.status(404).send("Email not found" );
        }
        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = {
                    _id: user._id,
                    email: user.email
                };
                // Sign token
                jwt.sign(
                    payload,
                    process.env.SECRET_OR_KEY,
                    {
                        expiresIn: 31556926 // 1 year in seconds
                    },
                    (err, token) => {
                        if (err)
                            res.status(500).send(err);
                        res.status(200).json({
                            success: true,
                            token: token
                        });
                    }
                );
            } else {
                return res
                    .status(400)
                    .send("Password incorrect" );
            }
        });
    });
});

module.exports = router;