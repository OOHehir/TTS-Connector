'use strict';

const { Device } = require('homey');
const fetch = require('node-fetch');
const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);

class MyDevice extends Device {

	/**
	 * onInit is called when the device is initialized.
	 */
	async onInit() {
		this.log(`Gateway ${this.getName()} has been initialized`);
		this.settings = this.getSettings();
		this.startPolling(1);
		this.doPoll();
	}

	/**
	 * onAdded is called when the user adds the device, called just after pairing.
	 */
	async onAdded() {
		this.log(`${this.getName()} has been added`);
	}

	/**
	 * onSettings is called when the user updates the device's settings.
	 * @param {object} event the onSettings event data
	 * @param {object} event.oldSettings The old settings object
	 * @param {object} event.newSettings The new settings object
	 * @param {string[]} event.changedKeys An array of keys changed since the previous version
	 * @returns {Promise<string|void>} return a custom message that will be displayed
	 */
	async onSettings() {
		this.log('MyDevice settings where changed');
		this.restartDevice(1000);
	}

	/**
	 * onRenamed is called when the user updates the device's name.
	 * This method can be used this to synchronise the name to the device.
	 * @param {string} name The new name
	 */
	async onRenamed(name) {
		this.log(`${name} was renamed`);
	}

	/**
	 * onDeleted is called when the user deleted the device.
	 */
	async onDeleted() {
		this.log(`${this.getName()} has been deleted`);
		this.stopPolling();
	}

	startPolling(interval) {
		this.log(`Start polling ${this.getName()} @ ${interval} minute interval`);
		this.stopPolling();
		this.intervalIdDevicePoll = setInterval(() => {
			this.doPoll();
		}, 1000 * 60 * interval);
	}

	stopPolling() {
		clearInterval(this.intervalIdDevicePoll);
	}

	async restartDevice(delay) {
		// this.destroyListeners();
		this.stopPolling();
		const dly = delay || 1000 * 60;
		this.log(`Device will restart in ${dly / 1000} seconds`);
		await setTimeoutPromise(dly).then(() => this.onInit());
	}

	async getGatewayStats() {
		const gateway = this.settings;
		const url = new URL(`https://mapper.packetbroker.net/api/v2/gateways/netID=${gateway.netID},tenantID=${gateway.tenantID},id=${gateway.id}`);
		const response = await fetch(url);
		const data = await response.json();
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return data;
	}

	async doPoll() {
		try {
			const stats = await this.getGatewayStats();
			this.handleData(stats);
		} catch (error) { this.error(error.message); }
	}

	setCapability(capability, value) {
		if (this.hasCapability(capability)) {
			// only update changed values
			if (value !== this.getCapabilityValue(capability)) {
				this.setCapabilityValue(capability, value)
					.catch((error) => {
						this.log(error, capability, value);
					});
			}
		}
	}

	// update device settings if something changed
	checkSettings(stats) {
		const newSettings = {};
		Object.keys(this.settings).forEach((key) => {
			if (!Object.prototype.hasOwnProperty.call(stats, key)) return;
			if (this.settings[key] !== stats[key]) {
				newSettings[key] = stats[key];
			}
		});
		if (Object.keys(newSettings).length > 0) this.setSettings(newSettings);
	}

	handleData(stats) {
		// console.log(stats);
		if (!stats) return;
		this.setCapability('alarm_offline', !stats.online);
		this.setCapability('rx_rate', Math.round(stats.rxRate * 10) / 10);
		this.setCapability('tx_rate', Math.round(stats.txRate * 10) / 10);
		const ds = new Date(stats.updatedAt);
		const date = ds.toString().substring(4, 11);
		const time = ds.toLocaleTimeString('nl-NL', { hour12: false, timeZone: this.homey.clock.getTimezone() }).substring(0, 5);
		this.setCapability('last_update', `${date} ${time}`);
		this.checkSettings(stats);

		// update flow triggers
		if (!this.lastStats || (stats.updatedAt !== this.lastStats.updatedAt)) {
			const tokens = stats;
			this.homey.flow.getDeviceTriggerCard('status_update')
				.trigger(this, tokens)
				.catch(this.error);
		}

		this.lastStats = stats;

	}

}

module.exports = MyDevice;

// {
// 	"netID":"000013",
// 	"tenantID":"ttnv2",
// 	"id":"mt-ip67-19916043",
// 	"clusterID":"ttn-v2-eu-2",
// 	"updatedAt":"2021-09-25T16:56:53.20167Z",
// 	"location":{"latitude":52.10199573,"longitude":5.00496958,"altitude":0,"accuracy":0},
// 	"antennaCount":1,
// 	"online":true,
// 	"frequencyPlan":{"region":"EU_863_870","loraMultiSFChannels":[868100000,868300000,868500000,867100000,867300000,867500000,867700000,867900000]},
// 	"rxRate":0,
// 	"txRate":0

// antennaPlacement: 'INDOOR',
// eui: '58A0CBFFFE803427',
// }
