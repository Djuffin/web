importScripts("./demuxer_mp4.js");

function sendFrame(frame) {
  self.postMessage(frame, [frame]);
}

// Startup.
function main({dataUri}) {

  // Set up a VideoDecoer.
  const decoder = new VideoDecoder({
    output(frame) {
      sendFrame(frame);
      //console.log(`Frame decoded: ${frame.timestamp}`);
    },
    error(e) {
      console.log(e);
    }
  });

  // Fetch and demux the media data.
  const demuxer = new MP4Demuxer(dataUri, {
    onConfig(config) {
      decoder.configure(config);
    },
    onChunk(chunk) {
      decoder.decode(chunk);
    },
    setStatus(status, info) {
    	console.log(`Demuxer status: ${status} ${info}`);
    }
  });
}

// Listen for the start request.
self.addEventListener("message", message => main(message.data), {once: true});