const { ActionRowBuilder, ButtonBuilder } = require("discord.js")

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

function paginate() {
	const __embeds = []
	const __components = []
	let cur = 0
	let traverser
	return {
		add(...embeds) {
			__embeds.push(...embeds)
			return this
		},
		addComponents(...components) {
			__components.push(...components)
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
			componentsToAdd = []

			if (__components.length > 0) {
				if (__components.length === __embeds.length && __components.at(cur) instanceof ButtonBuilder) {
					componentsToAdd.push(new ActionRowBuilder().addComponents(__components.at(cur)).addComponents(...traverser))
				} else {
					componentsToAdd.push(new ActionRowBuilder().addComponents(__components.at(cur)))
					if (__embeds.length > 1) componentsToAdd.push(new ActionRowBuilder().addComponents(...traverser))
				}
			}

			return {
				embeds: [__embeds.at(cur)],
				components: componentsToAdd,
				fetchReply: true,
			}
		},
	}
}

module.exports = {
	msToTime,
	paginate,
}
