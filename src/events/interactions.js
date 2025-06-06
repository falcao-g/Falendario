module.exports = {
	name: "interactionCreate",
	execute: async (interaction, instance, client) => {
		guildUser = interaction.guild ? interaction.guild : interaction.user

		if (interaction.user.bot) {
			interaction.reply({
				content: "Bots não podem usar comandos",
				ephemeral: true,
			})
			return
		}

		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			const command = client.commands.get(interaction.commandName)

			if (command.developer && !instance.config.devs.includes(interaction.user.id)) {
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
		} else if (interaction.isButton()) {
			//all button interactions are like the following: <command> <args>
			const commandName = interaction.customId.split(" ")[0]
			const command = client.commands.get(commandName)

			if (command == undefined) return

			var args = interaction.customId.split(" ").slice(1)

			command.execute({
				interaction,
				instance,
				client,
				member: interaction.member,
				guild: interaction.guild,
				user: interaction.user,
				channel: interaction.channel,
				database: instance.database,
				args,
			})
		} else if (interaction.isStringSelectMenu()) {
			const command = client.commands.get(interaction.customId.split(" ")[0])

			if (command == undefined) return

			await command.execute({
				guild: interaction.guild,
				interaction,
				instance,
				member: interaction.member,
				client,
				user: interaction.user,
				channel: interaction.channel,
				database: instance.database,
				subcommand: interaction.customId.split(" ")[1],
			})
		}
	},
}
