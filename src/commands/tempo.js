const { SlashCommandBuilder, time, ButtonBuilder } = require("discord.js")
const guildSchema = require("../schemas/guild.js")
const { paginate } = require("../utils/functions.js")

module.exports = {
	data: new SlashCommandBuilder().setName("tempo").setDescription("Quanto tempo falta?").setDMPermission(true),
	execute: async ({ interaction, instance, guild }) => {
		await interaction.deferReply()
		try {
			const { dates } = await guildSchema.findOne({ _id: guild.id }).sort({ "dates.time": 1 })

			if (dates.length === 0) {
				return interaction.editReply("Calendário limpo!")
			}

			//generate an array of embeds with 5 dates each until the end of the array
			const embeds = []
			const total = Math.ceil(dates.length / 5)
			for (let i = 0; i < total; i++) {
				const embed = instance.createEmbed("#FF435B")
				const datesSlice = dates.slice(i * 5, (i + 1) * 5)
				datesSlice.forEach((date) => {
					embed.addFields({
						name: `${date.name} ${time(date.time, "R")}`,
						value: date.description,
						inline: true,
					})
				})
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
		} catch (error) {
			console.error(`tempo: ${error}`)
			await interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
