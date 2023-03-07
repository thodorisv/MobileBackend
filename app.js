const fastify = require("fastify")({ logger: false });
const fs = require("fs");

const dataDir = "./data/";

const config = JSON.parse(fs.readFileSync("./config.json"));

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

fastify.addContentTypeParser("*", function (request, payload, done) {
  var data = "";
  payload.on("data", (chunk) => {
    data += chunk;
  });
  payload.on("end", () => {
    done(null, data);
  });
});

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

const start = async () => {
  await fastify.register(import("fastify-raw-body"), {
    field: "rawBody",
    global: true,
    encoding: false,
    runFirst: true,
    routes: [],
  });

  fastify.post("/uploadData", async (request, reply) => {
    var token = request.headers.authorization.split("Bearer ")[1];

    var user = config.users.find((user) => user.token == token);

    if (!user) throw new Error("User not found for this token...");

    let userDirectory = `${dataDir}${user.directory}/`;

    if (!fs.existsSync(userDirectory)) fs.mkdirSync(userDirectory);

    fs.writeFileSync(`${userDirectory}${Date.now()}.zip`, request.rawBody);

    return "ok";
  });

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
