const mongoose = require("mongoose")
const validator = require("validator")
const Loan = require("./loan")

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

userSchema.statics.getLoanDetails = async (currentUser) => {
  const loan = await Loan.find({
    account_n: currentUser.accountNumber,
    last_ssn_digits: currentUser.ssnNumber,
  })

  if (!loan) {
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

const User = mongoose.model("User", userSchema)

module.exports = User
