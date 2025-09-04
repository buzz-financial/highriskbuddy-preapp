// const bcrypt = require("bcrypt");
// const mongoose = require("mongoose");

// mongoose.connect("mongodb+srv://alecsearle:ixEzRzLa3UiF3dsI@apexapp.kljz2.mongodb.net/?retryWrites=true&w=majority&appName=ApexApp", {
//   dbName: "fridge",
// });

// const Veggie = mongoose.model("Veggie", {
//   name: {
//     type: String,
//     required: true,
//   },
//   color: {
//     type: String,
//     required: true,
//   },
//   rating: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 10,
//   },
//   good: {
//     type: Boolean,
//     required: true,
//   },
//   createdAt: {
//     type: Date,
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
// });

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     unique: true,
//   },
//   encryptedPassword: {
//     type: String,
//   },
//   firstName: {
//     type: String,
//   },
//   lastName: {
//     type: String,
//   },
// });

// userSchema.methods.setEncryptedPassword = function (plainPassword) {
//   let promise = new Promise((resolve, reject) => {
//     // this is the promise function
//     // resolve and reject are also functions.
//     bcrypt.hash(plainPassword, 12).then((hash) => {
//       console.log(`hashed pw: `, hash);
//       this.encryptedPassword = hash;
//       resolve();
//     });
//   });
//   // return the promise for future
//   return promise;
// };

// userSchema.methods.verifyEncryptedPassword = function (plainPassword) {
//   let promise = new Promise((resolve, reject) => {
//     bcrypt.compare(plainPassword, this.encryptedPassword).then((result) => {
//       resolve(result);
//     });
//   });
//   // return the promise for future
//   return promise;
// };

// const User = mongoose.model("User", userSchema);

// module.exports = {
//   User,
//   Veggie, //shorthand for Veggie: Veggie
// };
