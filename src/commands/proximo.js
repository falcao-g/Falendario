const { SlashCommandBuilder, time } = require("discord.js")
const guildSchema = require("../schemas/guild.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("proximo")
		.setNameLocalizations({
			"en-US": "next",
			"es-ES": "siguiente",
		})
		.setDescription("Veja qual o próximo evento marcado")
		.setDescriptionLocalizations({
			"en-US": "See what the next scheduled event is",
			"es-ES": "Ver cuál es el próximo evento programado",
		}),
	execute: async ({ interaction, instance }) => {
		await interaction.deferReply()
		try {
			const documentID = interaction.guildId || interaction.user.id
			var { dates } = (
				await guildSchema.aggregate([
					{ $match: { _id: documentID } },
					{
						$project: {
							dates: {
								$sortArray: {
									input: "$dates",
									sortBy: { time: 1 }, // 1 = ordem crescente, -1 = decrescente
								},
							},
						},
					},
				])
			)[0] ?? { dates: [] }

			if (dates.length === 0) {
				return await interaction.editReply(instance.getMessage(interaction, "CLEAN_CALENDAR"))
			}

			//filter dates to only include future events
			dates = dates.filter((date) => date.time > Date.now())

			if (dates.length === 0) {
				return await interaction.editReply(instance.getMessage(interaction, "NO_FUTURE_EVENTS"))
			}

			const embed = instance.createEmbed("#FF435B").addFields({
				name: `${dates[0].name} ${time(dates[0].time, "R")}`,
				value: dates[0].description,
				inline: true,
			})
			if (dates.length > 1)
				embed.data.fields[0].value += instance.getMessage(interaction, "AND_MORE_EVENTS", { COUNT: dates.length - 1 })

			return await interaction.editReply({
				embeds: [embed],
			})
		} catch (error) {
			console.error(`proximo: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
