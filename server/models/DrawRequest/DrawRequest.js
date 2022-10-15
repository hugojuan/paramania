const mongoose = require('mongoose')
//Config
const scheme = mongoose.Schema({
    user: {
        type:mongoose.Schema.ObjectId,
        ref:'User'
    },
    date:{
        type:Date,
        default:new Date()
    },
    price: {
        type: Number,
        default:0
    },
    papara: {
        type: String
    },
    hayhay: {
        type: String
    },
    charged: {
        type: Boolean,
        default:false
    },
    createdAt:{
      type:Date,
      default:new Date()
    }
})


const DrawRequest = mongoose.model('DrawRequest', scheme)

module.exports = DrawRequest
