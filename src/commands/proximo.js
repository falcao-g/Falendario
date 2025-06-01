const { SlashCommandBuilder, time } = require("discord.js")
const guildSchema = require("../schemas/guild.js")

module.exports = {
	data: new SlashCommandBuilder().setName("proximo").setDescription("Veja qual o próximo evento marcado"),
	execute: async ({ interaction, instance }) => {
		await interaction.deferReply()
		try {
			const documentID = interaction.guildId || interaction.user.id
			var { dates } = (await guildSchema.findOne({ _id: documentID }).sort({ "dates.time": 1 })) ?? { dates: [] }

			if (dates.length === 0) {
				return await interaction.editReply("Calendário limpo!")
			}

			//filter dates to only include future events
			dates = dates.filter((date) => date.time > Date.now())

			if (dates.length === 0) {
				return await interaction.editReply("Não há eventos futuros marcados!")
			}

			const embed = instance.createEmbed("#FF435B").addFields({
				name: `${dates[0].name} ${time(dates[0].time, "R")}`,
				value: dates[0].description,
				inline: true,
			})
			if (dates.length > 1) embed.data.fields[0].value += `\n\n*e mais ${dates.length - 1} eventos no futuro*...`

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
