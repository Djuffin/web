//importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js");
//importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgpu/dist/tf-backend-webgpu.js");
//importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js")
//importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection")

class FrameProcessor {
	async init(options) {
		//await tf.setBackend(options.backend);
		this.width = options.width;
		this.height = options.height;

		this.offscreen = new OffscreenCanvas(this.width, this.height, { alpha : false });
		this.ctx = this.offscreen.getContext('2d');
		this.ctx.filter = "contrast(1.4) sepia(0.9)";

		/*
		const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
		const detectorConfig = {
				runtime: 'tfjs',
				modelType: 'short',
				//modelType: 'full',
				maxFaces: 5,
		};
		this.detector = await faceDetection.createDetector(model, detectorConfig);
		*/
		if (this.ready_callback)
			this.ready_callback();
	}

	async waitTillReady() {
		if (this.offscreen)
			return;

		return new Promise((resolve, reject) => {
				this.ready_callback = resolve;
		});
	}

	async processFrame(frame) {
    this.ctx.drawImage(frame, 0, 0);
		/*
    const faces = await this.detector.estimateFaces(this.offscreen);
    for (let face of faces) {
        const box = face.box;
        const safety_margin = box.width / 10;
        box.xMin -= safety_margin;
        box.yMin -= safety_margin;
        box.width += 2 * safety_margin;
        box.height += 2 * safety_margin;

        this.ctx.fillRect(box.xMin, box.yMin, box.width, box.height);
    }*/
    this.sendFrame(new VideoFrame(this.offscreen, { timestamp: frame.timestamp }));
    frame.close();
	}

	sendFrame(frame) {
		let transfer = frame ? [frame] : null;
		self.postMessage(frame, transfer);
	}
}

let frame_processor = null;
async function dispatch({command, frame, options}) {
	switch (command) {
		case 'init': {
			frame_processor = new FrameProcessor();
			await frame_processor.init(options);
			return;
		}
		case 'frame': {
			await frame_processor.waitTillReady();
			await frame_processor.processFrame(frame);
			return;
		}
	}
}

self.addEventListener("message", message => dispatch(message.data));
