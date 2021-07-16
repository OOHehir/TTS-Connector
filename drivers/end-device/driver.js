'use strict';

// https://github.com/athombv/nl.thermosmart-example/blob/master/drivers/thermostat/driver.js

const Homey = require('homey');

const WEBHOOK_ID = Homey.env.WEBHOOK_ID;
const WEBHOOK_SECRET = Homey.env.WEBHOOK_SECRET;

class MyDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
    await this.registerFlowCards();
    await this.registerWebhook();
  }


  async onPair(){
    // Use session to capture data from webhook & pass it back to this??

  }



  // /**
  //  * onPairListDevices is called when a user is adding a device
  //  * and the 'list_devices' view is called.
  //  * This should return an array with the data of devices that are available for pairing.
  //  */
  // async onPairListDevices() {
  //   return [
  //     // Example device data, note that `store` is optional
  //     {
  //       name: 'My End Device',
  //       data: {
  //         id: 'my-device-001',
  //       },
  //       store: {
  //         //address: '127.0.0.1',
  //       },
  //     },
  //   ];
  // }



  async registerFlowCards() {
    this.log('registerFlowCards has been called');
  }

  /*
      Webhook methods
    */
  async registerWebhook() {

    // Register one webhook for all TTN devices

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
    this._webhook.on('message', this._onWebhookMessage.bind(this));

    this.log('Webhook registered');
  }

  async unregisterWebhook() {
    if (this._webhook) {
      await this._webhook.unregister();
      this.log('Webhook unregistered');
    }
  }

  _onWebhookMessage({ body }) {
    this.log('_onWebhookMessage', body);
    if (!body) return;

    const {
      end_device_ids: {
        device_id: deviceId,
        application_ids: {
          application_id: applicationId
        },
        dev_eui: devEui,
        dev_addr: devAddr
      },
      uplink_message: {
        f_port: fPort,
        f_cnt: fCnt,
        frm_payload: fmtPayload,
        decoded_payload:
        { state1: state1,
          state2: state2,
          value1: value1,
          value2: value2
        }
      }
    } = body;

    if (!deviceId) return;

    this.log('deviceID: ' + deviceId);
    this.log('applicationId: ' + applicationId);
    this.log('devEui: ' + devEui);
    this.log('devAddr: ' + devAddr);
    this.log('fPort: ' + fPort);
    this.log('fCnt: ' + fCnt);
    this.log('fmtPayload: ' + fmtPayload);
    this.log('state1: ' + state1);
    this.log('state2: ' + state2);
    this.log('value1: ' + value1);
    this.log('value2: ' + value2);

    // Try to find the device that matches the data?
    const device = this.getDevices().find(device => device.getData().id === deviceId);

    if (!device) {
      return this.error('Got webhook for unknown device');
    }
    else {
      this.log('webhook matched to deviceId: ' + device);
    }

    if (typeof state1 === 'string') {
      device.setCapabilityValue('onoff', state1).catch(this.error);
    }

  }

}

module.exports = MyDriver;
