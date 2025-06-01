const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js")
require("dotenv").config()
const { loadEvents } = require("./handlers/events.js")
const { loadCommands } = require("./handlers/commands.js")

class Falendario {
	config = require("./config.json")
	database = require("./handlers/database.js")

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
			this.client.user.setActivity("Te ajudando a lembrar das coisas importantes", { type: "WATCHING" })
		}, 1000 * 60 * 1)
	}

	createEmbed(color = "Random") {
		return new EmbedBuilder().setColor(color).setFooter({ text: "by Falcão ❤️" })
	}
}

Falendario = new Falendario()
