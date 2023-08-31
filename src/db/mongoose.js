const mongoose = require("mongoose")
// const env = require("../config/env")

mongoose.connect(process.env.MONGODB_URL)
