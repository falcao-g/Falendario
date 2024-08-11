const { SlashCommandBuilder, time, ButtonBuilder } = require("discord.js")
const guildSchema = require("../schemas/guild.js")
const { paginate } = require("../utils/functions.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("adicionar")
		.setDescription("Adiciona uma nova data ao calendário")
		.setDMPermission(true)
		.addStringOption((option) => option.setName("nome").setDescription("nome do evento").setRequired(true))
		.addStringOption((option) => option.setName("descrição").setDescription("descrição do evento").setRequired(true))
		.addStringOption((option) =>
			option.setName("data").setDescription('data do evento no formato "DD/MM/YYYY"').setRequired(true)
		),
	execute: async ({ interaction, guild }) => {
		await interaction.deferReply()
		const server = await guildSchema.findByIdAndUpdate(
			guild.id,
			{
				_id: guild.id,
			},
			{
				upsert: true,
				new: true,
			}
		)

		const [dia, mes, ano] = interaction.options.getString("data").split("/")
		const name = interaction.options.getString("nome")
		const description = interaction.options.getString("descrição")
		server.dates.push({
			name,
			description,
			time: new Date(`${mes}/${dia}/${ano}`),
		})
		server.save()

		await interaction.editReply(`Evento adicionado com sucesso! ${time(new Date(`${mes}/${dia}/${ano}`), "R")}`)
	},
}
