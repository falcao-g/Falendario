const { ActionRowBuilder } = require("discord.js")

function msToTime(ms) {
	let time = ""

	let n = 0
	if (ms >= 2592000000) {
		n = Math.floor(ms / 2592000000)
		time += `${n}m `
		ms -= n * 2592000000
	}

	if (ms >= 86400000) {
		n = Math.floor(ms / 86400000)
		time += `${n}d `
		ms -= n * 86400000
	}

	if (ms >= 3600000) {
		n = Math.floor(ms / 3600000)
		time += `${n}h `
		ms -= n * 3600000
	}

	if (ms >= 60000) {
		n = Math.floor(ms / 60000)
		time += `${n}m `
		ms -= n * 60000
	}

	if (time === "") time += "1m"

	return time.trimEnd()
}

async function getRoleColor(guild, member_id) {
	try {
		cor = guild.members.cache.get(member_id).displayColor
		return cor
	} catch (err) {
		return "Random"
	}
}

function paginate() {
	const __embeds = []
	let cur = 0
	let traverser
	return {
		add(...embeds) {
			__embeds.push(...embeds)
			return this
		},
		setTraverser(tr) {
			traverser = tr
		},
		async next() {
			cur++
			if (cur >= __embeds.length) {
				cur = 0
			}
		},
		async back() {
			cur--
			if (cur <= -__embeds.length) {
				cur = 0
			}
		},
		components() {
			return {
				embeds: [__embeds.at(cur)],
				components: [new ActionRowBuilder().addComponents(...traverser)],
				fetchReply: true,
			}
		},
	}
}

module.exports = {
	msToTime,
	getRoleColor,
	paginate,
}
