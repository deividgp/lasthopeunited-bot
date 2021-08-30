const ListParticipants = require('../participants/listParticipants.js');
const Discord = require('discord.js');
const moment = require('moment');

class Trial {

    constructor(id, name, tMax, date, interaction, client) {
        this._id = id;
        this._name = name;
        this._hMax = 2;
        this._tMax = tMax;
        this._ddMax = 12 - (tMax + this._hMax);
        this._hCounter = 0;
        this._tCounter = 0;
        this._ddCounter = 0;
        this._date = date;
        this._message = undefined;
        this._participants = new ListParticipants();
        this._client = client;
        this.startTrial(interaction);
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get hMax() {
        return this._hMax;
    }

    get tMax() {
        return this._tMax;
    }

    get ddMax() {
        return this._ddMax;
    }

    get hCounter() {
        return this._hCounter;
    }

    get tCounter() {
        return this._tCounter;
    }

    get ddCounter() {
        return this._ddCounter;
    }

    get date() {
        return this._date;
    }

    get participants() {
        return this._participants;
    }

    get counter() {
        return this._counter;
    }

    addRole(role) {
        switch (role) {
            case 'tank':
                this._tCounter++;
                return (this._tCounter <= this._tMax);
            case 'healer':
                this._hCounter++;
                return (this._hCounter <= this._hMax);
            case 'stamina dd':
            case 'magicka dd':
                this._ddCounter++;
                return (this._ddCounter <= this._ddMax);
        }

        return false;
    }

    subtractRole(role) {
        switch (role) {
            case 'tank':
                this._tCounter--;
                break;
            case 'healer':
                this._hCounter--;
                break;
            case 'stamina dd':
            case 'magicka dd':
                this._ddCounter--;
                break;
        }
    }

    addParticipantFinal(id, role) {
        const verify = this.addRole(role);

        if (verify) {
            this._participants.addFullParticipant(id, role);
            this.editEmbed();
        } else {
            this.subtractRole(role);
        }
        return verify;
    }

    deleteParticipantFinal(id) {
        const index = this._participants.findParticipant(id);
        const role = this._participants.participants[index].role;
        this._participants.deleteParticipant(index);
        this.subtractRole(role);
        this.editEmbed();
    }

    updateParticipantFinal(id, role, clas = undefined) {
        const index = this._participants.findParticipant(id);
        const oldRole = this._participants.participants[index].role;
        let newClass = "";
        if (clas == undefined) {
            newClass = this._participants.participants[index].newClass;
        } else {
            newClass = clas;
        }

        const verify = this.addRole(role);
        if (verify) {
            this.subtractRole(oldRole);
            this._participants.updateParticipant(index, role, newClass);
            this.editEmbed();
        } else {
            this.subtractRole(role);
        }
        return verify;
    }

    async listParticipants(channel) {
        let msgBlock = "";
        for (let index = 0; index < this._participants._counter; index++) {
            const element = this._participants.participants[index];
            msgBlock = msgBlock + `${this._message.guild.members.cache.find(m => m.id == element.id)} is ${element.role}\n`;
        }
        channel.send(msgBlock);
    }

    async editEmbed() {
        let trialEmbed = new Discord.MessageEmbed()
        trialEmbed.addField('Tanks', `${this._tCounter}/${this._tMax}`, true);
        trialEmbed.addField('Healers', `${this._hCounter}/${this._hMax}`, true);
        trialEmbed.addField('Damage Dealers', `${this._ddCounter}/${this._ddMax}`, true);
        for (let index = 0; index < this._participants._counter; index++) {
            const element = this._participants.participants[index];
            if (element.state == "full") {
                let fieldName = "";
                if (element.role.includes("dd")) {
                    fieldName = `${this._client.emojis.cache.find(emoji => emoji.name === `${element.role.split(" ")[0]}_${element.clas}`)}`;
                } else {
                    fieldName = `${this._client.emojis.cache.find(emoji => emoji.name === element.clas)} ${element.role}`;
                }
                trialEmbed.addField(fieldName, `${this._message.guild.members.cache.find(m => m.id == element.id)}`, false);
            }
        }
        await this._message.edit({ embeds: [trialEmbed] });
    }

    async startTrial(interaction) {
        const infoEmbed = new Discord.MessageEmbed()
            .setTitle(`Trial nº ${this._id + 1}: ${this._name}`)
            .addField('Date (UTC)', `${this._date}`, false)
        const participantsEmbed = new Discord.MessageEmbed()
            .addFields(
                { name: 'Tanks', value: `0/${this._tMax}`, inline: true },
                { name: 'Healers', value: `0/2`, inline: true },
                { name: 'Damage Dealers', value: `0/${this._ddMax}`, inline: true },
            )
        const classesRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('class')
                    .setPlaceholder('Class')
                    .addOptions([
                        {
                            label: 'Dragonknight',
                            value: 'dragonknight',
                            emoji: '876758966653296661',
                        },
                        {
                            label: 'Sorcerer',
                            value: 'sorcerer',
                            emoji: '876758967047557140',
                        },
                        {
                            label: 'Nightblade',
                            value: 'nightblade',
                            emoji: '876758967039197224',
                        },
                        {
                            label: 'Templar',
                            value: 'templar',
                            emoji: '876758967005626408',
                        },
                        {
                            label: 'Warden',
                            value: 'warden',
                            emoji: '876758967068524544',
                        },
                        {
                            label: 'Necromancer',
                            value: 'necromancer',
                            emoji: '876758967005622302',
                        },
                    ]),
            );
        const rolesRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('tank')
                    .setLabel('Tank')
                    .setStyle('PRIMARY')
                    .setEmoji('876758966720405535'),
                new Discord.MessageButton()
                    .setCustomId('healer')
                    .setLabel('Healer')
                    .setStyle('PRIMARY')
                    .setEmoji('876758967018197032'),
                new Discord.MessageButton()
                    .setCustomId('stamina dd')
                    .setLabel('Stam DD')
                    .setStyle('PRIMARY')
                    .setEmoji('876758967014010880'),
                new Discord.MessageButton()
                    .setCustomId('magicka dd')
                    .setLabel('Mag DD')
                    .setStyle('PRIMARY')
                    .setEmoji('876758967014010880'),
                new Discord.MessageButton()
                    .setCustomId('delete')
                    .setStyle('PRIMARY')
                    .setEmoji('🗑'),
            );

