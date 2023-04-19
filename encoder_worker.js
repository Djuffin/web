
let frame_processor = null;
async function dispatch({command, frame, options}) {
	switch (command) {
		case 'init': {
      encoder = new VideoEncoder({
        output(chunk, md) {
          //console.log("Encoded: " + chunk.byteLength);
        },
        error(e) {
          console.log(e);
        }
      });
      encoder.configure({
        codec: 'avc1.42E01F',
        width: options.width,
        height: options.height,
        framerate: 30,
        hardwareAcceleration: 'prefer-hardware',
        bitrate: 3_000_000,
        avc: { format: 'annexb' }
      });
			return;
		}
		case 'frame': {
      encoder.encode(frame, { });
      frame.close();
			return;
		}
    case 'flush': {
      await encoder.flush();
      self.postMessage('done');
    }
	}
}

// Listen for the start request.
self.addEventListener("message", message => dispatch(message.data));