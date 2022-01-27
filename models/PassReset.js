const { Schema, model } = require('mongoose')
const schema = new Schema({
    user: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})
schema.index({ 'updatedAt': 1 }, { expireAfterSeconds: 720000 })

module.exports = PasswordReset = model('passwordresets', schema)