        const parseDate = moment(this._date, "DD/MM/YYYY HH:mm").toDate();
        const time = parseDate.setMinutes(parseDate.getMinutes() - 15) - new Date();
        this._message = await interaction.channel.send({ embeds: [participantsEmbed] });
        const messageReaction = await interaction.reply({ embeds: [infoEmbed], components: [classesRow, rolesRow], fetchReply: true });

        const collector = messageReaction.createMessageComponentCollector({ time: time });

        collector.on('collect', async i => {
            if (i.isSelectMenu()) {
                await i.reply({ content: `${i.values[0]} selected. Now select a role.`, ephemeral: true });
                this._participants.addPartialParticipant(i.user.id, i.values[0]);
            } else if (i.isButton()) {

                const findResult = this._participants.findParticipant(i.user.id);
                if (i.customId == 'delete') {
                    if (findResult != undefined) {
                        this.deleteParticipantFinal(i.user.id);
                        return await i.reply({ content: 'Removed', ephemeral: true });
                    } else {
                        return await i.reply({ content: 'You are not signed up', ephemeral: true });
                    }
                }

                const findPartialResult = this._participants.findPartialParticipant(i.user.id);
                if (findPartialResult == undefined) {

                    const foundParticipant = this._participants.participants[findResult];
                    if (findResult == undefined) {
                        return await i.reply({ content: 'Select a class first', ephemeral: true });
                    } else {
                        // Not the same role
                        if (this._participants.findParticipant(i.user.id, i.customId) == undefined) {
                            if (foundParticipant.newClass != undefined) {
                                const update = this.updateParticipantFinal(i.user.id, i.customId);
                                if (update) {
                                    return await i.reply({ content: 'Role updated succesfully', ephemeral: true });
                                }
                                return await i.reply({ content: 'Unavailable', ephemeral: true });
                            } else {
                                return await i.reply({ content: 'Need to select a class', ephemeral: true });
                            }
                            // Same role
                        } else {
                            if (foundParticipant.newClass != undefined) {
                                if (foundParticipant.clas != foundParticipant.newClass) {
                                    foundParticipant.clas = foundParticipant.newClass;
                                    this.editEmbed();
                                    return await i.reply({ content: 'Class updated successfully', ephemeral: true });
                                } else {
                                    return await i.reply({ content: 'Same class', ephemeral: true });
                                }
                            }
                            return await i.reply({ content: 'Same role and class not specified', ephemeral: true });
                        }
                    }
                } else {
                    const add = this.addParticipantFinal(i.user.id, i.customId, i);
                    if (add) {
                        const findResult = this._participants.findParticipant(i.user.id);
                        return await i.reply({ content: 'Added', ephemeral: true });
                    }
                    await i.reply({ content: 'Unavailable', ephemeral: true });
                }
            }
        });

        collector.on('end', () => {
            this.listParticipants(this._message.channel);
        });
    }
}
module.exports = Trial;