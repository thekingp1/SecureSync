const selfsigned = require("selfsigned");
const fs = require("fs");

const attrs = [{ name: "commonName", value: "localhost" }];

selfsigned.generate(attrs, { keySize: 2048, days: 365, algorithm: "sha256" })
  .then((pems) => {
    fs.writeFileSync("cert.pem", pems.cert);
    fs.writeFileSync("key.pem", pems.private);
    console.log("cert.pem and key.pem created successfully!");
  })
  .catch(console.error);
