const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.json([
        {
            id: 1,
            employeename: "John Doe",
            employeesalary: 50000
        },
        {
            id: 2,
            employeename: "Jane Smith",
            employeesalary: 60000
        },
        {
            id: 3,
            employeename: "Victor Lee",
            employeesalary: 90000
        }
    ]);
});

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});