// /backend/data.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our data base's data structure 
const NodeSchema = new Schema(
    {
	_id: "Number",
	factors: ["Number"],
	class: "String",
	modules: ["Number"]
    },
    { timestamps: true }
);

const ModuleSchema = new Schema(
    {
	_id: "Number",
	loc: {"chrom": "String", "start": "Number", "end": "Number"},
	cell: "String",
	node: "Number",
	factors: ["String"],
	orth_type: "Number",
	maps_to: {"chrom": "String", "start": "Number", "end": "Number"},
	locus: "Number"
    },
    { timestamps: true }
);

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("Data", NodeSchema, ModuleSchema);
