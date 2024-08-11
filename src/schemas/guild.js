const mongoose = require("mongoose")

const date = mongoose.Schema({
	_id: false,
	name: { type: String, required: true },
	description: { type: String, required: true },
	time: { type: Date, required: true },
})

const guildSchema = mongoose.Schema(
	{
		_id: {
			type: String,
			required: true,
		},
		dates: {
			type: Array,
			of: date,
			default: [],
		},
	},
	{
		versionKey: false,
	}
)

module.exports = mongoose.model("guilds", guildSchema)
