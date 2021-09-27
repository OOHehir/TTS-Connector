'use strict';

const { Driver } = require('homey');
const fetch = require('node-fetch');

class MyDriver extends Driver {

	async onInit() {
		this.log('Gateway driver has been initialized');
		this.registerFlowListeners();
	}

	registerFlowListeners() {
		// condition cards
		const isOffline = this.homey.flow.getConditionCard('is_offline');
		isOffline.registerRunListener((args) => args.device.getCapabilityValue('alarm_offline'));
	}

	async getGateways() {
		const url = new URL('https://mapper.packetbroker.net/api/v2/gateways?');
		const params = {
			'distanceWithin[latitude]': Math.round(this.homey.geolocation.getLatitude() * 100000000) / 100000000,
			'distanceWithin[longitude]': Math.round(this.homey.geolocation.getLongitude() * 100000000) / 100000000,
			'distanceWithin[distance]': 25000, // meters
			limit: 20,
		};
		Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
		const response = await fetch(url);
		const data = await response.json();
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return data;
	}

	async onPairListDevices() {
		const routers = await this.getGateways();
		const devices = routers.map((router) => ({
			name: router.id,	// 'mt-ip67-19916043'
			data: {
				id: router.id,	// 'mt-ip67-19916043'
			},
			capabilities: ['rx_rate', 'tx_rate', 'alarm_offline', 'last_update'],
			settings: {
				id: router.id, // 'mt-ip67-19916043',
				netID: router.netID,	// '000013'
				tenantID: router.tenantID, // 'ttn' 'ttnv2'
				eui: router.eui, // '3133303760004A00',
				clusterID: router.clusterID, // 'ttn-v2-eu-2',
				antennaPlacement: router.antennaPlacement, // 'INDOOR',
			},
		}));
		devices.unshift({
			name: 'MANUAL SETUP',
			data: {
				id: Math.random().toString(36).substring(2, 15),	// 'c3u1m1cbmih'
			},
			capabilities: ['rx_rate', 'tx_rate', 'alarm_offline', 'last_update'],
			settings: {
				id: 'FILL IN THE ID',
				netID: '000013',
				tenantID: 'ttn',
				eui: '',
				clusterID: '',
				antennaPlacement: '',
			},
		});
		return devices;
	}

}

module.exports = MyDriver;

// {
// 	netID: '000013',
// 	tenantID: 'ttn',
// 	id: 'mt-ip67-19916043',
// 	eui: '58A0CBFFFE803427',
// 	clusterID: 'ttn-eu1',
// 	updatedAt: '2021-09-25T15:19:04.122507Z',
// 	location: {
// 		latitude: 52.09707524835807,
// 		longitude: 5.061097740799597,
// 		altitude: 6,
// 		accuracy: 0
// 	},
// 	antennaPlacement: 'INDOOR',
// 	antennaCount: 1,
// 	online: true
// }
