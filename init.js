const { MongoClient } = require('mongodb')
const config = require("./config/config")

const client = new MongoClient(config.db_url)

async function init() {
    const db = await client.db("myproject")
    const users = await db.collection("users")
    await users.insertOne({
        "name": "admin",
        "email": "admin@gmail.com",
        "contact": "8907237553",
        "address": "kochi ,kerala",
        "password": "1234",
        "is_admin": 1,
        "token": "",
        "__v": 0,
        "status": "unbanned",
        "wishlist": [],
        "cart": []
    })
    console.log("admin added")
    client.close()
}

init()
