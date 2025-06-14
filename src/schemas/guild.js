const mongoose = require("mongoose")

const date = mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String, required: true },
	location: { type: String, required: false },
	category: { type: String, required: false },
	timezone: { type: String, required: false, default: "UTC" },
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
