# The Things Network

Based on code from another [app](https://github.com/jordenc/webhook.manager).  

Make it easier to send information to Homey from The Things Network (TTN), using webhooks.

### Support
If you like this app & want to support further development please consider buying me a [coffee](https://www.buymeacoffee.com/oohehir).

### Note
I am not affiliated to 'The Things Network', this is my own work to hopefully help others integrate Homey & TTN.
This app does NOT implement loRa on Homey, rather it uses the internet to connect to TTN servers & pass data back & forth. From the TTN servers the data is relayed via LoRaWAN gateways to end devices. For more info start [here](https://www.thethingsindustries.com/docs/getting-started/quick-start/)   

The app assumes that your end device is connected correctly to the TTN stack v3.

### Setup (using webhook template) - preferred method
1. After installing the app on Homey, go to the app 'Settings' page. It shows the 'Webhook ID' & 'Keypath Value'.
2. On your TTN console (for [Europe](https://eu1.cloud.thethings.network/console/applications/)) select: 'Relevant Application> Integrations > Webhooks > '+ Add Webhook'> Homey Template. Fill in the details from step 1.
3. Save!
4. Any messages received by the application should then be sent to your Homey via the webhook.


### Setup (using custom webhook) 
1. After installing the app on Homey, go to the app 'Settings' page. It shows the 'Webhook ID' & 'Keypath Value'.
2. On your TTN console (for [Europe](https://eu1.cloud.thethings.network/console/applications/)) select: 'Relevant Application> Integrations > Webhooks > '+ Add Webhook'> Custom Template. Fill in the details as follows:  
    webhook ID - whatever you like  
    webhook format - JSON   
    BaseURL: https://webhooks.athom.com/webhook/your_Webhook_ID_from_step_1   
3. Add an additional header using authorization:  
    x-user-id  
    Value from step 1.   
4. Save!
4. Any messages received by the application should then be sent to your Homey via the webhook.

### Flowcard
Flows can be triggered by  
1. Uplink message
2. Uplink message from specific device
3. Uplink message from specific application  
Using the 'payload formatters' on TTN console it is possible to convert raw bytes to more meaningful state & sensor data. Two string (state1 & state2) & two values (value1 & value2) are extracted by the app & events can then be triggered, using appropriate logic cards, depending on their contents. For example the Javascript code below sends an example of such data (hard coded in this example). There are lots more [examples](https://www.thethingsindustries.com/docs/integrations/payload-formatters/) of this.  

```javascript
function decodeUplink(input) {
  return {
    data: {
      state1: "On",
      state2: "Off",
      value1: 10,
      value2: 39.64
      },
    warnings: [],
    errors: []
  };
}
```


**Version 0.0.1**
- Initial release
