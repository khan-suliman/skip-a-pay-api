const mongoose = require("mongoose")
const validator = require("validator")
const Loan = require("./loan")
const csv = require("csv-writer").createObjectCsvStringifier
const moment = require("moment")

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: Number,
      required: true,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("invalid account number!")
        }
      },
    },
    ssnNumber: {
      // last 4 digits of ssn
      type: Number,
      required: true,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("invalid ssn number!")
        }
      },
    },
    phoneNumber: {
      type: Number,
      required: true,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("invalid phone number!")
        }
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid!")
        }
      },
    },
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Loan",
    },
  },
  {
    timestamps: true,
  }
)

userSchema.statics.filterByDays = (days) => {
  if (!days) {
    return {}
  }
  // Get the current date
  const currentDate = new Date()

  // Calculate the date n days ago
  const nDaysAgo = new Date()
  nDaysAgo.setDate(currentDate.getDate() - days)

  // Construct the query for the last n days
  let query = { createdAt: { $gte: nDaysAgo, $lte: currentDate } }

  return query
}

// get loan details for user
userSchema.statics.getLoanDetails = async (currentUser) => {
  const loan = await Loan.find({
    account_number: currentUser.accountNumber,
    last_ssn_digits: currentUser.ssnNumber,
  })

  if (!loan || !loan.length) {
    throw new Error("Loan not available, please try again later.")
  }

  let user = await User.findOne({
    accountNumber: currentUser.accountNumber,
    ssnNumber: currentUser.ssnNumber,
  })

  // populate and return
  if (user) {
    await user.populate("loan")
    return user
  }

  // const userDetails = {
  //   name: user.firstName,
  //   email: user.email,
  //   phone: user.phoneNumber,
  //   accountNumber: user.accountNumber,
  //   ssn: user.ssnNumber,
  //   submittedDate: user.createdAt,
  //   loanType: loan.loan_type,
  //   loanId: loan.loan_id,
  //   loanDesc: loan.Description,
  // }

  return loan
}

// make csv file and return
userSchema.statics.makeCsv = async (days) => {
  let query = User.filterByDays(days)

  const users = await User.find(query).populate("loan")

  if (!users) {
    throw new Error("Users not found.")
  }

  // format data for CSV downloadable file
  const csvJsonData = users.map(({ _id, loan, email, createdAt }) => ({
    ID: _id,
    Name: loan.name,
    Email: email,
    "Account Number": loan.account_number,
    "Loan ID": loan.loan_id,
    "Submitted Date": moment(createdAt).format("MMMM Do, YYYY, h:mm a"),
  }))

  // set headers for CSV
  const csvStringifier = csv({
    header: [
      { id: "ID", title: "ID" },
      { id: "Name", title: "Name" },
      { id: "Email", title: "Email" },
      { id: "Account Number", title: "Account Number" },
      { id: "Loan ID", title: "Loan ID" },
      { id: "Submitted Date", title: "Submitted Date" },
      // Add more headers as needed
    ],
  })

  const csvData =
    csvStringifier.getHeaderString() +
    csvStringifier.stringifyRecords(csvJsonData)

  return csvData
}

const User = mongoose.model("User", userSchema)

module.exports = User
