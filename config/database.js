const mongoose = require("mongoose");

require("dotenv").config();

exports.connect =()=>{ 
    mongoose.connect(process.env.DATABASE_URL,
    // {
    //     useNewUrlParser : true,
    //     useUnifiedTopology:true
    // }
    )
    .then(()=>{
        console.log("Database is connected")
    })
    .catch((err)=>{
        console.error(err);
        console.log("Database is not connect")
        process.exit(1);
    })
}