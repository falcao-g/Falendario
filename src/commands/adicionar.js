const {
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	time,
} = require("discord.js")
const guildSchema = require("../schemas/guild.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("adicionar")
		.setNameLocalizations({
			"en-US": "add",
			"es-ES": "añadir",
		})
		.setDescription("Adiciona uma nova data ao calendário")
		.setDescriptionLocalizations({
			"en-US": "Adds a new date to the calendar",
			"es-ES": "Añade una nueva fecha al calendario",
		})
		.addStringOption((option) =>
			option
				.setName("nome")
				.setNameLocalizations({
					"en-US": "name",
					"es-ES": "nombre",
				})
				.setDescription("Nome do evento")
				.setDescriptionLocalizations({
					"en-US": "Name of the event",
					"es-ES": "Nombre del evento",
				})
				.setRequired(true)
				.setMinLength(1)
				.setMaxLength(100)
		),
	execute: async ({ interaction, instance }) => {
		try {
			const eventName = interaction.options.getString("nome")

			const modal = new ModalBuilder().setCustomId("addEventModal").setTitle(eventName.substring(0, 45))

			const fields = [
				// Combined Date/Time (required)
				new TextInputBuilder()
					.setCustomId("datetimeInput")
					.setLabel(instance.getMessage(interaction, "EVENT_DATETIME") || "Data e Hora")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("DD/MM/AAAA HH:mm (ex: 25/12/2024 15:30)")
					.setMinLength(10)
					.setMaxLength(16)
					.setRequired(true),

				// Description (required)
				new TextInputBuilder()
					.setCustomId("descriptionInput")
					.setLabel(instance.getMessage(interaction, "EVENT_DESCRIPTION") || "Descrição")
					.setStyle(TextInputStyle.Paragraph)
					.setRequired(true),

				// Timezone (optional)
				new TextInputBuilder()
					.setCustomId("timezoneInput")
					.setLabel(instance.getMessage(interaction, "EVENT_TIMEZONE") || "Fuso Horário")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("UTC, GMT-3, etc (padrão: UTC)")
					.setRequired(false),

				// Location (optional)
				new TextInputBuilder()
					.setCustomId("locationInput")
					.setLabel(instance.getMessage(interaction, "EVENT_LOCATION") || "Localização")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("Discord, Zoom, Sala 101...")
					.setRequired(false),

				// Category (optional)
				new TextInputBuilder()
					.setCustomId("categoryInput")
					.setLabel(instance.getMessage(interaction, "EVENT_CATEGORY") || "Categoria")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("Reunião, Aniversário, Lembrete...")
					.setRequired(false),
			]

			modal.addComponents(fields.map((field) => new ActionRowBuilder().addComponents(field)))

			await interaction.showModal(modal)

			const submitted = await interaction
				.awaitModalSubmit({
					time: 300_000, // 5 minutes
					filter: (i) => i.user.id === interaction.user.id,
				})
				.catch(() => null)

			if (!submitted) return

			await submitted.deferReply({ ephemeral: true })

			// Extract values
			const datetimeStr = submitted.fields.getTextInputValue("datetimeInput")
			const description = submitted.fields.getTextInputValue("descriptionInput")
			const timezone = submitted.fields.getTextInputValue("timezoneInput") || "UTC"
			const location = submitted.fields.getTextInputValue("locationInput") || "Não especificado"
			const category = submitted.fields.getTextInputValue("categoryInput") || "Geral"

			// Parse date/time (supports both "DD/MM/YYYY" and "DD/MM/YYYY HH:mm")
			let [datePart, timePart] = datetimeStr.split(" ")
			const [dia, mes, ano] = datePart.split("/")

			// Default to 00:00 if no time provided
			if (!timePart) timePart = "00:00"
			const [horas, minutos] = timePart.split(":")

			const date = new Date(`${ano}-${mes}-${dia}T${horas}:${minutos}`)
			if (isNaN(date.getTime())) {
				return await submitted.editReply(instance.getMessage(submitted, "INVALID_DATETIME"))
			}

			// Validate time components
			if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
				return await submitted.editReply(instance.getMessage(submitted, "INVALID_TIME"))
			}

			if (date < Date.now()) {
				return await submitted.editReply(instance.getMessage(submitted, "NOT_PAST_EVENTS"))
			}

			// Save to database
			const documentID = submitted.guildId || submitted.user.id
			await guildSchema.findByIdAndUpdate(
				documentID,
				{
					$push: {
						dates: {
							name: eventName,
							description,
							time: date.getTime(),
							timezone,
							location,
							category,
						},
					},
				},
				{ upsert: true }
			)

			// Success reply with rich information
			await submitted.editReply({
				content: instance.getMessage(submitted, "ADDED_EVENT", {
					TITLE: eventName,
					DATE: time(date, "F"),
					RELATIVE: time(date, "R"),
					LOCATION: location,
					CATEGORY: category,
				}),
				ephemeral: true,
			})
		} catch (error) {
			console.error(`adicionar: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
