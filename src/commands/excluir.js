const { SlashCommandBuilder, time, ButtonBuilder } = require("discord.js")
const guildSchema = require("../schemas/guild.js")
const { paginate } = require("../utils/functions.js")
const {
	Types: { ObjectId },
} = require("mongoose")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("excluir")
		.setNameLocalizations({
			"en-US": "delete",
			"es-ES": "eliminar",
		})
		.setDescription("Excluir um evento agendado")
		.setDescriptionLocalizations({
			"en-US": "Delete a scheduled event",
			"es-ES": "Eliminar un evento programado",
		})
		.addStringOption((option) =>
			option
				.setName("evento")
				.setNameLocalizations({
					"en-US": "event",
					"es-ES": "evento",
				})
				.setDescription("O nome do evento que você quer excluir")
				.setDescriptionLocalizations({
					"en-US": "The name of the event you want to delete",
					"es-ES": "El nombre del evento que quieres eliminar",
				})
				.setMinLength(1)
		),
	execute: async ({ interaction, instance, args }) => {
		await interaction.deferReply()
		try {
			if (interaction.options) {
				const eventName = interaction.options.getString("evento")

				//the name will always be provided, so no need to check for null
				var { dates } = (
					await guildSchema.aggregate([
						{ $match: { dates: { $elemMatch: { name: eventName } } } },
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
				const documentID = new ObjectId(args[0])

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
						.setStyle("Danger")
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
					new ButtonBuilder().setEmoji("⬅️").setCustomId(ids[0]).setStyle("Secondary"),
					new ButtonBuilder().setEmoji("➡️").setCustomId(ids[1]).setStyle("Secondary"),
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
				await guildSchema.updateOne({ "dates._id": dates[0]._id }, { $pull: { dates: { _id: dates[0]._id } } })
				await interaction.editReply({
					content: instance.getMessage(interaction, "EVENT_DELETED", { NAME: dates[0].name }),
				})
			}
		} catch (error) {
			console.error(`excluir: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
