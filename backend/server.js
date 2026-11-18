const express = require("express");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 5001

const codes_storage = []

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

function generateCode() {

    let code = "";

    for(let i = 0; i < 6; i++){
        let temp = crypto.randomInt(chars.length)
        code += chars[temp]
    }
    return code
}


app.get("/", (request, response) => {
    console.log("GET / received");
    response.send("FileDrop backend is working!");
});

app.post("/api/transfers", (request, response) => {

    const code = generateCode();

    const sent = { code : code }

    codes_storage.push(code)

    response.json(sent);
    console.log(codes_storage)
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});