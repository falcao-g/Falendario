const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const { loadCommands } = require("../handlers/commandHandler")
const { loadEvents } = require("../handlers/eventHandler")

module.exports = {
	developer: true,
	data: new SlashCommandBuilder()
		.setName("tools")
		.setDescription("Tools for Falbot developers")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false)
		.addSubcommand((subcommand) =>
			subcommand.setName("reload_events").setDescription("reload your events")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("reload_commands")
				.setDescription("reload your commands")
		),
	execute: async ({ interaction, instance, client }) => {
		await interaction.deferReply({ ephemeral: true })
		try {
			subcommand = interaction.options.getSubcommand()
			if (subcommand === "reload_events") {
				for (const [key, value] of client.events) {
					client.removeListener(`${key}`, value, true)
				}
				loadEvents(instance, client)
				interaction.editReply({ content: "Events reloaded" })
			} else {
				loadCommands(instance, client)
				interaction.editReply({ content: "Commands reloaded" })
			}
		} catch (error) {
			console.error(`tools: ${error}`)
			interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
