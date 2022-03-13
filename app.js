const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const users = require("./routes/api/users");
const payments = require("./routes/api/payments");
const gifts = require("./routes/api/gifts");
const invest = require("./routes/api/invest");
const commons = require("./routes/api/commons");
 

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
// DB Config
const db = process.env.MONGOURI;

// Connect to MongoDB
mongoose
    .connect(
        db,
        { useNewUrlParser: true }
    )
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Routes
app.use("/api/users", users);
app.use("/api/payments", payments);
app.use("/api/invest", invest);
app.use("/api/gifts", gifts);
app.use("/api", commons);

const port = process.env.PORT || 5000; // process.env.port is Heroku's port if we choose to deploy the app there

app.listen(port, () => console.log(`Server up and running on port ${port} !`));