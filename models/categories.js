const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        // unique:true
    },
    ctnBook:{
        type:Number,
        required:true,
        default: 0
    }
})

exports.Category = mongoose.model('Category', categorySchema);


// const mongoose = require('mongoose');

// const categorySchema = mongoose.Schema({
//     name:{
//         type:String,
//         required:true
//     },
//     ctnBook:{
//         type:Number,
//         required:true
//     }
// })

// categorySchema.virtual('id').get(function () { return this._id.toHexString(); });
// categorySchema.set('toJSON', { virtuals: true, });


// exports.Categories = mongoose.model('Categories', categorySchema);
// exports.categorySchema = categorySchema;


