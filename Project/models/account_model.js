var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var accountSchema = new Schema({
	userid : {type : String, required : true, unique : true},
	password : {type : String}
});
mongoose.model('Account', accountSchema);

