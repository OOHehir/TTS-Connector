'use strict';

const Homey = require('homey');

class App extends Homey.App {
  async onInit() {

    const myToken = await this.homey.flow.createToken("tts_data1", {
      type: "text",
      title: "data1",
    });
  
    await myToken.setValue("");

    const cardTriggerEndDevice = this.homey.flow.getTriggerCard('msg-from-end-device');
    cardTriggerEndDevice.registerRunListener(async (args, state) => {
      // args is the user input,
      // for example { 'location': 'New York' }
      // state is the parameter passed in trigger()
      // for example { 'location': 'Amsterdam' }

      // If true, this flow should run
      return args.end_device_id === state.end_device_id ;
    });

    // const cardConditionData1 = this.homey.flow.getConditionCard('data1');
    // cardConditionData1.registerRunListener(async (args, state) => {
    //   this.log ('cardConditionData1 args = ' + args);  // this is the user input
    // 	this.log ('cardConditionData1 state = ' + state);  // passed by trigger
    //   const match = await 
    //   return args.data1 === state.data1;
    // });

    // const cardConditionData2 = this.homey.flow.getConditionCard('data2');
    // cardConditionData2.registerRunListener(async (args, state) => {
    //   return args.data2 === state.data2;
    // });

    // const cardConditionData3 = this.homey.flow.getConditionCard('data3');
    // cardConditionData3.registerRunListener(async (args, state) => {
    //   return args.data3 === state.data3;
    // });


    const id = Homey.env.WEBHOOK_ID;
    const secret = Homey.env.WEBHOOK_SECRET;
    var key_path_value 	=	this.homey.settings.get('key_path_value');

    if (key_path_value) {

			this.log ('Stored key path value (x-user-id): ' + key_path_value);

		} else {

			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			key_path_value = '';
		    for( var i=0; i < 10; i++ )
		        key_path_value += possible.charAt(Math.floor(Math.random() * possible.length));

			this.log('New key path value (x-user-id): ' + key_path_value);
			this.homey.settings.set('key_path_value', key_path_value);
		}

    const myWebhook = await this.homey.cloud.createWebhook(id, secret, {$key: key_path_value} );

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
        var decoded_payload_data0 = args.body.uplink_message.decoded_payload.data0;	// decoded_payload: { data1: '0' },
        var decoded_payload_data1 = args.body.uplink_message.decoded_payload.data1;	// decoded_payload: { data1: '0' },
        var decoded_payload_data2 = args.body.uplink_message.decoded_payload.data2;	// decoded_payload: { data1: '0' },
        //var payload_warnings = args.body.uplink_message.decoded_payload_warnings;	// decoded_payload_warnings: [],
      
        this.log('Msg from device_id: ' + end_device_id + ' with application_id: ' + application_id);
        this.log('Frame port: ' + f_port + ', frame count: ' + f_cnt + ', frame payload (Base64): ' + frm_payload +
        ', decoded payload object (decoded by the device payload formatter) data0: ' + decoded_payload_data0 +
        ', data1: ' + decoded_payload_data1 + ', data2: ' + decoded_payload_data2);
      
      }

      cardTriggerEndDevice.trigger({
        data1: decoded_payload_data0 || '',
        data2: decoded_payload_data1 || '',
        data3: decoded_payload_data2 || ''
      }, {'end_device_id': end_device_id})
      .then( console.log( 'event triggered for end_device_id ' + end_device_id) )
      .catch( this.error )

    });
  }
}

module.exports = App;
