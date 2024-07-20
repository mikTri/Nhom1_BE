// role:
    // 1: admin
    // 2: supervisor
    // 3: staff


const mongoose = require('mongoose');

const staffSchema = mongoose.Schema({
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
    images:[{
            type:String,
            required:true
        }],
    role:{
        type: Number,
        default: false
        },
    createdDate:{
            type: Date,
            default: Date.now,
            }
})

staffSchema.virtual('id').get(function () { return this._id.toHexString(); });
staffSchema.set('toJSON', { virtuals: true, });


exports.Staff = mongoose.model('Staff', staffSchema);
exports.staffSchema = staffSchema;