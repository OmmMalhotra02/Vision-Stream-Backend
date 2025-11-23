import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import app from "./app.js";

dotenv.config({path: './env'})

connectDB()
.then(() => {
    app.on((err) => {
        console.log("DB connected, error before app listen ", err);
        throw err;
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log("Server running at port ", process.env.PORT);
        
    })
})
.catch((err) => {
    console.log("connectDB called, still connection failed ", err);
})

// APPROACH 1 - DB connectiona dn app initilization in one file, all on server start
/*
import mongoose from 'mongoose'
import express from 'express'
import { DB_NAME } from './constants';

const app = express()

;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERR: ", error);
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`App is listening at port: ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.log("ERROR, DB connection failed ", error);
        throw error;
    }
})()
*/