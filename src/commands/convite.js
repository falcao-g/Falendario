const { SlashCommandBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("convite")
		.setNameLocalizations({
			"en-US": "invite",
			"es-ES": "invitación",
		})
		.setDescription("Obtenha um convite para colocar o bot no seu servidor!")
		.setDescriptionLocalizations({
			"en-US": "Obtain an invitation to add the bot to your server!",
			"es-ES": "¡Obtén una invitación para agregar el bot a tu servidor!",
		}),
	execute: async ({ interaction, instance }) => {
		await interaction.deferReply().catch(() => {})
		try {
			await interaction.editReply({ content: instance.getMessage(interaction, "INVITE") })
		} catch (error) {
			console.error(`convite: ${error}`)
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, "EXCEPTION"),
			})
		}
	},
}
