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
		),
	execute: async ({ interaction, instance }) => {
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
				const documentID = new ObjectId(interaction.values[0])

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
				)[0]
			}

			if (dates.length > 1) {
				const embeds = []
				const deleteButtons = []
				dates.forEach((date, index) => {
					const embed = instance.createEmbed("#FF435B")
					embed.addFields({
						name: `${date.name} ${time(date.time, "R")}`,
						value: date.description,
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
			} else {
				const embed = instance.createEmbed("#FF435B")
				embed.addFields({
					name: `${dates[0].name} ${time(dates[0].time, "R")}`,
					value: dates[0].description,
				})

				button = new ButtonBuilder()
					.setCustomId(`excluir ${dates[0]._id}`)
					.setStyle(ButtonStyle.Danger)
					.setLabel(instance.getMessage(interaction, "DELETE"))
					.setEmoji("🗑️")

				const row = new ActionRowBuilder().addComponents(button)

				await interaction.editReply({
					embeds: [embed],
					components: [row],
				})
			}
		} catch (error) {
			console.error(`ver: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
