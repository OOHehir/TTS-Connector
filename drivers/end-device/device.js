'use strict';

const { Device } = require('homey');
const fetch = require('node-fetch');

class MyDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');

    // Send state change from Homey to device (via Webhook)
    this.registerCapabilityListener('onoff', this._onCapabilitySetOnOff.bind(this));


    // Set state (e.g. on receipt of webhook)
    // this.setCapabilityValue('onoff', true).catch(this.error)
    // this.setCapabilityValue('onoff', false).catch(this.error)

    // Advise that device is not reachable
    // this.setUnavailable();
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    let data = await this.getData();
    let store = await this.getStore();

    this.log('MyDevice has been added: ' + data.id);
    this.log('applicationId: ' + store.applicationId);
    this.log('devEui: ' + devEui);
    this.log('devAddr: ' + store.devAddr);

    console.log("settings are:");
    console.log(settings.username);

  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronize the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {

    let deviceData = await this.getData();

    try {
      this.log('Device with ID ' + deviceData.id + ' has been deleted');
    } catch (error) {
      this.log('Failed to delete device with ID ' + deviceData.id + '. Error:' + error);
    }
  }

  /*
    Capabilities
  */

 // Send state change from Homey to device (via Webhook)
  async _onCapabilitySetOnOff(onoff) {
    this.log("onoff capability called");
    // Should be of form: {"state1":"false"}
    let payload = `{"state1": "${onoff}"}`;
    this.log("payload:");
    this.log(payload);
    return this.sendData(payload);
  }

  /*
    Methods
  */

  /**
   * Send data to end device
   * @param {string} payload
   * @return {boolean} true/ false
   */
  async sendData(payload) {
    let res = await this.downlinkMsg(payload, 1, undefined).catch(this.error);
    this.log(res);
    if (res === 200) {
      this.log("Downlink successful");
      return true;
    }
    else {
      this.log("Downlink fail");
      return false;
    }
  }

  async onUplinkMessage({ headers, body }) {

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

    this.log("Uplink headers:");
    this.log(headers);
    this.log("Uplink Body:");
    this.log(body);

    // Device has changed state, update Homey
    if (typeof state1 === 'string' || state1 instanceof String) {

      if (state1.toLowerCase() === 'on'){
        this.setCapabilityValue('onoff', true).catch(this.error);
        this.log("CapabilityOnoff set on");
      }
      else if (state1.toLowerCase() === 'off') {
        this.setCapabilityValue('onoff', false).catch(this.error);
        this.log("CapabilityOnoff set off");
      }
    }
    else{
      this.log("state1 is type of" + typeof state1);
    }

    let device = this; // We're in a Device instance

    let tokens = {
      end_device_id: deviceId,
      application_id: applicationId,
      state1: state1,
      state2: state2,
      value1: value1,
      value2: value2
    };

    let state = { state1 };

    this.driver.triggerMessageReceivedFlow(device, tokens, state);

    let store = await this.getStore();
    // Keep a track of uplinks
    store.uplinkCount = store.uplinkCount++;

    // Check if values need to be updated
    if (downlinkApikey === 'string' && store.downlinkApikey != downlinkApikey) {
      this.log("downlinkApikey updated");
      setStoreValue(downlinkApikey, downlinkApikey);
    } else {
      this.log("downlinkApikey valid");
    }

    if (downlinkPush === 'string' && store.downlinkPush != downlinkPush) {
      this.log("downlinkPush updated");
      setStoreValue(downlinkPush, downlinkPush);
    } else {
      this.log("downlinkPush valid");
    }

    if (downlinkReplace === 'string' && store.downlinkReplace != downlinkReplace) {
      this.log("downlinkReplace updated");
      setStoreValue(downlinkReplace, downlinkReplace);
    } else {
      this.log("downlinkReplace valid");
    }

  }
  /**
   * downlinkMsg is used to send a downlink message to a TTN end device
   * @param {string} downlinkData plain language data to send
   * @param {integer} downlinkPort port number to send data on
   * @param {string} downlinkPriority priority for message (from TTN network)
   * @returns {Promise<integer>} returns response status 
   */
  async downlinkMsg(downlinkData, downlinkPort = 1, downlinkPriority = "NORMAL") {
    let store = await this.getStore();

    if (!downlinkData) {
      throw new Error('No data to send');
    }

    if (!store.downlinkApikey || !store.downlinkPush) {
      throw new Error('Missing end device downlink URL or API key');
    }

    // Keep track of downlinks
    store.downlinkCount = store.downlinkCount++;

    // https://www.thethingsindustries.com/docs/getting-started/api/#schedule-downlink

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${store.downlinkApikey}`,
        'Content-Type': 'application/json'
      },
      // body: `{"downlinks":[{"frm_payload":"${downlinkData}","f_port":${downlinkPort},"priority":"${downlinkPriority}"}]}`
      // Decoded payload
      body: `{"downlinks": [{"decoded_payload": {"data": ${downlinkData}},"f_port": ${downlinkPort},"priority":"${downlinkPriority}"}]}`
    };

    this.log('requestOptions = :');
    this.log(requestOptions);

    let response = await fetch(`${store.downlinkPush}`, requestOptions);

    this.log('Server response:');
    this.log(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else if (response.ok) {
      // this.log("Downlink OK");
    }

    return response.status;
  }
}

module.exports = MyDevice;
