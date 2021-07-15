'use strict';

// https://github.com/athombv/nl.thermosmart-example/blob/master/drivers/thermostat/driver.js

const { Driver } = require('homey');

class MyDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
    await this.registerFlowCards();
    await this.registerWebhook();
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      // Example device data, note that `store` is optional
      {
        name: 'My End Device',
        data: {
          id: 'my-device-001',
        },
        store: {
          //address: '127.0.0.1',
        },
      },
    ];
  }

  async registerFlowCards() {
    this.log('registerFlowCards has been called');
  }

  /*
      Webhook methods
    */
  async registerWebhook() {
    
    const WEBHOOK_ID = Homey.env.WEBHOOK_ID;
    const WEBHOOK_SECRET = Homey.env.WEBHOOK_SECRET;
    key_path_value = this.homey.settings.get('key_path_value');

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

    const myWebhook = await this.homey.cloud.createWebhook(cloudhookID, secret, { $key: key_path_value });
    this._webhook.on('message', this._onWebhookMessage.bind(this));

    this.log('New webhook registered for');
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
      thermostat: thermostatId,
      room_temperature,
      target_temperature,
      source,
    } = body;
    if (!thermostatId) return;

    const device = this.getDevices().find(device => device.getData().id === thermostatId);

    if (!device)
      return this.error('Got webhook for unknown device');

    if (typeof room_temperature === 'number') {
      device.setCapabilityValue('measure_temperature', room_temperature).catch(this.error);
    }

    if (typeof target_temperature === 'number') {
      device.setCapabilityValue('target_temperature', target_temperature).catch(this.error);
    }

    if (typeof source === 'string') {
      this.triggerPaused(device, source === 'pause').catch(this.error)
    }
  }

}

module.exports = MyDriver;
