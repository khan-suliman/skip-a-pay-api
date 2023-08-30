const app = require("./app")
const env = require("../src/config/env")

const port = env.PORT

// listen to port
app.listen(port, () => {
  console.log("Server is up on port " + port)
})

// api function - for firebase
// exports.api = functions.https.onRequest(app)

// Export the Express API - for vercel
// module.exports = app
