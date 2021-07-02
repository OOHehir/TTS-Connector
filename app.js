'use strict';

const Homey = require('homey');

var key_path_value;
const cloudhookID = Homey.env.WEBHOOK_ID;

class App extends Homey.App {
  async onInit() {

    const cardTriggerSpecificDevice = this.homey.flow.getTriggerCard('msg-from-end-device');
    cardTriggerSpecificDevice.registerRunListener(async (args, state) => {
      // args is the user input,
      // state is the parameter passed in trigger()
      // If true, this flow should run
      return args.end_device_id === state.end_device_id;
    });

    // No arguments, no runListener required
    const cardTriggerAnyDevice = this.homey.flow.getTriggerCard('msg-from-any-device');

    const cardTriggerSpecificApplication = this.homey.flow.getTriggerCard('msg-from-application');
    cardTriggerSpecificApplication.registerRunListener(async (args, state) => {
      return args.application_id === state.application_id;
    });


    const secret = Homey.env.WEBHOOK_SECRET;
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

    // Test webhook using
    // curl -d '{"event":"Hello_World"}' -H "x-user-id: <user-id-above>" -H "Content-Type: application/json" https://webhooks.athom.com/webhook/<WEBHOOK_ID>

    myWebhook.on('message', args => {
      this.log('Got a webhook message!');
      //this.log('headers:', args.headers);
      //this.log('query:', args.query);
      //this.log('body:', args.body);

      if (typeof args.body.uplink_message) {
        var end_device_id = args.body.end_device_ids.device_id;			// device_id: '2232330000889909',
        var application_id = args.body.end_device_ids.application_ids.application_id; // application_ids: { application_id: 'heltec-esp32-otaa-led1' }
        var f_port = args.body.uplink_message.f_port;
        var f_cnt = args.body.uplink_message.f_cnt;
        var frm_payload = args.body.uplink_message.frm_payload;	// 'AAECAw==',
        var decoded_payload_state1 = args.body.uplink_message.decoded_payload.state1;	// decoded_payload: { state1: '0' },
        var decoded_payload_state2 = args.body.uplink_message.decoded_payload.state2;	// decoded_payload: { state2: '0' },
        var decoded_payload_value1 = args.body.uplink_message.decoded_payload.value1;	// decoded_payload: { value1: '0' },
        var decoded_payload_value2 = args.body.uplink_message.decoded_payload.value2;	// decoded_payload: { value2: '0' },
        //var payload_warnings = args.body.uplink_message.decoded_payload_warnings;	// decoded_payload_warnings: [],

        this.log('Msg from device_id: ' + end_device_id + ' with application_id: ' + application_id);
        this.log('Frame port: ' + f_port + ', frame count: ' + f_cnt + ', frame payload (Base64): ' + frm_payload +
          ', decoded payload object (decoded by the device payload formatter) state1: ' + decoded_payload_state1 +
          ', state2: ' + decoded_payload_state2 + ', value1: ' + decoded_payload_value1, + ', value2: ' + decoded_payload_value2);

        cardTriggerSpecificDevice.trigger({
          end_device_id: end_device_id || '',
          application_id: application_id || '',
          state1: decoded_payload_state1 || '',
          state2: decoded_payload_state2 || '',
          value1: decoded_payload_value1 || '',
          value2: decoded_payload_value2 || ''
        }, { 'end_device_id': end_device_id })
          .then(console.log('event triggered for cardTriggerSpecificDevice: ' + end_device_id))
          .catch(this.error);
        cardTriggerAnyDevice.trigger({
          end_device_id: end_device_id || '',
          application_id: application_id || '',
          state1: decoded_payload_state1 || '',
          state2: decoded_payload_state2 || '',
          value1: decoded_payload_value1 || '',
          value2: decoded_payload_value2 || ''
        }, {})
          .then(console.log('event triggered for cardTriggerAnyDevice: ' + end_device_id))
          .catch(this.error);
        cardTriggerSpecificApplication.trigger({
          end_device_id: end_device_id || '',
          application_id: application_id || '',
          state1: decoded_payload_state1 || '',
          state2: decoded_payload_state2 || '',
          value1: decoded_payload_value1 || '',
          value2: decoded_payload_value2 || ''
        }, { 'application_id': application_id })
          .then(console.log('event triggered for cardTriggerSpecificApplication: ' + application_id))
          .catch(this.error);
      }
    });
  }
}

module.exports = App;
