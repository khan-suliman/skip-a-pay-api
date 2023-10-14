const mongoose = require("mongoose")

const loanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    account_number: {
      type: String,
      required: true,
      trim: true,
    },
    loan_type: {
      type: String,
      required: true,
      trim: true,
    },
    loan_id: {
      type: String,
      required: true,
      trim: true,
    },
    Description: {
      type: String,
      required: true,
      trim: true,
    },
    last_ssn_digits: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
)

// get all loans
const getAllLoans = async (loans) => {
  let loanData = []
  return new Promise((resolve, reject) => {
    loans.forEach(async (loanID, idx) => {
      const loan = await Loan.findById({ _id: loanID })

      loanData.push(loan)

      // return after last data
      if (idx == loans.length - 1) {
        resolve(loanData)
      }
    })
  })
} // getAllLoans

// extract loan data by id and add to user data
loanSchema.statics.populateLoan = async (loan) => {
  let loanData = await getAllLoans(loan)

  // user.loan = loanData

  return loanData
} // populateLoan

const Loan = mongoose.model("Loan", loanSchema)

module.exports = Loan
