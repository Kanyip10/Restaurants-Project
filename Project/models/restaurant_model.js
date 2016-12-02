var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restaurantSchema = new Schema({
	address : {
		street : {type : String},
		zipcode : {type : String},
		building : {type : String},
		coord : [{type : String}]
	},
	borough : {type : String},
	cuisine : {type : String},
	grades : [{
		marker : {type : String},
		score : {type : Number, min : 1, max : 10}
	}],
	name : {type : String, required : true},
	restaurantid : {type : String},
	photo :{ 
     	data: {type : Buffer}, 
     	contentType: {type : String}
  	},
  	owner : {type : String, required : true}
});
mongoose.model('Restaurant', restaurantSchema);
