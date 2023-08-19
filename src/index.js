const app = require("./app")
const env = require("./config/env")

const port = env.PORT

if (port) {
  // listen to port
  app.listen(port, () => {
    console.log("Server is up on port " + port)
  })
} else {
  console.log("Port not availble")
}
