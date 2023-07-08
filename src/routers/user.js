const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");

const router = new express.Router();

// get loan details
router.post("/users/loan", async (req, res) => {
  // console.log("Account Number: ", req.body)

  try {
    const user = await User.getLoanDetails(req.body);
    res.status(200).send(user);
  } catch (e) {
    // res.status(400).send(e)
    res.status(404).send({ error: e.message });
  }
});

// create loan
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();

    res.status(201).send({ user });
  } catch (e) {
    res.status(400).send(e);
  }
});

// get all users, only for admins
router.get("/users", auth, async (req, res) => {
  const users = await User.find({});

  if (!users) {
    return req.status(404).send();
  }

  res.send(users);
});

module.exports = router;
