class Ganglion
{
    constructor() {
		this.accelerometer_axis = [ 7, 8, 9 ]
		this.byteId_format_18 = [ 0, 101 ]
		this.byteId_format_19 = [ 100, 201 ]
		this.byteId_impedance = [ 200, 206 ]
		this.byteId_ascii = 206
		this.byteId_end_ascii = 207
		this.BUFFER_LENGTH_ERR = -1
		this.BYTEID_ERR = -2
		this.samples_count = 0
		this.samples = [2, 4]
	
        this.V_SCALE = 1.2 * 8388607.0 * 1.5 * 51.0;
        this.A_SCALE = 0.032;

	    this.id;
	    this.accelerometer = [];
	    this.data = [];
	    this.last_ascii_msg = "";

	    // impedance_channels : respectively : 1, 2, 3, 4, ref;
	    this.impedance_channels = [5];
    }

	parse(buffer)
	{
		this.id = buffer[0];
		if (this.id == 0)
			return (this.set_channels_raw(buffer));
		else if (this.id > this.byteId_format_18[0] && this.id < this.byteId_format_18[1])
			return (this.set_channels_18(buffer));
		else if (this.id > this.byteId_format_19[0] && this.id < this.byteId_format_19[1])
			return (this.set_channels_19(buffer));
		else if (this.id > this.byteId_impedance[0] && this.id < this.byteId_impedance[1])
			return (this.set_impedance_channel(this.id - 201, buffer));
		else if (this.id == this.byteId_ascii)
			return (this.set_ascii(buffer));
		else if (this.id == this.byteId_end_ascii)
			return (0);
		//return (this.BYTEID_ERR);
	}

	process_sample(sample)
	{
		if (sample != 0 && sample != 1)
			return (-1);
		if (this.id > this.byteId_format_18[0] && this.id < this.byteId_format_19[1]){
			this.data[0] += this.samples[sample, 0];
			this.data[1] += this.samples[sample, 1];
			this.data[2] += this.samples[sample, 2];
			this.data[3] += this.samples[sample, 3];
		}
		return (0);
	}

	set_ascii(buffer){
		msg = '#'.repeat(buffer.length)
		for (x = 0; x < buffer.length; x++){
			msg[x] = buffer[x];
		}
		this.last_ascii_msg = msg
	}

	set_impedance_channel(channel, buffer)
	{
		len = buffer.length - 1;
		while (len != 0 && isNaN(buffer[len]))
			len--;
		if (len != 0)
			this.impedance_channels[channel] = buffer[len];
	}

	set_channels_raw(buffer)
	{
		if (buffer.length != 20)
			return (BUFFER_LENGTH_ERR);
		this.data[0] = this.bit_format_16(buffer, 1);
		this.data[1] = this.bit_format_16(buffer, 4);
		this.data[2] = this.bit_format_16(buffer, 7);
		this.data[3] = this.bit_format_16(buffer, 10);
		return (0);
	}

	set_channels_18(buffer)
	{
        var s0_c0, s0_c1, s0_c2, s0_c3, s1_c0, s1_c1, s1_c2, s1_c3;
		if (buffer.length != 20)
			return (BUFFER_LENGTH_ERR);
		this.samples_count += 2;
		s0_c0 = [  (buffer[1] >> 6),
								(((buffer[1] & 0x3F) << 2) | (buffer[2] >> 6)),
								(((buffer[2] & 0x3F) << 2) | (buffer[3] >> 6))]
		s0_c1 = [ ((buffer[3] & 0x3F) >> 4),
								((buffer[3] << 4) | (buffer[4] >> 4)),
								((buffer[4] << 4) | (buffer[5] >> 4))]
		s0_c2 = [  ((buffer[5] & 0x0F) >> 2),
								((buffer[5] << 6) | (buffer[6] >> 2)),
								((buffer[6] << 6) | (buffer[7] >> 2))]
		s0_c3 = [ (buffer[7] & 0x03), buffer[8], buffer[9] ]
		this.set_sample(0, s0_c0, s0_c1, s0_c2, s0_c3, 18);
		s1_c0 = [  (buffer[10] >> 6),
								(((buffer[10] & 0x3F) << 2) | (buffer[11] >> 6)),
								(((buffer[11] & 0x3F) << 2) | (buffer[12] >> 6))]
		s1_c1 = [  ((buffer[12] & 0x3F) >> 4),
								((buffer[12] << 4) | (buffer[13] >> 4)),
								((buffer[13] << 4) | (buffer[14] >> 4))]
		s1_c2 = [  ((buffer[14] & 0x0F) >> 2),
								((buffer[14] << 6) | (buffer[15] >> 2)),
								((buffer[15] << 6) | (buffer[16] >> 2))]
		s1_c3 = [ (buffer[16] & 0x03), buffer[17], buffer[18] ]
		this.set_sample(1, s1_c0, s1_c1, s1_c2, s1_c3, 18);
		var has_accelerometer = this.samples_count % 10;
		if (has_accelerometer == this.accelerometer_axis[0])
			this.accelerometer[0] = buffer[19];
		else if (has_accelerometer == this.accelerometer_axis[1])
			this.accelerometer[1] = buffer[19];
		else if (has_accelerometer == this.accelerometer_axis[2])
			this.accelerometer[2] = buffer[19];
	}

