# TTN Connector

Based on code from https://github.com/jordenc/webhook.manager

Make it easier to POST information to Homey from The Things Network Stack (TTNS), using webhooks.

### Note

This app does NOT implement loRa on Homey, rather it uses the internet to connect to TTS servers & pass data back & forth. From TTNS servers the data is relayed via LoRaWAN gateways to end devices. For more info start here: https://www.thethingsindustries.com/docs/getting-started/quick-start/

The app assumes that your end device is connected correctly to the TTNS stack v3.

### Setup

These steps are temporary & I hope to simplify them over time.
1. After installing the app, go to the 'Settings' page. It shows the 'Webhook ID'.
2. Retrieved your homeys 'cloudid' from here: https://tools.developer.homey.app/tools/system
3. On your TTS go to Console> Applications> Integrations > Webhooks > '+ Add Webhook'. Fill in the details as follows:
    webhook ID - whatever you like
    webhook format - JSON
    BaseURL: https://webhooks.athom.com/webhook/your_Webhook_ID_from_step_1
    Uplink message - enable & enter: /?homey=cloudif_from_step_2
    Save!
5. Any messages received by the application should then be sent to your Homey.

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
