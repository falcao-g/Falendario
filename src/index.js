const { Client, GatewayIntentBits, Collection } = require("discord.js")
const dates = require("./dates.json")
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
			const temp = new Date()
			const currentDate = new Date(
				`${temp.getFullYear()}-${
					Number(temp.getMonth() + 1) < 10
						? "0" + Number(temp.getMonth() + 1)
						: Number(temp.getMonth() + 1)
				}-${
					Number(temp.getDate()) < 10
						? "0" + Number(temp.getDate())
						: temp.getDate()
				}T00:00:00.000Z`
			)
			let closestDate = null
			let closestTitle = null
			let daysUntil = null
			for (const date of dates.dates) {
				const eventDate = new Date(date.date)

				if (eventDate < currentDate) {
					continue // Ignore dates that have already passed
				}

				if (closestDate === null || eventDate < closestDate) {
					closestDate = eventDate
					closestTitle = date.title
				}
			}
			if (closestDate === null) {
				this.client.user.setActivity("Calendário limpo! :grin:")
			} else {
				daysUntil = Math.floor(
					(closestDate - currentDate) / (1000 * 60 * 60 * 24)
				)

				if (daysUntil === 0) {
					this.client.user.setActivity(`Hoje - ${closestTitle}!`)
				} else {
					this.client.user.setActivity(
						`Faltam ${daysUntil} dias - ${closestTitle}`
					)
				}
			}
		}, 1000 * 60 * 1)
	}
}

Falbot = new Falbot()
