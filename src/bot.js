const { Client, GatewayIntentBits, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
require("dotenv").config()
const { loadEvents } = require("./handlers/events.js")
const { loadCommands } = require("./handlers/commands.js")

class Falendario {
	_messages = require("./utils/json/messages.json")
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
			this.client.user.setActivity("Te ajudando a lembrar das coisas importantes")
		}, 1000 * 60 * 5)
	}

	createEmbed(color = "Random") {
		return new EmbedBuilder().setColor(color).setFooter({ text: "by Falcão ❤️" })
	}

	getMessage(interaction, messageId, args = {}) {
		const message = this._messages[messageId]
		if (!message) {
			console.error(`Could not find the correct message to send for "${messageId}"`)
			return "Could not find the correct message to send. Please report this to the bot developer."
		}

		var locale = interaction.locale ?? "pt-BR"
		var result = message[locale] ?? message["en-US"]

		for (const key of Object.keys(args)) {
			const expression = new RegExp(`{${key}}`, "g")
			result = result.replace(expression, args[key])
		}

		return result
	}
}

Falendario = new Falendario()
