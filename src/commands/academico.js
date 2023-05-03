const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
	developer: true,
	data: new SlashCommandBuilder()
		.setName("academico")
		.setDescription("Será que é feriado? Confira o calendário acadêmico!")
		.setDMPermission(true),
	execute: async ({ interaction }) => {
		await interaction.deferReply()
		try {
			const embed = new EmbedBuilder()
				.setTitle("Calendário Acadêmico")
				.setDescription(
					"Acesse o calendário acadêmico pelo link: https://prograd.ufms.br/calendario-academico/"
				)
				.setColor("#FF435B")
				.setFooter({ text: "❤️ by grupo 8" })

			interaction.editReply({
				embeds: [embed],
			})
		} catch (error) {
			console.error(`academico: ${error}`)
			interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
