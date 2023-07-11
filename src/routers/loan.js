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
        results.push({ ...data, owner: _id })
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
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error:
          "The file field does not match the required format or contains missing values.",
      })
    }
    res.status(400).send({ error: err.message })
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
  const pageLimit = req.query.limit // Number of documents per page
  const pageNumber = req.query.skip // Current page number
  let pageSkip = 1

  if (pageNumber > 0 && pageLimit > 0) {
    pageSkip = pageLimit * (pageNumber - 1)
  }

  // count total number of docs
  const countDocs = await Loan.countDocuments({})

  const loans = await Loan.find({})
    .populate("owner")
    .limit(pageLimit)
    .skip(pageSkip)

  if (!loans) {
    return res.status(404).send()
  }

  res.send({ loans, count: countDocs })
})

module.exports = router
