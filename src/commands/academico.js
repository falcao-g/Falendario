const { SlashCommandBuilder } = require("discord.js")

module.exports = {
	developer: true,
	data: new SlashCommandBuilder()
		.setName("academico")
		.setDescription("Será que é feriado? Confira o calendário acadêmico!")
		.setDMPermission(true),
	execute: async ({ interaction }) => {
		await interaction.deferReply()
		try {
			interaction.editReply({
				content: `Acesse o calendário acadêmico pelo link: https://prograd.ufms.br/calendario-academico/`,
			})
		} catch (error) {
			console.error(`tools: ${error}`)
			interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
