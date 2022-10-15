const express = require('express')
const router = express.Router()
//Model
const User = require('../models/User/User')
const auth = require("../middleware/auth")
var { ObjectID } = require('mongodb');
var moment = require('moment'); // require
const fs = require('fs');
const jwt_decode = require('jwt-decode');
const bcrypt = require('bcryptjs')
const config = require('../../config');
const jwt = require('jsonwebtoken')
var fsPath = require('fs-path');
const DrawRequest = require('../models/DrawRequest/DrawRequest');
var otpGenerator = require('otp-generator')
var _ = require('lodash');
const { sendOtp } = require('./sms');

let minPointLimit = 25000
let minTlLimit = 24 

let mainMessage = "Bakimdayiz . 20.09.2022' e kadar sürecek bir bakımdayız. Sabrınız için teşekkürler"
router.post("/users/login", async (req, res) => {
  // //console.log("Login" + req.body);
  try {
    const { username, password } = req.body
    console.log(req.body);
    const user = await User.findByCredentials(username, password)
    if (!user) {
       res.status(401).send({ error: 'Bir hata oluştu.' })
       return
    }else if (user.error) {
      res.status(400).send(user)
      return
    }
    const token = await user.createAuthToken()    
      user.token = token
    res.cookie("token", token).send(user)
  } catch (error) {
    res.status(400).send({ error, message: "login failed. Check your email and password" })
  }
})

router.post("/users/admin-login", async (req, res) => {
  // //console.log("Login" + req.body);
  try {
    const { username, password } = req.body
    console.log(req.body);
    const user = await User.findByCredentials(username, password)
    if (!user) {
       res.status(401).send({ error: 'Bir hata oluştu.' })
       return
    }else if (user.error) {
      res.status(400).send(user)
      return
    }

    if (!user.admin) {
      res.status(400).send({})
      return
    }

    const token = await user.createAuthToken()    
      user.token = token
    res.cookie("token", token).send(user)
  } catch (error) {
    res.status(400).send({ error, message: "login failed. Check your email and password" })
  }
})

router.put('/users/add-point-to-user', auth, async (req, res) => {
  // List Products
  try {
    let id = req.body._id
    let update = { $inc: { point: req.body.point }}
    User
      .findByIdAndUpdate({ _id: id }, update, { new: true, useFindAndModify: false })
      .then((data) => {
        res.status(200).send(data)
      }, err => {
        console.log(err); 
        res.status(400).send({  message: "Bir hata oluştu." })
      })
  } catch (error) {
    console.log(error);
    res.status(400).send({  message: "Bir hata oluştu." })
  }
  
})

router.post('/users/register', async (req, res) => {
  try {
    var rawUser = req.body
    var user = new User(rawUser)
    user.code = generateCode()
    

    if(rawUser.inviteCode != null && rawUser.inviteCode != ""){
      let update = { $inc: { point: 80 }}
      let otherUser = await User.findOne({code:rawUser.inviteCode},{_id:1})
      if(otherUser){
        await User.findByIdAndUpdate({ _id: otherUser._id }, update, { new: true, useFindAndModify: false })
        user.point = 80
      }
    }

    await user.save()

    const token = await user.createAuthToken()
    user.token = token
    res.send(user)  
  } catch (error) {
    console.log(error);
    res.status(400).send({  message: "Kullanıcı eklenirken bir hata oluştu." })
  }
})

router.put('/users/add-point', auth, async (req, res) => {
  // List Products
  try {
    let id = req.user._id
    let update = { $inc: { point: req.body.point }}
    User
      .findByIdAndUpdate({ _id: id }, update, { new: true, useFindAndModify: false })
      .then((data) => {
        res.status(200).send(data)
      }, err => {
        console.log(err); 
        res.status(400).send({  message: "Bir hata oluştu." })
      })
  } catch (error) {
    console.log(error);
    res.status(400).send({  message: "Bir hata oluştu." })
  }
  
})

function pointToTl(point){
  let x = 0.00048
  return point * x
}

router.put('/users/add-tl', auth, async (req, res) => {
  // List Products
try {
  let user = await User.findById(req.user._id,{_id:1,tl:1,point:1})
  let point = user.point

  if (point >= minPointLimit) {
    let pointUpdate = { $set: { point: 0 }}
    let pointResult = await User.findByIdAndUpdate({ _id: req.user._id }, pointUpdate, { new: true, useFindAndModify: false })
    
    let tlUpdate = { $inc: { tl: pointToTl(point) }}
    let tlResult = await User.findByIdAndUpdate({ _id: req.user._id }, tlUpdate, { new: true, useFindAndModify: false })
    res.send(tlResult)
  }else{
    res.send({errorMsg:"Dönüştürmek için en az " + minPointLimit + " puan toplamalısın."})
  }
} catch (error) {
  res.status(400).send({errorMsg:"Bir hata oluştu."})
  console.log(error);
}

})

