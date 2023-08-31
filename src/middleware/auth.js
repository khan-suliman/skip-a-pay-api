const jwt = require("jsonwebtoken")
const Admin = require("../models/admin")
// const env = require("../config/env")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "")

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const admin = await Admin.findOne({
      _id: decoded._id,
      "tokens.token": token,
    })

    if (!admin) {
      throw new Error()
    }

    // give route handler access to the user that we already fetched from database
    req.token = token
    req.admin = admin
    next()
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." })
  }
}

module.exports = auth
