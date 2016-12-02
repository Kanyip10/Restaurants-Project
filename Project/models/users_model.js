var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var UserSchema = new Schema({
	userid : {type : String, required : true, unique : true},
	password : {type : String}
});
mongoose.model('User', UserSchema);
