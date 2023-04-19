importScripts("./libs/mp4box/mp4box.all.js");

class Encoder {
  constructor(options) {
      this.outputFile = MP4Box.createFile();

      this.encoder = new VideoEncoder({
        output : (chunk, md) => {
          if (md.decoderConfig) {
            const track_options = {
              timescale: 1_000_000,
              width: options.width,
              height: options.height,
              brands: ['isom', 'iso2', 'avc1', 'mp41'],
              avcDecoderConfigRecord: md.decoderConfig.description
            };
            this.track_id = this.outputFile.addTrack(track_options);
          }

          const buf = new ArrayBuffer(chunk.byteLength);
          chunk.copyTo(buf);
          this.outputFile.addSample(
            this.track_id,
            buf,
            {
              duration: chunk.duration ?? 0,
              dts: chunk.timestamp,
              cts: chunk.timestamp,
              is_sync: (chunk.type === 'key')
            }
          );

        },
        error(e) {
          console.log(e);
        }
      });
      this.encoder.configure({
        codec: 'avc1.42E01F',
        width: options.width,
        height: options.height,
        framerate: 30,
        hardwareAcceleration: 'prefer-hardware',
        bitrate: 1_000_000,
        avc: { format: 'avc' }
      });
  }

  mux() {
    const stream = new DataStream();
    stream.endianness = DataStream.BIG_ENDIAN;
    let boxes = this.outputFile.boxes;
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].write(stream);
    }
    self.postMessage(stream.buffer);
  }

  encode(frame) {
    this.encoder.encode(frame, { });
    frame.close();
  }

  async flush() {
    console.log('flushing encoder...');
    await this.encoder.flush();
    this.mux();
    console.log('flush completed');
  }
}

let encoder = null;
async function dispatch({command, frame, options}) {
	switch (command) {
		case 'init': {
      encoder = new Encoder(options);
			return;
		}

		case 'frame': {
      encoder.encode(frame);
			return;
		}

    case 'flush': {
      await encoder.flush();
    }
	}
}

// Listen for the start request.
self.addEventListener("message", message => dispatch(message.data));