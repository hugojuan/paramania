const jwt = require('jsonwebtoken')
const User = require('../models/User/User')

//Config
const config = require("../../config");

const auth = async(req, res, next) => {
    try {
        const rawToken = req.header('Authorization')
        if (rawToken == null) {
            res.status(401).send({ error: 'Lütfen oturum açın.' })
            return
        }
        const token = rawToken.replace(config.AUTHORIZATION, '')        
        const data = jwt.verify(token, config.PRIVATE_KEY)
        User.findOne({ _id: data._id, 'tokens.token': token },{_id:1,phone:1}).then(user =>{
                if (!user) {
                    res.status(401).send({ error: 'Oturum geçerli değil.' })
                    return
                }
                req.user = user
                req.token = token
                next()
        })
    } catch (error) {
        console.log(error);
        res.status(401).send({ error: 'Bir hata oluştu.' })
    }
}
module.exports = auth
