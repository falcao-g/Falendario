const { Client, GatewayIntentBits, Collection } = require("discord.js")
const path = require("path")
require("dotenv").config()
const { loadEvents } = require("./handlers/eventHandler.js")
const { loadCommands } = require("./handlers/commandHandler.js")

class Falbot {
	config = require("./config.json")
	_disabledChannels = new Map()
	client = new Client({
		intents: [GatewayIntentBits.Guilds],
	})

	constructor() {
		this.client.on("ready", () => {
			console.log("Bot online")

			this.client.events = new Collection()
			this.client.commands = new Collection()

			loadEvents(this, this.client)
			loadCommands(this, this.client)
		})

		this.client.login(process.env.TOKEN)

		setInterval(() => {
			this.client.user.setActivity("mabe by grupo 8")
		}, 1000 * 60 * 1)
	}
}

Falbot = new Falbot()
