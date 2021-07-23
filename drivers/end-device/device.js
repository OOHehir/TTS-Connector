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
      let device = await this.getData();
      this.log('Turned On/Off by Homey:', value);
    
        const requestOptions = {
          method: 'POST',
          headers: {
            // NNSXS.BD7UVBPG4HDEGX3C2W4CN2ZOIKL46G5QFZQV6CQ.NZCY2ECBWDW72D6VCPT446EIKZ4T3QMSFNELZSFY6EZPYFXVRBFQ
            'Authorization': `Bearer NNSXS.BD7UVBPG4HDEGX3C2W4CN2ZOIKL46G5QFZQV6CQ.NZCY2ECBWDW72D6VCPT446EIKZ4T3QMSFNELZSFY6EZPYFXVRBFQ`,
            //'Authorization': `Bearer ${device.downlinkApikey}`,
            'Content-Type': 'application/json'
          },
          body:  '{"downlinks":[{"frm_payload":"vu8=","f_port":15,"priority":"NORMAL"}]}'                        
          };
    
     //   const res = await fetch(`${device.downlinkPush}`, requestOptions);
     const res = await fetch(`https://eu1.cloud.thethings.network/api/v3/as/applications/heltec-esp32-otaa-led1/webhooks/homey-test-keypath/devices/2232330000889909/down/push`, 
                              requestOptions
                              )
                              .then(res => res.json())
                              .then(json => console.log(json));
     //https://eu1.cloud.thethings.network/api/v3/as/applications/heltec-esp32-otaa-led1/webhooks/homey-test-keypath/devices/2232330000889909/down/push

        this.log(res);
        
          // .catch(err => {
          //   this.log(err);
          // })
          // .then(function(response) {
          //   if (response.status >= 400 && response.status < 600) {
          //     this.homey.error(`Server responded with http/${response.status}`);
          //     throw new Error("Bad response from API. Check credentials and connection and try again!");
          //   }
          //   return response;
          // });

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
    let device = await this.getData();

    this.log('MyDevice has been added with deviceID: ' + device.id);
    this.log('applicationId: ' + device.applicationId);
    this.log('devEui: ' + device.devEui);
    this.log('devAddr: ' + device.devAddr);

    TODO:
    this.onInit();
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
    
    let device = await this.getData();
    
    try{
      this.log('Device with ID ' + device.id + ' has been deleted');
    } catch (error) {
      this.log('Failed to delete device with ID '+ device.id + '. Error:' +  error);
    }


  }

}

module.exports = MyDevice;
