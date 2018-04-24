// var accelerometer_axis = [ 7, 8, 9 ],
// 	byteId_format_19 = [ 100, 201 ],
// 	byteId_impedance = [ 200, 206 ],
// 	byteId_ascii = 206,
// 	byteId_end_ascii = 207,
// 	BUFFER_LENGTH_ERR = -1,
// 	BYTEID_ERR = -2,
// 	samples_count = 0,
// 	samples = [2, 4],

// 	V_SCALE = 1.2 * 8388607.0 * 1.5 * 51.0,
// 	A_SCALE = 0.032,

// 	id,
// 	accelerometer = [],
// 	data = [],
//     last_ascii_msg = "",
    
// 	impedance_channels = [5];// impedance_channels : respectively : 1, 2, 3, 4, ref;

//         var has_accelerometer = this.samples_count % 10;
//         if (id % 10 == 7)      x = buffer[19]; //python version has 1,2,3 instead of 7,8,9 ???
//         else if (id % 10 == 8) y = buffer[19];
//         else if (id % 10 == 9) z = buffer[19];

function parse(buffer, data_callback) {
    var id = buffer[0]
    if (id == 0)
        set_channels_raw(buffer, data_callback)
    else if (id > 0 && id < 101)
        set_channels_18(buffer, data_callback)
    else if (id > 100 && id < 201)
        set_channels_19(buffer, data_callback)
    else if (id > 200 && id < 206)
        set_impedance_channel(id - 201, buffer)
    else if (id == 206) console.log('Achii Bytes:' + JSON.stringify(buffer))
    else if (id == 207) console.log('byteID end_ascii')
}

function set_impedance_channel(channel, buffer) {
    var len = buffer.length - 1;
    while (len != 0 && isNaN(buffer[len])) len--;
    if (len != 0) console.log(buffer[len]) //console out IMPEDENCE
}

function set_channels_raw(buffer, data_callback) {
    if (buffer.length != 20) return console.log('BUFFER_LENGTH_ERR');
    bit_format_16(buffer, data_callback)
}

function set_channels_18(buffer, data_callback) {
        if(buffer.length != 20) console.log('BUFFER_LENGTH_ERR');
        bit_format_18([
                [
                        [  (buffer[1] >> 6), (((buffer[1] & 0x3F) << 2) | (buffer[2] >> 6)), (((buffer[2] & 0x3F) << 2) | (buffer[3] >> 6))],
                        [ ((buffer[3] & 0x3F) >> 4), ((buffer[3] << 4) | (buffer[4] >> 4)), ((buffer[4] << 4) | (buffer[5] >> 4))],
                        [  ((buffer[5] & 0x0F) >> 2), ((buffer[5] << 6) | (buffer[6] >> 2)), ((buffer[6] << 6) | (buffer[7] >> 2))],
                        [ (buffer[7] & 0x03), buffer[8], buffer[9] ],
                ], [
                	[  (buffer[10] >> 6), (((buffer[10] & 0x3F) << 2) | (buffer[11] >> 6)), (((buffer[11] & 0x3F) << 2) | (buffer[12] >> 6))],
                	[  ((buffer[12] & 0x3F) >> 4), ((buffer[12] << 4) | (buffer[13] >> 4)), ((buffer[13] << 4) | (buffer[14] >> 4))],
        	        [  ((buffer[14] & 0x0F) >> 2), ((buffer[14] << 6) | (buffer[15] >> 2)), ((buffer[15] << 6) | (buffer[16] >> 2))],
        	        [ (buffer[16] & 0x03), buffer[17], buffer[18] ],
                ]
        ], buffer[19], data_callback) //samples of channels, accelerometer, data callback to put the parsed data in
}

function set_channels_19(buffer, data_callback) {
        if(buffer.length != 20) console.log('BUFFER_LENGTH_ERR');
        bit_format_19([
                [
                        [  (buffer[1] >> 5), (((buffer[1] & 0x1F) << 3) | (buffer[2] >> 5)), (((buffer[2] & 0x1F) << 3) | (buffer[3] >> 5))],
                	[  ((buffer[3] & 0x1F) >> 2), ((buffer[3] << 6) | (buffer[4] >> 2)), ((buffer[4] << 6) | (buffer[5] >> 2))]
                	[  (((buffer[5] & 0x03) << 1) | (buffer[6] >> 7)), (((buffer[6] & 0x7F) << 1) | (buffer[7] >> 7)), (((buffer[7] & 0x7F) << 1) | (buffer[8] >> 7))]
                	[  (((buffer[8] & 0x7F) >> 4)), (((buffer[8] & 0x0F) << 4) | (buffer[9] >> 4)), (((buffer[9] & 0x0F) << 4) | (buffer[10] >> 4))]
                ], [
                        [  ((buffer[10] & 0x0F) >> 1), ((buffer[10] << 7) | (buffer[11] >> 1)), ((buffer[11] << 7) | (buffer[12] >> 1))]
                	[  (((buffer[12] & 0x01) << 2) | (buffer[13] >> 6)), ((buffer[13] << 2) | (buffer[14] >> 6)), ((buffer[14] << 2) | (buffer[15] >> 6))]
                	[  (((buffer[15] & 0x38) >> 3)), (((buffer[15] & 0x07) << 5) | ((buffer[16] & 0xF8) >> 3)), (((buffer[16] & 0x07) << 5) | ((buffer[17] & 0xF8) >> 3))]
                        [ (buffer[17] & 0x07), buffer[18], buffer[19] ]
                ]
        ], data_callback)
}

function bit_format_16(b, data_callback) {
        var channels = [], channel, indexes = [1, 4, 7, 10];
        for(let i = 0; i < indexes.length; i++) {
                channel = ((0xFF & b[indexes[i]]) << 16) | ((0xFF & b[indexes[i] + 1]) << 8) | (0xFF & b[indexes[i] + 2]);
                channel = ((channel & 0x00800000) > 0) ? (channel | 0xFF000000) : channel & 0x00FFFFFF;
        }
        data_callback({cs: [channels]})
}

function bit_format_18(samples, aux, data_callback) {
        var channels = [], channel, default_byte;
        for(let i = 0; i < samples.length; i++) { //should only be 2 samples
                channel = []
                for(let j = 0; j < samples[i].length; j++) {
                        default_byte = 0;
                        if ((samples[i][j][2] & 0x01) > 0)
                                default_byte = 0x3FFF;
                        channel.push( (default_byte << 18) | (samples[i][j][0] << 16) | (samples[i][j][1] << 8) | samples[i][j][2] )
                }
                channels.push(channel)
        }

        data_callback({cs: channels, accelerometer: aux})
}

function bit_format_19(samples, data_callback) {
        var channels = [], channel, default_byte;
        for(let i = 0; i < samples.length; i++) { //should only be 2 samples
                channel = []
                for(let j = 0; j < samples[i].length; j++) {
                        default_byte = 0;
                        if ((samples[i][j][2] & 0x01) > 0)
                                default_byte = 0x3FFF;
                        channel.push( (default_byte << 19) | (samples[i][j][0] << 16) | (samples[i][j][1] << 8) | samples[i][j][2] )
                }
                channels.push(channel)
        }

        data_callback({cs: channels})
}
