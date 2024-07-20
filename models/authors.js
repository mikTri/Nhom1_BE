const mongoose = require('mongoose');

const authorsSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    ctnBook:{
        type:Number,
        required:true,
        default: 0
    },
    isNominated:{
        type:Boolean,
        required:true,
        default: false
    }
})

authorsSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

authorsSchema.set('toJSON', {
    virtuals: true,
});

exports.Authors = mongoose.model('Authors', authorsSchema);
exports.authorsSchema = authorsSchema;
