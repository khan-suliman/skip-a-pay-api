const express = require("express")
const User = require("../models/user")
const auth = require("../middleware/auth")
const Loan = require("../models/loan")

const router = new express.Router()

// get loan details
router.post("/users/loan", async (req, res) => {
  try {
    const user = await User.getLoanDetails(req.body)
    res.status(200).send(user)
  } catch (e) {
    // res.status(400).send(e)
    res.status(404).send({ error: e.message })
  }
})

// create loan
router.post("/users", async (req, res) => {
  try {
    const loan = await User.getLoanDetails(req.body)

    if (loan.loan) {
      throw new Error("Already Applied.")
    }

    const user = new User(req.body)
    await user.save()
    res.status(201).send(user)
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

// get all users, only for admins
router.get("/users", auth, async (req, res) => {
  let days = req.query.days
  let count = req.query.count

  // send count by last n number of days
  if (count && days) {
    let query = User.filterByDays(days)
    // count total number of docs
    const daysCount = await User.countDocuments(query)
    const countDocs = await User.countDocuments({})

    return res.send({ count: countDocs, daysCount })
  }

  // send count only
  if (count) {
    // count total number of docs
    const countDocs = await User.countDocuments({})
    return res.send({ count: countDocs })
  }

  const pageLimit = req.query.limit // Number of documents per page
  const pageNumber = req.query.skip // Current page number
  let pageSkip = 0

  if (pageNumber > 0 && pageLimit > 0) {
    pageSkip = pageLimit * (pageNumber - 1)
  }

  let query = User.filterByDays(days)

  // count total number of docs
  const countDocs = await User.countDocuments({})
  const daysCount = await User.countDocuments(query)

  const users = await User.find(query)
    .limit(pageLimit)
    .skip(pageSkip)
    .populate("loan")

  if (!users) {
    return res.status(404).send()
  }

  res.send({ users, count: countDocs, daysCount })
})

// donwload users, only for admins
router.get("/users/download", async (req, res) => {
  try {
    const csv = await User.makeCsv(req.query.days)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=data.csv")

    // send csv file
    res.send(csv)
  } catch (e) {
    res.status(404).send({ error: e.message })
  }
})

// delete the user, only for admins
router.delete("/users/:id", auth, async (req, res) => {
  try {
    const user = await User.deleteOne({ _id: req.params.id })
    res.status(202).send(user)
  } catch (e) {
    res.status(500).send(e)
  }
})

// delete all users, only for admins
router.delete("/users", auth, async (req, res) => {
  try {
    const user = await User.deleteMany({})
    res.status(202).send(user)
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
