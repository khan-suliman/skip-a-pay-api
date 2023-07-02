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
    fileSize: 1000000,
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
        const loan = await Loan.insertMany(results)

        if (!loan) {
          console.error("Error saving loan.")
          reject("Error saving loan.")
        }

        fs.unlink(file, (err) => {
          if (err) {
            console.error("Error deleting file.")
            reject("Error deleting file.")
          }
        })
        resolve(loan)
      })
  })
}
// upload loan csv
router.post("/loans", auth, upload.single("loan"), async (req, res) => {
  // const csvFile = req.file.buffer
  const csvFile = req.file.path

  const loans = await readCSVFile(csvFile, req.admin._id)

  res.status(201).send(loans)
})

// get all loans
router.get("/loans", async (req, res) => {
  const loans = await Loan.find({})

  if (!loans) {
    return res.status(404).send()
  }

  res.send(loans)
})

module.exports = router
