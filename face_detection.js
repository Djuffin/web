importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js");
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgpu/dist/tf-backend-webgpu.js");
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js")
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection")

function sendFrame(frame) {
  let transfer = frame ? [frame] : null;
  self.postMessage(frame, transfer);
}

await tf.setBackend(backend);

async function main({frame}) {
	if (!self.offscreen) {
		self.offscreen = new OffscreenCanvas(frame.codedWidth, frame.codedHeight);
		self.offscreen_ctx = offscreen.getContext('2d', {willReadFrequently : false});

	    const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
	    const detectorConfig = {
	        runtime: 'tfjs',
	        //modelType: 'short',
	        modelType: 'full',
	        maxFaces: 7,
	    };
	    self.detector = await faceDetection.createDetector(model, detectorConfig);
	}
	let ctx = self.offscreen_ctx;
	let offscreen = self.offscreen;

	ctx.drawImage(frame, 0, 0);
    const faces = await self.detector.estimateFaces(offscreen);
    for (let face of faces) {
        const box = face.box;
        const safety_margin = box.width / 10;
        box.xMin -= safety_margin;
        box.yMin -= safety_margin;
        box.width += 2 * safety_margin;
        box.height += 2 * safety_margin;

        ctx.fillRect(box.xMin, box.yMin, box.width, box.height);
    }
    sendFrame(new VideoFrame(offscreen, { timestamp: frame.timestamp }));
    frame.close();
}

// Listen for the start request.
self.addEventListener("message", message => main(message.data), {once: false});
