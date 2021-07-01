# TTN Connector

Based on code from https://github.com/jordenc/webhook.manager

Make it easier to POST information to Homey from The Things Network Stack (TTNS), using webhooks.

### Note

This app does NOT implement loRa on Homey, rather it uses the internet to connect to TTS servers & pass data back & forth. From the TTNS servers the data is relayed via LoRaWAN gateways to end devices. For more info start here: https://www.thethingsindustries.com/docs/getting-started/quick-start/

The app assumes that your end device is connected correctly to the TTNS stack v3.

### Setup (using webhook template) - preferred method
1. After installing the app on Homey, go to the app 'Settings' page. It shows the 'Webhook ID' & 'Keypath Value'.
2. On your TTNS console (for Europe: https://eu1.cloud.thethings.network/console/) select: 'Go to Applications'> Relevant Application> Integrations > Webhooks > '+ Add Webhook'> Homey Template. Fill in the details from step 1.
3. Save!
4. Any messages received by the application should then be sent to your Homey via the webhook.


### Setup (using custom webhook) 
1. After installing the app on Homey, go to the app 'Settings' page. It shows the 'Webhook ID' & 'Keypath Value'.
2. On your TTNS console (for Europe: https://eu1.cloud.thethings.network/console/) select: 'Go to Applications'> Relevant Application> Integrations > Webhooks > '+ Add Webhook'> Custom Template. Fill in the details as follows:
    webhook ID - whatever you like  
    webhook format - JSON  
    BaseURL: https://webhooks.athom.com/webhook/your_Webhook_ID_from_step_1  
3. Add an additional header using authorization:
    x-user-id in  
    Value from step 1.  
4. Save!
4. Any messages received by the application should then be sent to your Homey via the webhook.

### Flowcard

Limited at the moment but create a trigger using the device id from the TTS found at Console> Applications>Relevant Application > End Devices. At the moment three data 'tags' can be used in the flow. These tags are associated with the data as formatted in the relevant payload formatters. For example using Javascript the code below extracts three bytes from the raw payload from the end device & formats them. There are lots more examples of this https://www.thethingsindustries.com/docs/integrations/payload-formatters/

```javascript
function decodeUplink(input) {
return {
    data: {
        //bytes: input.bytes
        data0: input.bytes[0].toString(),
        data1: input.bytes[1].toString(),
        data2: input.bytes[2].toString()
    },
        warnings: [],
        errors: []
    };
}
```


**Version 0.0.1**
- Initial release
