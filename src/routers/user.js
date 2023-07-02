const express = require("express")
const User = require("../models/user")
const auth = require("../middleware/auth")

const router = new express.Router()

// create user, get loan details
router.post("/users/loan", async (req, res) => {
  // console.log("Account Number: ", req.body)

  try {
    const user = await User.getLoanDetails(req.body)
    res.status(200).send(user)
  } catch (e) {
    console.log(e)
    // res.status(400).send(e)
    res.status(404).send({ error: e.message })
  }
})

// get all users, only for admins
router.get("/users", auth, async (req, res) => {
  const users = await User.find({})

  if (!users) {
    return req.status(404).send()
  }

  res.send(users)
})

module.exports = router
