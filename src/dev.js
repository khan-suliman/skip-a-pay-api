const app = require("./app")
const env = require("./config/env")

const port = env.PORT

// listen to port
app.listen(port, () => {
  console.log("Server is up on port " + port)
})
