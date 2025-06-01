const { SlashCommandBuilder, time } = require("discord.js")
const guildSchema = require("../schemas/guild.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("adicionar")
		.setDescription("Adiciona uma nova data ao calendário")
		.setDMPermission(true)
		.addStringOption((option) => option.setName("nome").setDescription("nome do evento").setRequired(true))
		.addStringOption((option) => option.setName("descrição").setDescription("descrição do evento").setRequired(true))
		.addStringOption((option) =>
			option.setName("data").setDescription('data do evento no formato "DD/MM/YYYY"').setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("hora")
				.setDescription('hora do evento no formato "HH:mm" (opcional, padrão: 00:00)')
				.setRequired(false)
		),
	execute: async ({ interaction }) => {
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
				return await interaction.editReply("Data inválida! Use o formato DD/MM/YYYY.")
			}

			const hora = interaction.options.getString("hora") || "00:00"
			const [horas, minutos] = hora.split(":")
			if (isNaN(horas) || isNaN(minutos) || horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
				return await interaction.editReply("Hora inválida! Use o formato HH:mm.")
			}

			const date = new Date(`${mes}/${dia}/${ano} ${horas}:${minutos}`)
			if (date < Date.now()) {
				return await interaction.editReply("Não é possível adicionar eventos no passado!")
			}
			const name = interaction.options.getString("nome")
			const description = interaction.options.getString("descrição")
			server.dates.push({
				name,
				description,
				time: date.getTime(),
			})
			await server.save()

			await interaction.editReply(`Evento adicionado com sucesso! ${time(new Date(date.getTime()), "R")}`)
		} catch (error) {
			console.error(`adicionar: ${error}`)
			await interaction.editReply({
				content: "Algo deu errado! Tente novamente mais tarde. :melting_face:",
			})
		}
	},
}
