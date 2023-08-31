const SibApiV3Sdk = require("sib-api-v3-sdk")
// const env = require("../config/env")

const sendinblueAPIKey = process.env.BREVO_API_KEY

const defaultClient = SibApiV3Sdk.ApiClient.instance

const apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = sendinblueAPIKey

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

// send email when user submitted the form
const sendConfirmationEmail = (email, name) => {
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
      <br />

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
