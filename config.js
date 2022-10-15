const config = {
    MONGO_DB_URL:"mongodb://localhost:27017/cepteharclik",
    MONGO_DB_URL_DEBUG:"mongodb+srv://paramania:paramania11@cluster0.cwwko8b.mongodb.net/paramania?retryWrites=true&w=majority",
    PORT:process.env.PORT || 3300,
    PRIVATE_KEY:"ghnbmsncbfge18744645",
    API_ROUTE:"api/",
    MIN_PASSWORD_LENGTH:6,
    AUTHORIZATION:"Bearer ",
    PROD:false
}
module.exports = config
