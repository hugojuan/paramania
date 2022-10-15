const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
//Routers
const router_users = require('./routers/users')
const jwt = require('jsonwebtoken')
//Config
const config = require("../config") ;
const port = config.PORT
const fs = require('fs');

var path = require("path")
//Mongodb
require('./db/db')

var http = require('http')

//Express
const app = express()

app.use(express.json({limit: '50mb'}))
app.use(cors())


//Routes
app.use(router_users)

var server = http.createServer(app)
server.listen(port, function(){
      console.log(`Debug Server  started on port ${port}`)
});
