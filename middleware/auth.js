const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req, res, next)=>{
    try {
        const token = req.header('Authorization').replace("Bearer ", '')
        const decode = jwt.verify(token, process.env.SECRET_OR_KEY)
        const user = await User.findOne({_id : decode._id, email : decode.email})

        if(!user){
            throw new Error("User not found with given information.")
        }
        req.token = token
        req.user = user
        req.user.apiKey = process.env.WZRX_API_KEY;
        req.user.apiSecret = process.env.WZRX_SECRET_KEY;
        next();
    } catch (error) {
        res.status(401).send("User unAuthorized")
    }
}

module.exports = auth