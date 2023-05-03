const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

module.exports = {
	developer: true,
	data: new SlashCommandBuilder()
		.setName("rematricula")
		.setDescription("Está na hora, use esse comando para fazer a rematrícula!")
		.setDMPermission(true),
	execute: async ({ interaction }) => {
		await interaction.deferReply()
		try {
			const embed = new EmbedBuilder()
				.setTitle("Rematrícula")
				.setDescription(
					"Faça a rematrícula em: https://siscad.ufms.br/matricula/selecoes"
				)
				.setColor("#FF435B")
				.setFooter({ text: "❤️ by grupo 8" })

			interaction.editReply({
				embeds: [embed],
			})
		} catch (error) {
			console.error(`rematricula: ${error}`)
			interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
