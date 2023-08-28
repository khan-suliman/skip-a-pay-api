const express = require("express")
const Loan = require("../models/loan")
const auth = require("../middleware/auth")
const multer = require("multer")
const csv = require("csv-parser")
const fs = require("fs")
const { PassThrough } = require("stream")

const router = new express.Router()

const upload = multer({
  // storage: multer.memoryStorage(),
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

// read CSV file without saving file in server
const readCSVFile = async (file, _id) => {
  // Read the file contents
  const results = []
  return new Promise((resolve, reject) => {
    // Create a readable stream from the buffer
    const readableStream = new PassThrough()
    readableStream.end(file.buffer)

    // Read the file contents using csv-parser
    readableStream
      .pipe(csv())
      .on("data", (data) => {
        // console.log(data)
        const newData = {
          name: data.name.trim(),
          account_number: data.account_number.trim(),
          loan_type: data.loan_type.trim(),
          loan_id: data.loan_id.trim(),
          Description: data.Description.trim(),
          last_ssn_digits: data.last_ssn_digits.trim(),
        }
        results.push({ ...newData, owner: _id })
      })
      .on("end", async () => {
        try {
          // console.log(results)
          // add csv file data to the database

          const loan = await Loan.insertMany(results)
          if (!loan) {
            console.error("Loan not added to the database.")
            reject("Loan not added to the database.")
          }

          // return uploaded data
          resolve(loan)
          // resolve(loan)
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
    const csvFile = req.file

    // Check if file exists
    if (!csvFile) {
      return res.status(400).json({ error: "No file uploaded" })
    }
    // const loans = await readCSVFile(csvFile)

    // const loans = await readCSVFile(csvFile, req.admin._id)
    await readCSVFile(csvFile, req.admin._id)

    res.status(201).send()
  } catch (err) {
    // if (err.name === "ValidationError") {
    //   return res.status(400).json({
    //     error:
    //       "The file field does not match the required format or contains missing values.",
    //   })
    // }
    res.status(400).send({ error: err })
  }
})

// const upload = multer({
//   dest: "uploads",
//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },
//   fileFilter(req, file, cb) {
//     if (!file.originalname.match(/\.(csv|xlsx)$/)) {
//       return cb(new Error("please upload a csv."))
//     }

//     cb(undefined, true)
//   },
// })

// const readCSVFile = async (file, _id) => {
//   const results = []
//   return new Promise((resolve, reject) => {
//     fs.createReadStream(file)
//       .pipe(csv())
//       .on("data", (data) => results.push({ ...data, owner: _id }))
//       .on("end", async () => {
//         try {
//           // add csv file data to the database
//           const loan = await Loan.insertMany(results)

//           if (!loan) {
//             console.error("Loan not added to the database.")
//             reject("Loan not added to the database.")
//           }

//           // delete the uploaded file after data saved to the database
//           fs.unlink(file, (err) => {
//             if (err) {
//               console.error("Error deleting file.", err)
//             }
//           })

//           // return uploaded data
//           resolve(loan)
//         } catch (error) {
//           reject(error)
//         }
//       })
//   })
// }
// // upload loan csv
// router.post("/loans", auth, upload.single("loan"), async (req, res) => {
//   // const csvFile = req.file.buffer

//   try {
//     const csvFile = req.file.path

//     const loans = await readCSVFile(csvFile, req.admin._id)

//     res.status(201).send(loans)
//   } catch (err) {
//     if (err.name === "ValidationError") {
//       return res.status(400).json({
//         error:
//           "The file field does not match the required format or contains missing values.",
//       })
//     }
//     res.status(400).send({ error: err.message })
//   }
// })

// get all loans
router.get("/loans", auth, async (req, res) => {
  // count total number of docs
  const countDocs = await Loan.countDocuments({})

  if (req.query.count) {
    return res.send({ count: countDocs })
  }

  const pageLimit = req.query.limit // Number of documents per page
  const pageNumber = req.query.skip // Current page number
  let search = req.query.search
  let pageSkip = 0

  if (pageNumber > 0 && pageLimit > 0) {
    pageSkip = pageLimit * (pageNumber - 1)
  }

  let query = {}

  if (search) {
    // Search for documents where field is equal to (number) or (string) or any other type or field
    const regexNum = /^[1-9]\d*$/
    const regexStr = /^[A-Za-z\s]+$/

    // Create a regular expression with the 'i' flag for case-insensitive search
    const searchRegex = new RegExp(search, "i")
    query = {
      $or: [
        { account_number: regexNum.test(search) ? search : null },
        { loan_id: regexNum.test(search) ? search : null },
        { name: regexStr.test(search) ? searchRegex : null },
      ],
    }
  }

  const totalFound = await Loan.countDocuments(query)

  const loans = await Loan.find(query)
    .populate("owner")
    .limit(pageLimit)
    .skip(pageSkip)

  if (!loans) {
    return res.status(404).send()
  }

  res.send({ loans, count: countDocs, totalFound })
})

// delete the user, only for admins
router.delete("/loans/:id", auth, async (req, res) => {
  try {
    const loan = await Loan.deleteOne({ _id: req.params.id })
    res.status(202).send(loan)
  } catch (e) {
    res.status(500).send(e)
  }
})

// delete all users, only for admins
router.delete("/loans", auth, async (req, res) => {
  try {
    const loan = await Loan.deleteMany({})
    res.status(202).send(loan)
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
