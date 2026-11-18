const express = require("express");

const app = express();

const PORT = process.env.PORT || 5001

const codes_storage = []

app.get("/", (request, response) => {
    console.log("GET / received");
    response.send("FileDrop backend is working!");
});

app.post("/api/transfers", (request, response) => {
    const string = "0123456789";
    let code = "";

    for (let i = 0; i < 5; i++) {
        const index = Math.floor(Math.random() * string.length);
        code = code + string[index];
    }

    const sent = { code: code };

    codes_storage.push(code)

    response.json(sent);
    console.log(codes_storage)
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});