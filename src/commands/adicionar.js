const { SlashCommandBuilder, time } = require("discord.js")
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
				.setDescription("nome do evento")
				.setDescriptionLocalizations({
					"en-US": "name of the event",
					"es-ES": "nombre del evento",
				})
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("descrição")
				.setNameLocalizations({
					"en-US": "description",
					"es-ES": "descripción",
				})
				.setDescription("descrição do evento")
				.setDescriptionLocalizations({
					"en-US": "description of the event",
					"es-ES": "descripción del evento",
				})
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("data")
				.setNameLocalizations({
					"en-US": "date",
					"es-ES": "fecha",
				})
				.setDescription('data do evento no formato "DD/MM/YYYY"')
				.setDescriptionLocalizations({
					"en-US": 'date of the event in the format "DD/MM/YYYY"',
					"es-ES": 'fecha del evento en el formato "DD/MM/YYYY"',
				})
				.setMinLength(10)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("hora")
				.setNameLocalizations({
					"en-US": "time",
					"es-ES": "hora",
				})
				.setDescription('hora do evento no formato "HH:mm" (opcional, padrão: 00:00)')
				.setDescriptionLocalizations({
					"en-US": 'time of the event in the format "HH:mm" (optional, default: 00:00)',
					"es-ES": 'hora del evento en el formato "HH:mm" (opcional, predeterminado: 00:00)',
				})
				.setMinLength(5)
				.setRequired(false)
		),
	execute: async ({ interaction, instance }) => {
		await interaction.deferReply()
		try {
			const documentID = interaction.guildId || interaction.user.id
			const server = await guildSchema.findByIdAndUpdate(
				documentID,
				{
					_id: documentID,
				},
				{
					upsert: true,
					new: true,
				}
			)

			const [dia, mes, ano] = interaction.options.getString("data").split("/")
			if (isNaN(new Date(`${mes}/${dia}/${ano}`))) {
				return await interaction.editReply(instance.getMessage(interaction, "INVALID_DATE"))
			}

			const hora = interaction.options.getString("hora") || "00:00"
			const [horas, minutos] = hora.split(":")
			if (isNaN(horas) || isNaN(minutos) || horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
				return await interaction.editReply(instance.getMessage(interaction, "INVALID_TIME"))
			}

			const date = new Date(`${mes}/${dia}/${ano} ${horas}:${minutos}`)
			if (date < Date.now()) {
				return await interaction.editReply(instance.getMessage(interaction, "NOT_PAST_EVENTS"))
			}
			const name = interaction.options.getString("nome")
			const description = interaction.options.getString("descrição")
			server.dates.push({
				name,
				description,
				time: date.getTime(),
			})
			await server.save()

			await interaction.editReply(
				instance.getMessage(interaction, "ADDED_EVENT", {
					TITLE: name,
					DATE: time(new Date(date.getTime()), "R"),
				})
			)
		} catch (error) {
			console.error(`adicionar: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
