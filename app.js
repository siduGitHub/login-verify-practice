const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')

app.use(express.json())
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Erro${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const bcrypt = require('bcrypt')

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
    SELECT * FROM user WHERE username="${username}";
  `
  const dbUser = await db.get(selectUserQuery)
  console.log(dbUser.username)

  if (dbUser.username === undefined) {
    const createUserQuery = `
      INSERT INTO user(username,name,password,gender,location)
      VALUES(
        "${username}",
        "${name}",
        "${hashedPassword}",
        "${gender}",
        "${location}"
      );
    `
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

///Api 2 login///

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
    SELECT * FROM user WHERE username="${username}";
  `
  const dbUser = await db.get(selectUserQuery)
  //console.log(dbUser.username)
  console.log(username)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatch) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

/// API 3///

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `
      SELECT * FROM user WHERE username="${username}";
    `
  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatch) {
      const passwordLength = newPassword.length
      if (passwordLength < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashNewPassword = bcrypt.hash(newPassword, 10)
        const updatePassword = `
          UPDATE user SET password='${hashNewPassword}' WHERE username="${username}";
        `
        await db.run(updatePassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
