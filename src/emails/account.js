const SibApiV3Sdk = require("sib-api-v3-sdk")
// const env = require("../config/env")

const sendinblueAPIKey = process.env.BREVO_API_KEY

const defaultClient = SibApiV3Sdk.ApiClient.instance

const apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = sendinblueAPIKey

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

const populateUser = async (user) => {
  await user.populate("loan")
  // console.log(user.loan)
  return user.loan
}

// send email when user submitted the form
const sendConfirmationEmail = async (name, email, user) => {
  let loans = await populateUser(user)
  let loan_ids = ""
  let loan_types = ""
  // console.log("loans", loans)

  for (let i = 0; i < loans.length; i++) {
    if (i == 0) {
      loan_ids = loans[i].loan_id
      loan_types = loans[i].loan_type
    } else {
      loan_ids += loan_ids + ", " + loans[i].loan_id
      loan_types += loan_types + ", " + loans[i].loan_type
    }
  }

  try {
    sendSmtpEmail = {
      to: [
        {
          email: email,
          name: name,
        },
      ],
      sender: {
        name: "SkipAPay",
        email: "support@cpdfcu-sap.com",
      },
      subject: "Confirmation of Online Form Submission!",
      htmlContent: `
      Dear <strong>${name}</strong>,
      <br />
      Your application for Skip-A-Pay has been approved*.
      <br />
      <br />
      <h3>Loan Details</h3>
      <br />
      Loan: ${loan_ids}
      <br />
      Loan Description: ${loan_types}
      <br />
      <br />

      Chicago Patrolmen's Federal Credit Union- Happy to Serve You. 

      <br />
      <br />
      <strong>
      *If your loan is not current or your account is not in good standing at the time Skip-A-Pay is applied, you will not be eligible for the promotion. 
      Please save this email for your records. 
      </strong>

      <div align="center">
        <img
          src="https://www.cpdfcu.com/wp-content/uploads/2023/08/2Logos.png"
          alt="Logo"
        />
      </div>
      `,
    }
    sendEmail()
  } catch (e) {
    console.log(e)
  }
}

// send email
const sendEmail = async () => {
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    if (!data) {
      return new Error("Email not sent!")
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  sendConfirmationEmail,
}