	set_channels_19(buffer)
	{
        var s0_c0, s0_c1, s0_c2, s0_c3, s1_c0, s1_c1, s1_c2, s1_c3;
		if (buffer.length != 20)
			return (BUFFER_LENGTH_ERR);
		this.samples_count += 2;
		s0_c0 = [  (buffer[1] >> 5),
								(((buffer[1] & 0x1F) << 3) | (buffer[2] >> 5)),
								(((buffer[2] & 0x1F) << 3) | (buffer[3] >> 5))]
		s0_c1 = [  ((buffer[3] & 0x1F) >> 2),
								((buffer[3] << 6) | (buffer[4] >> 2)),
								((buffer[4] << 6) | (buffer[5] >> 2))]
		s0_c2 = [  (((buffer[5] & 0x03) << 1) | (buffer[6] >> 7)),
								(((buffer[6] & 0x7F) << 1) | (buffer[7] >> 7)),
								(((buffer[7] & 0x7F) << 1) | (buffer[8] >> 7))]
		s0_c3 = [  (((buffer[8] & 0x7F) >> 4)),
								(((buffer[8] & 0x0F) << 4) | (buffer[9] >> 4)),
								(((buffer[9] & 0x0F) << 4) | (buffer[10] >> 4))]
		this.set_sample(0, s0_c0, s0_c1, s0_c2, s0_c3, 19);
		s1_c0 = [  ((buffer[10] & 0x0F) >> 1),
								((buffer[10] << 7) | (buffer[11] >> 1)),
								((buffer[11] << 7) | (buffer[12] >> 1))]
		s1_c1 = [  (((buffer[12] & 0x01) << 2) | (buffer[13] >> 6)),
								((buffer[13] << 2) | (buffer[14] >> 6)),
								((buffer[14] << 2) | (buffer[15] >> 6))]
		s1_c2 = [  (((buffer[15] & 0x38) >> 3)),
								(((buffer[15] & 0x07) << 5) | ((buffer[16] & 0xF8) >> 3)),
								(((buffer[16] & 0x07) << 5) | ((buffer[17] & 0xF8) >> 3))]
		s1_c3 = [ (buffer[17] & 0x07), buffer[18], buffer[19] ]
		this.set_sample(1, s1_c0, s1_c1, s1_c2, s1_c3, 19);
		return (0);
	}

	set_sample(sample, channel_0, channel_1, channel_2, channel_3, size)
	{
		if (size == 18)
		{
			this.samples[sample, 0] = this.bit_format_18(channel_0);
			this.samples[sample, 1] = this.bit_format_18(channel_1);
			this.samples[sample, 2] = this.bit_format_18(channel_2);
			this.samples[sample, 3] = this.bit_format_18(channel_3);
		}
		else
		{
			this.samples[sample, 0] = this.bit_format_19(channel_0);
			this.samples[sample, 1] = this.bit_format_19(channel_1);
			this.samples[sample, 2] = this.bit_format_19(channel_2);
			this.samples[sample, 3] = this.bit_format_19(channel_3);
		}
	}

	bit_format_16(b, index)
	{
		var result = ((0xFF & b[index]) << 16) | ((0xFF & b[index + 1]) << 8) | (0xFF & b[index + 2]);
		if ((result & 0x00800000) > 0)
			result = (result | 0xFF000000);
		else
			result = result & 0x00FFFFFF;
		return (result);
	}

	bit_format_18(to_concat)
	{
		var default_byte = 0;
		if ((to_concat[2] & 0x01) > 0)
			default_byte = 0x3FFF;
		return (default_byte << 18) | (to_concat[0] << 16) | (to_concat[1] << 8) | to_concat[2];
	}

	bit_format_19(to_concat)
	{
		var default_byte = 0;
		if ((to_concat[2] & 0x01) > 0)
			default_byte = 0x3FFF;
		return (default_byte << 19) | (to_concat[0] << 16) | (to_concat[1] << 8) | to_concat[2];
	}
}

// module.exports = Ganglion;