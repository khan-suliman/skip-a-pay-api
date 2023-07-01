const mongoose = require("mongoose")

const loanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    account_n: {
      type: Number,
      required: true,
    },
    loan_type: {
      type: Number,
      required: true,
    },
    loan_id: {
      type: Number,
      required: true,
    },
    Description: {
      type: String,
      required: true,
      trim: true,
    },
    last_ssn_digits: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Loan = mongoose.model("Loan", loanSchema)

module.exports = Loan