router.get('/users/charge-request', auth, async (req, res) => {
  // List Products
try {
  let request = await DrawRequest.findById(req.query._id)

  let tlUpdate = { $inc: { tl: (request.price * -1) }}
  let tlResult = await User.findByIdAndUpdate({ _id: request.user }, tlUpdate, { new: true, useFindAndModify: false })
  request.charged = true
  request.save()
  res.send(tlResult)

} catch (error) {
  res.status(400).send({errorMsg:"Bir hata oluştu."})
  console.log(error);
}

})

router.get('/users/setCheat', auth, async (req, res) => {
  // List Products
  try {
    
    let user = await User.findById(req.query._id)
    user.cheat = true
    user.cheatMessage = req.query.msg
    user.save()
    res.send(user)
  } catch (error) {
    res.status(400).send({errorMsg:"Bir hata oluştu."})
    console.log(error);
  }
})

router.get('/users/setNoCheat', auth, async (req, res) => {
  // List Products
  try {
    let user = await User.findById(req.query._id)
    user.cheat = false
    user.cheatMessage = ""
    user.save()
    res.send(user)
  } catch (error) {
    res.status(400).send({errorMsg:"Bir hata oluştu."})
    console.log(error);
  }
})

router.put('/users/request-draw', auth, async (req, res) => {
  // List Products
try {
  let user = await User.findById(req.user._id,{_id:1,tl:1,point:1})
  let papara = req.body.papara
  let hayhay = req.body.hayhay
  if (user.tl >= minTlLimit) {
        let update = { $set: { papara: papara, hayhay: hayhay }}
        let updateResult = await User.findByIdAndUpdate({ _id: req.user._id }, update, { new: true, useFindAndModify: false })
        let drawRequest = new DrawRequest({
          user:req.user._id,
          price:user.tl,
          papara:papara,
          hayhay:hayhay
        })
        drawRequest.save()
        res.send(updateResult)
    }else{
      res.send({errorMsg:"Çekim talebi için en az " + minTlLimit + "₺ toplamalısın."})
    }
  } catch (error) {
    console.log(error);
  }

})

router.get("/users/point",auth, async (req, res) => {
  try {
    User.findById(req.user._id,{point:1,tl:1,papara:1,hayhay:1,cheat:1,cheatMessage:1})
    .then(result=>{
      res.send(result)
    },err=>{
      res.send({message:"Kulanıcı bulunamadı."})
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})


router.get("/app/ads",auth, async (req, res) => {
  try {
    res.send({
      video:"video reklam.",
      wheel:"çevir kazan.",
      kingWheel:"kral çarkı.",
      banner:"banner",
      noAd:false
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.get("/app/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})


router.get("/appv2/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.get("/appv3/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.get("/appv4/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})
router.get("/appv5/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})
router.get("/appv6/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})
router.get("/appv7/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})
router.get("/appv8/version",auth, async (req, res) => {
  try {
    //res.status(400).send({})
    res.send({
      message:mainMessage,
      url:null,
      lock:true
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})
router.get("/users/has-request",auth, async (req, res) => {
  try {
    DrawRequest.findOne({user:req.user._id,charged:false},{tl:1,papara:1,hayhay:1})
    .then(result=>{
      res.send(result)
    },err=>{
      res.send({message:"Kulanıcı bulunamadı."})
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.get("/users/list-request",auth, async (req, res) => {
  try {
    DrawRequest.find({user:req.user._id},{price:1,papara:1,hayhay:1,charged:1})
    .then(result=>{
      res.send(result)
    },err=>{
      res.send({message:"Kulanıcı bulunamadı."})
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.get("/users/all-list-request",auth, async (req, res) => {
  try {
    DrawRequest.find({},{price:1,papara:1,hayhay:1,charged:1})
    .populate("user")
    .sort({date:-1})
    .then(result=>{
      res.send(result)
    },err=>{
      res.send({message:"Kulanıcı bulunamadı."})
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.get("/users/totals",auth, async (req, res) => {
  try {
    User.find({},{point:1,tl:1,papara:1,hayhay:1,cheat:1,phone:1,code:1})
    .sort({tl:-1,point:-1})
    .then(result=>{
      let data = result
      let totalTl = _.sumBy(data, (d) => {return d.tl})
      let totalPoint = _.sumBy(data, (d) => {return d.point})
      
      res.send({totalTl,totalPoint,data:result})
    },err=>{
      res.send({message:"Kulanıcı bulunamadı."})
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.get("/users/invite-totals",auth, async (req, res) => {
  try {
    User.find({inviteCode:req.query.code},{point:1,tl:1})
    .then(result=>{  
      res.send(result)
    },err=>{
      res.send({message:"Kulanıcı bulunamadı."})
    })
  } catch (error) {
    res.status(400).send({ error, message: "Bir hata oluştu." })
  }
})

router.post('/users/send-otp', async function (req, res) {
  let phone = req.body.phone
  sendOtp(phone,(result)=>{
    let status = result.status == "ok" ? 200 : 400
    res.status(status).send(result)
  })
});


function generateCode() {
  let code = otpGenerator.generate(8, { alphabets: true, upperCase: true, specialChars: false });
  return code;
}

module.exports = router
