'use strict';

const { Device } = require('homey');
const fetch = require('node-fetch');

class MyDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');

    // Send state change from Homey to device
    // Need to send this via webhook to TTN
    this.registerCapabilityListener('onoff', async (value) => {
     
      // Returns response status
      let res = await this.downlinkMsg().catch(this.error);
      this.log(res);
      if (res === 200){
        this.log("Downlink successful");
      }
      else{
        this.log("Downlink fail");
      }
      

    })

    // Set state (e.g. on receipt of webhook)
    // this.setCapabilityValue('onoff', true).catch(this.error)
    // this.setCapabilityValue('onoff', false).catch(this.error)

    // Advise that device is not reachable
    // this.setUnavailable();
  }

  // this method is called when the Device has requested a state change (turned on or off)
  //   async onCapabilityOnoff(value, opts) {
  //     this.log('Devices has requested a state change to ' + value);

  // ... set value to real device, e.g.
  // await setMyDeviceState({ on: value });
  // or, throw an error
  // throw new Error('Switching the device failed!');
  //}

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    let deviceData = await this.getData();
    let deviceStore = await this.getStore();

    this.log('MyDevice has been added:' + deviceData.id);
    this.log('applicationId: ' + deviceStore.applicationId);
    this.log('devEui: ' + deviceStore.devEui);
    this.log('devAddr: ' + deviceStore.devAddr);

    // TODO:
    // this.onInit();
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


  async downlinkMsg(downlinkData = "vu8=", downlinkPort = 1, downlinkPriority = "NORMAL") {
    let deviceStore = await this.getStore();

    if (!deviceStore.downlinkApikey || !deviceStore.downlinkPush) {
      this.error('Missing end device downlink URL or API key');
      throw new Error('Missing end device downlink URL or API key');
    }

    // https://www.thethingsindustries.com/docs/integrations/webhooks/scheduling-downlinks/#scheduling-downlinks

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deviceStore.downlinkApikey}`,
        'Content-Type': 'application/json'
      },
      body: `{"downlinks":[{"frm_payload":"${downlinkData}","f_port":${downlinkPort},"priority":"${downlinkPriority}"}]}`
    };

    //this.log('requestOptions = :');
    //this.log(requestOptions);

    let response = await fetch(`${deviceStore.downlinkPush}`,requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }else if(response.ok){
     // this.log("Downlink OK");
    }
  
    return response.status;
  }
}

module.exports = MyDevice;
