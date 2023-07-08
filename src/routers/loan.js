const express = require("express")
const Loan = require("../models/loan")
const auth = require("../middleware/auth")
const multer = require("multer")
const csv = require("csv-parser")
const fs = require("fs")
const { resolve } = require("path")

const router = new express.Router()

const upload = multer({
  dest: "uploads",
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(csv|xlsx)$/)) {
      return cb(new Error("please upload a csv."))
    }

    cb(undefined, true)
  },
})

const readCSVFile = async (file, _id) => {
  const results = []
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (data) => results.push({ ...data, owner: _id }))
      .on("end", async () => {
        try {
          // add csv file data to the database
          const loan = await Loan.insertMany(results)

          if (!loan) {
            console.error("Loan not added to the database.")
            reject("Loan not added to the database.")
          }

          // delete the uploaded file after data saved to the database
          fs.unlink(file, (err) => {
            if (err) {
              console.error("Error deleting file.", err)
            }
          })

          // return uploaded data
          resolve(loan)
        } catch (error) {
          reject(error)
        }
      })
  })
}
// upload loan csv
router.post("/loans", auth, upload.single("loan"), async (req, res) => {
  // const csvFile = req.file.buffer

  try {
    const csvFile = req.file.path

    const loans = await readCSVFile(csvFile, req.admin._id)

    res.status(201).send(loans)
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error:
          "The file field does not match the required format or contains missing values.",
      })
    }
    res.status(400).send({ error: err.message })
  }
})

// get all loans
router.get("/loans", auth, async (req, res) => {
  let days = req.query.days
  let query = {}

  if (days) {
    console.log("days: ", days)

    // Get the current date
    const currentDate = new Date()

    // Calculate the date n days ago
    const nDaysAgo = new Date()
    nDaysAgo.setDate(currentDate.getDate() - days)

    // Construct the query for the last n days
    query = { createdAt: { $gte: nDaysAgo, $lte: currentDate } }
  }

  // Execute the query
  const loans = await Loan.find(query)

  if (!loans) {
    return res.status(404).send()
  }

  res.send(loans)
})

// // get all loans by days
// router.get("/loans/days", auth, async (req, res) => {
//   let days = req.query.days
//   let query = {}

//   if (days) {
//     console.log("days: ", days)

//     // Get the current date
//     const currentDate = new Date()

//     // Calculate the date n days ago
//     const nDaysAgo = new Date()
//     nDaysAgo.setDate(currentDate.getDate() - days)

//     // Construct the query for the last n days
//     query = { createdAt: { $gte: nDaysAgo, $lte: currentDate } }
//   }

//   // Execute the query
//   const loans = await Loan.find(query)

//   if (!loans) {
//     return res.status(404).send()
//   }

//   res.send({ loans, length: loans.length, days })
// })

module.exports = router
