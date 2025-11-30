//APPROACH 2 - DB connection in another file

import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log("DB connection successful, connectionInstance object: \n", connectionInstance);

        console.log("DB connection successful, DB host: ", connectionInstance.connection.host);
        
    } catch (error) {
        console.log("MongoDB connection failed ", error);
        process.exit(1)
    }
}

export default connectDB