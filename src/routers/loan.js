const express = require("express");
const Loan = require("../models/loan");
const auth = require("../middleware/auth");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const router = new express.Router();

const upload = multer({
  dest: "uploads",
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(csv|xlsx)$/)) {
      return cb(new Error("please upload a csv."));
    }

    cb(undefined, true);
  },
});

const readCSVFile = (file) => {
  const results = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      // console.log(results.length)
      // console.log(results)

      try {
        await Loan.insertMany(results);
      } catch (e) {
        console.error("Error saving loan", e);
      }

      // results.forEach(async (e) => {
      //   console.log("e", e.name)

      //   const loan = new Loan(e)
      //   try {
      //     await loan.save()
      //   } catch (e) {
      //     console.error("Error saving loan", e)
      //   }
      // })

      // const loan = new Loan.insertMany(results)

      fs.unlink(file, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    });
};
// upload loan csv
router.post("/loans", upload.single("loan"), async (req, res) => {
  try {
    // const csvFile = req.file.buffer
    const csvFile = req.file.path;

    const results = readCSVFile(csvFile);

    res.send(csvFile);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// get all loans
router.get("/loans", async (req, res) => {
  const loans = await Loan.find({});

  if (!loans) {
    return res.status(404).send();
  }

  res.send(loans);
});

module.exports = router;
