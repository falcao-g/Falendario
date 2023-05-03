const dates = require("../dates.json")
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
	developer: true,
	data: new SlashCommandBuilder()
		.setName("tempo")
		.setDescription("Quanto tempo falta?")
		.setDMPermission(true),
	execute: async ({ interaction }) => {
		await interaction.deferReply()
		try {
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

			const embed = new EmbedBuilder()
				.setColor("#FF435B")
				.setFooter({ text: "❤️ by grupo 8" })

			if (closestDate === null) {
				embed.setTitle(`O calendário está limpo! :grin:`)
			} else {
				daysUntil = Math.floor(
					(closestDate - currentDate) / (1000 * 60 * 60 * 24)
				)

				if (daysUntil === 0) {
					embed.setTitle(`Hoje é o dia da ${closestTitle}!`)
				} else {
					embed.setTitle(
						`Faltam ${daysUntil} dias para a ${closestTitle} :stopwatch:`
					)
				}
			}
			interaction.editReply({ embeds: [embed] })
		} catch (error) {
			console.error(`tempo: ${error}`)
			interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
