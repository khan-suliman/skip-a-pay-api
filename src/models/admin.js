const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid!")
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'")
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

adminSchema.methods.toJSON = function () {
  const admin = this

  const adminObject = admin.toObject()

  delete adminObject.password
  delete adminObject.tokens

  return adminObject
}

// generate auth token for user
adminSchema.methods.generateAuthToken = async function () {
  const admin = this
  const token = jwt.sign({ _id: admin._id.toString() }, process.env.JWT_SECRET)

  admin.tokens = admin.tokens.concat({ token })
  await admin.save()

  return token
}

// our own method for login the users
adminSchema.statics.findByCredentials = async (email, password) => {
  const admin = await Admin.findOne({ email })

  if (!admin) {
    throw new Error("Unable to login")
  }

  const isMatch = await bcrypt.compare(password, admin.password)

  if (!isMatch) {
    throw new Error("Unable to login")
  }

  return admin
}

// hash the plain text password before saving
// run before 'save()' method
adminSchema.pre("save", async function (next) {
  const admin = this

  if (admin.isModified("password")) {
    // run only if new user created or password field changed
    admin.password = await bcrypt.hash(admin.password, 8)
  }

  //run save
  next()
})

const Admin = mongoose.model("Admin", adminSchema)

module.exports = Admin
