const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendForgetPassMail } = require('../../utils/mailer')
const auth = require("../../middleware/auth");
const { v4 } = require("uuid");

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

const User = require("../../models/User");
const PasswordReset = require("../../models/PassReset");

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
            return res.status(404).send("Email not found");
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
                    .send("Password incorrect");
            }
        });
    });
});

router.get("/profile", auth, (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")

    User.findById(req.user._id, { password: false, _id: false }).then(user => {
        if (!user)
            return res.status(404).send('User not found')
        res.status(200).send(user);
    })
})

router.post('/edit-profile', auth, (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")
    let {
        name, email, contactNo, bankDetails, img
    } = req.body;
    const userId = req.user._id;
    User.findById(userId).then(user => {
        name = name || user.name || '';
        email = email || user.email || '';
        img = img || user.img || null;
        contactNo = contactNo || user.contactNo || '';
        bankDetails = bankDetails || user.bankDetails || null;
        User.updateOne({ _id: userId }, { name: name, email: email, contactNo: contactNo, bankDetails: { ...bankDetails }, img: img }, function (err, info) {
            if (err)
                res.status(500).send(err);
            if (info) {
                res.status(200).json({success: "User updated"});
            }
        });
    })
})

router.post('/reset-link-mail', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.length)
        res.status(400).send("Invalid email")
    User.findOne({ 'email': email }).then(async (user) => {
        if (!user)
            res.status(400).send("No user found for given email")
        const token = v4().toString().replace(/-/g, '')
        PasswordReset.updateOne({
            user: user._id
        }, {
            user: user._id,
            token: token
        }, {
            upsert: true
        }, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated pass reset : ", docs);
            }
        })
        const resetLink = `https://kilope.com/reset-password/${token}`;
        try {
            await sendForgetPassMail(email, resetLink)
                res.status(200).json({
                    success: true
                })
        }
        catch (error) {
            return res.status(500).send(error)
        }
    })
})

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const passwordReset = await PasswordReset.findOne({ token }).then(pass => {
        if (!pass)
            res.status(400).send("Invalid or expired token")
        User.findOne({ _id: pass.user }).then(user => {
            if (!user)
                res.status(400).send("No user for input token")
            bcrypt.genSalt(10, (err, salt) => {
                if (err) res.send(500).send(err);
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) res.send(500).send(err);
                    User.updateOne({ _id: user._id }, { password: hash })
                        .then(async (user) => {
                            await PasswordReset.deleteOne({ _id: pass._id })
                            res.status(201).send("Password has been reset.")
                        });
                });
            })
        })
    })
})

module.exports = router;