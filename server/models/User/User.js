const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');


//Config
const config = require('../../../config');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    phone: {
        type:String,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    token: {
        type: String,
    },
    cheat: {
        type: Boolean,
    },
    admin: {
        type: Boolean,
    },
    cheatMessage: {
        type: String,
    },
    point: {
        type: Number,
        default:0
    },
    code: {
        type: String
    },
    inviteCode: {
        type: String
    },
    tl: {
        type: Number,
        default:0
    },
    papara: {
        type: String
    },
    hayhay: {
        type: String
    },
    createdAt:{
      type:Date,
      default:new Date()
    }
})

userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

userSchema.methods.createAuthToken = async function() {
    let user = this
    let token = jwt.sign({_id: user._id,phone:user.phone}, config.PRIVATE_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({'phone':username})
    if (!user) {
        return { error: 'Kullanıcı bulunamadı.' }
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        return { error: 'Kullanıcı Adı veya şifre hatalı.' }
    }
    return user
}

const User = mongoose.model('User', userSchema)

module.exports = User
