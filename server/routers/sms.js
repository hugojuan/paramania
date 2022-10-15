var otpGenerator = require('otp-generator')
const bcrypt = require('bcryptjs')
var request = require('request');

const vatan_base_url = "http://panel.vatansms.com/panel/smsgonder1N.php"
const vatan_userno = "43424"
const vatan_username = "905354734826"
const vatan_password = "26WC8u48"
const vatan_from = "08506939374"
const vatan_type = "Otp"

const OTP_MSG = "Paramania giriş şifreniz "


function sendOtp(phone,callback) {
    let code = generateOtpCode()
    const requestUrl = vatan_base_url
    let query = {
        kno: vatan_userno,
        kul_ad:vatan_username,
        gonderen:vatan_from,
        sifre:vatan_password,
        numaralar:phone,
        tur:vatan_type,
        mesaj:OTP_MSG + code
    }

    let url =  encodeURI(requestUrl)
    request({
        url:url,
        qs: query
    }, function (err, response, body) {
        console.log(err);
        console.log(body);
        if(err){
            callback({status:"fail",message:"Sms gönderimi başarısız."})
            return
        }
        callback({status:"ok",message:"Sms gönderildi.",code:code})
    })
}


function generateOtpCode() {
    let code = otpGenerator.generate(4, { alphabets: false, upperCase: false, specialChars: false });
    return code;
  }

module.exports = {sendOtp}
