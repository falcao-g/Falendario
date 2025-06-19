const { SlashCommandBuilder, time, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js")
const guildSchema = require("../schemas/guild.js")
const { paginate } = require("../utils/functions.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("tempo")
		.setNameLocalizations({
			"en-US": "time",
			"es-ES": "tiempo",
		})
		.setDescription("Quanto tempo falta?")
		.setDescriptionLocalizations({
			"en-US": "How much time is left?",
			"es-ES": "¿Cuánto tiempo queda?",
		}),
	execute: async ({ interaction, instance }) => {
		await interaction.deferReply()
		try {
			const documentID = interaction.guildId || interaction.user.id
			var { dates } = (
				await guildSchema.aggregate([
					{ $match: { _id: documentID } },
					{
						$project: {
							dates: {
								$sortArray: {
									input: "$dates",
									sortBy: { time: 1 }, // 1 = ordem crescente, -1 = decrescente
								},
							},
						},
					},
				])
			)[0] ?? { dates: [] }

			dates = dates.filter((date) => {
				if (date.time > Date.now()) {
					return true
				} else {
					//remove the outdated dates
					guildSchema
						.updateOne({ _id: documentID }, { $pull: { dates: { _id: date._id } } })
						.catch((err) => console.error(`Erro ao remover data antiga: ${err}`))

					return false
				}
			})

			if (dates.length === 0) {
				return interaction.editReply(instance.getMessage(interaction, "CLEAN_CALENDAR"))
			}

			//generate an array of embeds with 5 dates each until the end of the array
			const embeds = []
			const selectMenus = []
			const total = Math.ceil(dates.length / 5)
			for (let i = 0; i < total; i++) {
				const embed = instance.createEmbed("#FF435B")
				const selectMenu = new StringSelectMenuBuilder()
					.setCustomId(`ver`)
					.setPlaceholder(instance.getMessage(interaction, "SELECT_AN_DATE"))
				const datesSlice = dates.slice(i * 5, (i + 1) * 5)
				const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]
				datesSlice.forEach((date, index) => {
					embed.addFields({
						name: `${emojis[index]} ${date.name} ${time(date.time, "R")}`,
						value: date.description.substring(0, 100),
						inline: true,
					})
					selectMenu.addOptions({
						label: date.name,
						value: date._id.toString(),
						description: date.description.substring(0, 50),
						emoji: emojis[index],
					})
				})
				embeds.push(embed)
				selectMenus.push(selectMenu)
			}

			const paginator = paginate()
			paginator.add(...embeds)
			paginator.addComponents(...selectMenus)
			const ids = [`${Date.now()}__left`, `${Date.now()}__right`]
			paginator.setTraverser([
				new ButtonBuilder().setEmoji("⬅️").setCustomId(ids[0]).setStyle("Secondary"),
				new ButtonBuilder().setEmoji("➡️").setCustomId(ids[1]).setStyle("Secondary"),
			])
			const message = await interaction.editReply(paginator.components())
			message.createMessageComponentCollector({ time: 3600000 }).on("collect", async (i) => {
				if (i.customId === ids[0]) {
					await paginator.back()
					await i.update(paginator.components())
				} else if (i.customId === ids[1]) {
					await paginator.next()
					await i.update(paginator.components())
				}
			})
		} catch (error) {
			console.error(`tempo: ${error}`)
			await interaction.editReply(instance.getMessage(interaction, "EXCEPTION"))
		}
	},
}
