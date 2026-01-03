// 音频处理器，将音频数据转为 16 位 PCM 格式
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    const pcmData = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    // 发送 PCM 数据到主线程
    this.port.postMessage({ buffer: pcmData }, [pcmData.buffer]);

    return true;
  }
}

// 注册音频处理器
registerProcessor('recorder-processor', RecorderProcessor);