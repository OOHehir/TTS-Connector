'use strict';

// https://github.com/athombv/nl.thermosmart-example/blob/master/drivers/thermostat/driver.js

// https://github.com/athombv/nl.eneco.toon-example/blob/main/drivers/toon/driver.js

// https://github.com/XattSPT/io.flic/blob/ebb533bb22e9ab2c37e3e9e659f8a79085f4d082/lib/FlicDriver.js

const Homey = require('homey');

const WEBHOOK_ID = Homey.env.WEBHOOK_ID;
const WEBHOOK_SECRET = Homey.env.WEBHOOK_SECRET;

let newDevice = {
  id: '',
  devEui: '',
  applicationId: '',
  devAddr: '',
  downlinkApikey: '',
  downlinkPush: '',
  downlinkReplace: '',
};

let newDeviceFound = false;

class MyDriver extends Homey.Driver {


  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
    await this.registerFlowCards();
    await this.registerWebhook();
  }

  async onPairListDevices() {

    if (!newDevice.id) {
      this.log('No device found to pair');
      return [];
    }

    const devices = [
      {
        name: "TTN End Device",
        // Data contains only unique properties for the device.
        data: {
          id: newDevice.id,
        },
        store: {
          // Store is dynamic and persistent storage for your device
          devEui: newDevice.devEui,
          applicationId: newDevice.applicationId,
          devAddr: newDevice.devAddr,
          downlinkApikey: newDevice.downlinkApikey,
          downlinkPush: newDevice.downlinkPush,
          downlinkReplace: newDevice.downlinkReplace,
          downlinkCount: 0,
          uplinkCount: 0
        },
        // TODO: Finish the implementation the the following into settings rather than store
        // Should allow them to be viewed &/ or edited in 'advanced settings' view of Homey App
        settings:{
          devEui: newDevice.devEui,
          downlinkApikey: newDevice.downlinkApikey,
          downlinkPush: newDevice.downlinkPush,
          downlinkReplace: newDevice.downlinkReplace,
          downlinkCount: 0,
          uplinkCount: 0
        }
      },
    ];

    this.log('Device found to pair');

    // Setup for next new device
    newDeviceFound = false;

    return devices;
  }

  /**
   * Method to send data
   */
  async registerFlowCards() {
    this.log('registerFlowCards has been called');

    // Trigger cards

    this._deviceMessageReceived = this.homey.flow.getDeviceTriggerCard("a-message-is-received");

    // Action cards
    this.homey.flow.getActionCard('send-data-to-end-device')
			.registerRunListener(async (args, state) => {
        let device = args.device;
				await device.sendData(args.payload);
			});

      // this.homey.flow.getActionCard('turned_on')
			// .registerRunListener(async (args, state) => {
      //   let device = args.device;
			// 	await device.sendData('on');
			// });

      // this.homey.flow.getActionCard('turned_off')
			// .registerRunListener(async (args, state) => {
      //   let device = args.device;
			// 	await device.sendData('off');
			// });

      // this.homey.flow.getActionCard('turn_off')
			// .registerRunListener(async ({ device }) => {
			// 	await device.sendData(false);
			// });



  }

  triggerMessageReceivedFlow(device, tokens, state) {
    this._deviceMessageReceived
      .trigger(device, tokens, state)
      .then(this.log)
      .catch(this.error);
  }


  /*
      Webhook methods
    */
  async registerWebhook() {

    // Register one webhook for all devices

    if (!WEBHOOK_ID || WEBHOOK_ID === '') {
      this.log('No webhook ID found, please check env.json');
      return;
    }

    if (this._webhook) {
      await this.unregisterWebhook().catch(this.error);
    }

    const key_path_value = await this.homey.settings.get('key_path_value');

    if (key_path_value) {

      this.log('Stored key path value (x-user-id): ' + key_path_value);

    } else {

      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      key_path_value = '';
      for (var i = 0; i < 10; i++)
        key_path_value += possible.charAt(Math.floor(Math.random() * possible.length));

      this.log('New key path value (x-user-id): ' + key_path_value);
      this.homey.settings.set('key_path_value', key_path_value);
    }

    this._webhook = await this.homey.cloud.createWebhook(WEBHOOK_ID, WEBHOOK_SECRET, { $key: key_path_value });
    // TODO: Bind this to onPair also to avoid using the global newDeviceFound
    this._webhook.on('message', this._onWebhookMessage.bind(this));

    this.log('Webhook registered');
  }

  async unregisterWebhook() {
    if (this._webhook) {
      await this._webhook.unregister();
      this.log('Webhook unregistered');
    }
  }

  _onWebhookMessage({ headers, body }) {

    if (!body) return;
    this.log('_onWebhookMessage', headers);
    this.log('_onWebhookMessage', body);

    const {
      'x-downlink-apikey': downlinkApikey,
      'x-downlink-push': downlinkPush,
      'x-downlink-replace': downlinkReplace
    } = headers;

    const {
      end_device_ids: {
        device_id: deviceId,
        application_ids: {
          application_id: applicationId
        },
       dev_eui: devEui,
       dev_addr: devAddr
      }
      //,
      // uplink_message: {
      //   f_port: fPort,
      //   f_cnt: fCnt,
      //   frm_payload: fmtPayload,
      //   decoded_payload:
      //   { state1: state1,
      //     state2: state2,
      //     value1: value1,
      //     value2: value2
      //   }
      // }
    } = body;

    if (!deviceId) return;

    // Try to find the device that matches the data?
    const device = this.getDevices().find(device => device.getData().id === deviceId);

    if (device){
      this.log("Uplink received for known device ID: " + deviceId);
      device.onUplinkMessage({ headers, body });
    } else{
      this.log("Uplink received for UNKNOWN device ID: " + deviceId);
      newDevice.downlinkApikey = downlinkApikey,
      newDevice.downlinkPush = downlinkPush,
      newDevice.downlinkReplace = downlinkReplace,
      newDevice.id = deviceId;
      newDevice.applicationId = applicationId;
      newDevice.devEui = devEui;
      newDevice.devAddr = devAddr;

      newDeviceFound = true;

      this.log(newDevice);
    }
  }

}

module.exports = MyDriver;
