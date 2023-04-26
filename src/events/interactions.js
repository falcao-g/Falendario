module.exports = {
	name: "interactionCreate",
	execute: async (interaction, instance, client) => {
		guildUser = interaction.guild ? interaction.guild : interaction.user

		if (interaction.user.bot) {
			interaction.reply({
				content: instance.getMessage(guildUser, "YOU_ARE_BOT"),
				ephemeral: true,
			})
			return
		}

		if (
			interaction.isChatInputCommand() ||
			interaction.isContextMenuCommand()
		) {
			const command = client.commands.get(interaction.commandName)

			if (
				command.developer &&
				!instance.config.devs.includes(interaction.user.id)
			) {
				return interaction.reply({
					content: "Só os desenvolvedores pode usar esse comando",
					ephemeral: true,
				})
			}

			command.execute({
				interaction,
				instance,
				client,
				member: interaction.member,
				guild: interaction.guild,
				user: interaction.user,
				channel: interaction.channel,
			})
		} else if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName)
			command.autocomplete({ interaction, instance })
		}
	},
}
