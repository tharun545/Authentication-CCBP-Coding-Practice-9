const express = require("express");

const { open } = require("sqlite");

const bcrypt = require("bcrypt");

const sqlite3 = require("sqlite3");

const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const startDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000");
    });
  } catch (err) {
    process.exit(1);
  }
};
startDBAndServer();

//API 1 POST register Method

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUser = `SELECT * FROM user WHERE username = '${username}';`;
  const hashedPassword = await bcrypt.hash(password, 10);
  //   console.log(hashedPassword);
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    const addUserQuery = `INSERT INTO user (username, name, password, gender, location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}')`;
    await db.run(addUserQuery);
    response.send("User created successfully");
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

//API 2 POST login Method

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  //   const hashedPassword = await bcrypt.hash(password, 10);
  const getUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUser);
  if (dbUser !== undefined) {
    const isPasswordVerified = await bcrypt.compare(password, dbUser.password);
    if (isPasswordVerified === true) {
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  } else {
    response.status = 400;
    response.send("Invalid user");
  }
});

//API 3 PUT Method to change the password of a user
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("User not registered");
  } else {
    const isPasswordVerified = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordVerified === true) {
      if (newPassword.length < 5) {
        response.status = 400;
        response.send("Password is too short");
      } else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `UPDATE user SET password = '${hashedNewPassword}' WHERE username = '${username}';`;
        await db.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
