const { SlashCommandBuilder, time, ButtonBuilder } = require("discord.js")
const guildSchema = require("../schemas/guild.js")
const { paginate } = require("../utils/functions.js")

module.exports = {
	data: new SlashCommandBuilder().setName("tempo").setDescription("Quanto tempo falta?").setDMPermission(true),
	execute: async ({ interaction, instance, guild }) => {
		await interaction.deferReply()
		const dates = await guildSchema.find({ _id: guild.id }).sort({ "dates.time": 1 })

		if (dates.length === 0) {
			return interaction.editReply("Calendário limpo!")
		}

		//generate an array of embeds with 9 dates each until the end of the array
		let embeds = []
		let embed = instance.createEmbed("#FF435B")
		let count = 0
		for (let i = 0; i < dates[0].dates.length; i++) {
			embed.addFields({
				name: `${dates[0].dates[i].name} ${time(dates[0].dates[i].time, "R")}`,
				value: dates[0].dates[i].description,
				inline: true,
			})

			count++

			if (count === 5) {
				embeds.push(embed)
				embed = instance.createEmbed("#FF435B")
				count = 0
			}
		}

		if (embeds.length === 0) {
			embeds.push(embed)
		}

		const paginator = paginate()
		paginator.add(...embeds)
		const ids = [`${Date.now()}__left`, `${Date.now()}__right`]
		paginator.setTraverser([
			new ButtonBuilder().setEmoji("⬅️").setCustomId(ids[0]).setStyle("Secondary"),
			new ButtonBuilder().setEmoji("➡️").setCustomId(ids[1]).setStyle("Secondary"),
		])
		const message = await interaction.editReply(paginator.components())
		message.channel.createMessageComponentCollector().on("collect", async (i) => {
			if (i.customId === ids[0]) {
				await paginator.back()
				await i.update(paginator.components())
			} else if (i.customId === ids[1]) {
				await paginator.next()
				await i.update(paginator.components())
			}
		})
	},
}
