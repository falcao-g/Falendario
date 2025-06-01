const { SlashCommandBuilder, time, ButtonBuilder } = require("discord.js")
const guildSchema = require("../schemas/guild.js")

module.exports = {
	data: new SlashCommandBuilder().setName("proximo").setDescription("Veja qual o próximo evento marcado"),
	execute: async ({ interaction, instance, guild }) => {
		await interaction.deferReply()
		try {
			var { dates } = await guildSchema.findOne({ _id: guild.id }).sort({ "dates.time": 1 })

			//filter dates to only include future events
			dates = dates.filter((date) => date.time > Date.now())

			if (dates.length === 0) {
				return await interaction.editReply("Calendário limpo!")
			}

			const embed = instance.createEmbed("#FF435B").addFields({
				name: `${dates[0].name} ${time(dates[0].time, "R")}`,
				value: dates[0].description,
				inline: true,
			})
			if (dates.length > 1) embed.data.fields[0].value += `\n\n*e mais ${dates.length - 1} eventos no futuro*...`

			if (dates[0].time < Date.now()) {
				embed.setColor("#FF0000").setFooter({ text: "Este evento já ocorreu." })
			}
			return await interaction.editReply({
				embeds: [embed],
			})
		} catch (error) {
			console.error(`proximo: ${error}`)
			await interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
