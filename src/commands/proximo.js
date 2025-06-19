const { SlashCommandBuilder, time, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
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

			datePropertiesText = `:round_pushpin: ${instance.getMessage(interaction, "EVENT_LOCATION")}: ${
				dates[0].location ? dates[0].location : instance.getMessage(interaction, "NOT_DEFINED")
			}\n:bookmark_tabs: ${instance.getMessage(interaction, "EVENT_CATEGORY")}: ${
				dates[0].category ? dates[0].category : instance.getMessage(interaction, "NOT_DEFINED")
			}`
			const embed = instance.createEmbed("#FF435B")
			embed.setTitle(
				`:calendar_spiral: ${
					dates[0].name.length > 230 ? dates[0].name.substring(0, 237) + "..." : dates[0].name
				} (${time(dates[0].time, "R")})`
			)
			embed.setDescription(dates[0].description)
			embed.addFields({
				name: instance.getMessage(interaction, "MORE_INFO"),
				value: `${datePropertiesText}`,
				inline: true,
			})

			button = new ButtonBuilder()
				.setCustomId(`excluir ${dates[0]._id}`)
				.setStyle(ButtonStyle.Danger)
				.setLabel(instance.getMessage(interaction, "DELETE"))
				.setEmoji("🗑️")

			if (dates.length > 1)
				embed.data.fields[0].value += instance.getMessage(interaction, "AND_MORE_EVENTS", { COUNT: dates.length - 1 })

			return await interaction.editReply({
				embeds: [embed],
				components: [new ActionRowBuilder().addComponents(button)],
			})
		} catch (error) {
			console.error(`proximo: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
