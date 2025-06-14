const { SlashCommandBuilder, time, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const guildSchema = require("../schemas/guild.js")
const { paginate } = require("../utils/functions.js")
const {
	Types: { ObjectId },
} = require("mongoose")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ver")
		.setNameLocalizations({
			"en-US": "view",
			"es-ES": "ver",
		})
		.setDescription("Veja um evento agendado")
		.setDescriptionLocalizations({
			"en-US": "See a scheduled event",
			"es-ES": "Ver un evento programado",
		})
		.addStringOption((option) =>
			option
				.setName("evento")
				.setNameLocalizations({
					"en-US": "event",
					"es-ES": "evento",
				})
				.setDescription("O nome do evento que você quer ver")
				.setDescriptionLocalizations({
					"en-US": "The name of the event you want to see",
					"es-ES": "El nombre del evento que quieres ver",
				})
				.setMinLength(1)
				.setRequired(true)
		),
	execute: async ({ interaction, instance, args }) => {
		await interaction.deferReply()
		try {
			if (interaction.options) {
				const eventName = interaction.options.getString("evento")

				//the name will always be provided, so no need to check for null
				var { dates } = (
					await guildSchema.aggregate([
						{ $match: { _id: interaction.guildId || interaction.user.id, dates: { $elemMatch: { name: eventName } } } },
						{
							$project: {
								dates: { $filter: { input: "$dates", as: "date", cond: { $eq: ["$$date.name", eventName] } } },
								sort: { $sortArray: { input: "$dates", sortBy: { time: 1 } } },
							},
						},
					])
				)[0] ?? { dates: [] }

				//filter dates to only include future events
				dates = dates.filter((date) => date.time > Date.now())
				if (dates.length === 0) {
					return await interaction.editReply(instance.getMessage(interaction, "NO_EVENT_FOUND", { NAME: eventName }))
				}
			} else {
				const documentID = new ObjectId(interaction.values != undefined ? interaction.values[0] : args[0])

				var { dates } = (
					await guildSchema.aggregate([
						{
							$match: {
								"dates._id": documentID,
							},
						},
						{
							$project: {
								dates: {
									$filter: {
										input: "$dates",
										as: "date",
										cond: { $eq: ["$$date._id", documentID] },
									},
								},
							},
						},
					])
				)[0] ?? { dates: [] }

				if (dates.length === 0) {
					return await interaction.editReply(instance.getMessage(interaction, "NO_EVENT_FOUND_ID"))
				}
			}

			const embeds = []
			const deleteButtons = []
			dates.forEach((date, index) => {
				datePropertiesText = `:round_pushpin: ${instance.getMessage(interaction, "EVENT_LOCATION")}: ${
					date.location ? date.location : instance.getMessage(interaction, "NOT_DEFINED")
				}\n:bookmark_tabs: ${instance.getMessage(interaction, "EVENT_CATEGORY")}: ${
					date.category ? date.category : instance.getMessage(interaction, "NOT_DEFINED")
				}`
				const embed = instance.createEmbed("#FF435B")
				embed.setTitle(
					`:calendar_spiral: ${date.name.length > 230 ? date.name.substring(0, 237) + "..." : date.name} (${time(
						date.time,
						"R"
					)})`
				)
				embed.setDescription(date.description)
				embed.addFields({
					name: instance.getMessage(interaction, "MORE_INFO"),
					value: `${datePropertiesText}`,
					inline: true,
				})

				button = new ButtonBuilder()
					.setCustomId(`excluir ${date._id}`)
					.setStyle(ButtonStyle.Danger)
					.setLabel(instance.getMessage(interaction, "DELETE"))
					.setEmoji("🗑️")

				if (dates.length > 1) {
					embed.data.fields[0].value +=
						dates.length - 1 - index > 0
							? instance.getMessage(interaction, "AND_WITH_SAME_NAME", {
									COUNT: dates.length - 1 - index,
							  })
							: ""
				}

				embeds.push(embed)
				deleteButtons.push(button)
			})

			const paginator = paginate()
			paginator.add(...embeds)
			paginator.addComponents(...deleteButtons)
			const ids = [`${Date.now()}__left`, `${Date.now()}__right`]
			paginator.setTraverser([
				new ButtonBuilder().setEmoji("⬅️").setCustomId(ids[0]).setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setEmoji("➡️").setCustomId(ids[1]).setStyle(ButtonStyle.Secondary),
			])

			const message = await interaction.editReply(paginator.components())

			message.createMessageComponentCollector({ time: 3600000 }).on("collect", async (i) => {
				if (i.customId === ids[0]) {
					await paginator.back()
					await i.update(paginator.components())
				} else if (i.customId === ids[1]) {
					await paginator.next()
					await i.update(paginator.components())
				}
			})
		} catch (error) {
			console.error(`ver: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
