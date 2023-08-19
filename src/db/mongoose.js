const mongoose = require("mongoose")
const env = require("../config/env")

mongoose.connect(env.MONGODB_URL)
