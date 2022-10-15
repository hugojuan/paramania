const mongoose = require("mongoose")

console.log("Db");
//Config
const config = require("../../config");

//Connect to DataBase
var url = null

if (config.PROD){
  url = config.MONGO_DB_URL
}else{
  url = config.MONGO_DB_URL_DEBUG
}



mongoose.connect(url, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
  })
.then(() => console.log('DB Connected!'))
.catch(err => {
  console.log(`DB Connection Error: ${err.message}`);
});
