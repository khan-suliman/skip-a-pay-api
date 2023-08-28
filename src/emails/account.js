const SibApiV3Sdk = require("sib-api-v3-sdk")
const env = require("../config/env")

const sendinblueAPIKey = env.BREVO_API_KEY

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
      <div align="center">
        <img
          src="https://www.cpdfcu.com/wp-content/uploads/2023/08/2Logos.png"
          alt="Logo"
        />
      </div>
      <br />
      Hi <strong>${name}</strong>,
      <br />
      <br />
      Thank you for submittion of your form with us. We will be in touch shortly regarding your request.
      <br />
      <br />
      <strong>Best regards</strong>
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
