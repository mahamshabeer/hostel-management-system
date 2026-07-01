const mongoose = require("mongoose");
const Admin = require("./models/Admin");

mongoose.connect("mongodb://127.0.0.1:27017/hostelDB");

const createAdmin = async () => {
  try {
    await Admin.create({
      username: "admin",
      password: "admin123"
    });

    console.log("Admin created successfully");
    mongoose.connection.close();
  } catch (err) {
    console.log(err);
  }
};

createAdmin();