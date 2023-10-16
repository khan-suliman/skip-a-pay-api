const express = require("express")
const User = require("../models/user")
const auth = require("../middleware/auth")
const { sendConfirmationEmail } = require("../emails/account")
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

    if (req.body.loan.length < 1) {
      throw new Error("Please select any loan to apply!")
    }

    // populate loan, and add it to user data
    const loanData = await Loan.populateLoan(req.body.loan)
    req.body.loan = loanData

    const user = new User(req.body)
    // const user = new User(userData)
    await user.save()

    sendConfirmationEmail(user.firstName, user.email, user)

    res.status(201).send(user)
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

// update loan
router.patch("/users", async (req, res) => {
  try {
    await User.getLoanDetails(req.body)

    let user = await User.findOne({
      accountNumber: req.body.accountNumber,
      ssnNumber: req.body.ssnNumber,
    })

    // populate loan, and add it to user data
    const loanData = await Loan.populateLoan(req.body.loan)

    // update loan only
    // user.loan = req.body.loan
    user.loan = loanData
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
  let search = req.query.search

  // const regexNums = /^[1-9]\d*$/
  // console.log(regexNums.test(search) ? "its number" : "its not a number")
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

  let query = {}

  if (search) {
    // Search for documents where field is equal to (number) or (string) or any other type or field
    const regexNum = /^[1-9]\d*$/
    const regexStr = /^[A-Za-z\s]+$/
    const regexEmail = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/

    // Create a regular expression with the 'i' flag for case-insensitive search
    const searchRegex = new RegExp(search, "i")
    query = {
      $or: [
        { accountNumber: regexNum.test(search) ? parseInt(search) : null },
        { firstName: regexStr.test(search) ? searchRegex : null },
        { lastName: regexStr.test(search) ? searchRegex : null },
        { email: regexEmail.test(search) ? searchRegex : null },
      ],
    }
  } else {
    query = User.filterByDays(days)
  }

  // count total number of docs
  const countDocs = await User.countDocuments({})
  const daysCount = await User.countDocuments(query)

  const sort = { createdAt: -1 } // Sort by createdAt field in descending order (newest first)

  const users = await User.find(query)
    .limit(pageLimit)
    .skip(pageSkip)
    .sort(sort)
  // .populate("loan") // FIXME: no need to populate loan any more

  if (!users) {
    return res.status(404).send()
  }

  res.send({ users, count: countDocs, daysCount })
})

// donwload users, only for admins
router.get("/users/download", auth, async (req, res) => {
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

// update all loans automatically
router.patch("/users/update", auth, async (req, res) => {
  try {
    let user = await User.findOne({
      accountNumber: req.body.accountNumber,
    })

    // console.log(user)

    let loans = await Loan.find({
      account_number: user.accountNumber,
      last_ssn_digits: user.ssnNumber,
    })

    // console.log(loans)

    if (!user.loan || !user.loan[0]?.loan_id) {
      user.loan = loans
      await user.save()
    }
    res.send({ user, loans })
  } catch (error) {
    return res.send(error)
  }
})

module.exports = router
