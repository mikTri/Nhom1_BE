const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
        },
    phone:{
        type:String,
        required:true,
        unique:true
        },
    address:{
        type:String,
        required:true,
        unique:false
        },
    email:{
        type:String,
        required:true,
        unique:true
        },
    password:{
        type:String,
        required:true
        },
    isAdmin:{
        type: Boolean,
        default: 0
        },
    images:[{
        type:String,
        required:true
    }],
    createdDate:{
            type: Date,
            default: Date.now,
            }
})

userSchema.virtual('id').get(function () { return this._id.toHexString(); });
userSchema.set('toJSON', { virtuals: true, });


exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;


