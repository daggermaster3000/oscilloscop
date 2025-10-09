import asyncio
import sounddevice as sd
import numpy as np
import websockets
import threading
import tkinter as tk

clients = set()

async def ws_handler(websocket):
    clients.add(websocket)
    print("Client connected")
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)

async def broadcast_audio(indata):
    if clients:
        data_bytes = indata.astype(np.float32).tobytes()
        await asyncio.gather(*(ws.send(data_bytes) for ws in clients))

def start_audio_stream(loop, channels, samplerate):
    def callback(indata, frames, time, status):
        if status:
            print(status)
        # Schedule broadcast on the existing loop (thread-safe)
        asyncio.run_coroutine_threadsafe(broadcast_audio(indata.copy()), loop)

    try:
        # Make sure this blocks but doesn't try to use asyncio.run inside the thread
        with sd.InputStream(channels=channels, samplerate=samplerate, callback=callback):
            print("🎧 Audio stream started")
            while True:
                sd.sleep(1000)  # just keep the stream alive
    except Exception as e:
        print("❌ Audio stream error:", e)

async def start_ws_server():
    async with websockets.serve(ws_handler, "0.0.0.0", 8080):
        print("🟢 WebSocket server started on ws://0.0.0.0:8080")
        await asyncio.Future()  # run forever

def start_asyncio_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

class AudioBridgeApp:
    def __init__(self, root):
        self.root = root
        root.title("Python Audio Bridge")
        root.geometry("300x150")

        self.is_streaming = False
        self.loop = asyncio.new_event_loop()
        threading.Thread(target=start_asyncio_loop, args=(self.loop,), daemon=True).start()

        self.status_label = tk.Label(root, text="Stopped", fg="red")
        self.status_label.pack(pady=10)

        self.toggle_btn = tk.Button(root, text="Start Streaming", command=self.toggle)
        self.toggle_btn.pack(pady=10)

        self.quit_btn = tk.Button(root, text="Quit", command=root.quit)
        self.quit_btn.pack(pady=10)

    def toggle(self):
        if not self.is_streaming:
            self.start()
        else:
            self.stop()

    def start(self):
        dev_info = sd.query_devices(kind='input')
        channels = min(2, dev_info['max_input_channels'])
        samplerate = int(dev_info['default_samplerate'])

        # Start websocket server asynchronously on the separate loop
        asyncio.run_coroutine_threadsafe(start_ws_server(), self.loop)

        # Start audio stream in a separate thread
        threading.Thread(target=start_audio_stream, args=(self.loop, channels, samplerate), daemon=True).start()

        self.is_streaming = True
        self.status_label.config(text="Streaming...", fg="green")
        self.toggle_btn.config(text="Stop Streaming")
        print(f"✅ Streaming on ws://localhost:8080 with {channels} channel(s)")

    def stop(self):
        self.is_streaming = False
        self.status_label.config(text="Stopped", fg="red")
        self.toggle_btn.config(text="Start Streaming")
        print("🛑 Audio bridge stopped")

if __name__ == "__main__":
    root = tk.Tk()
    app = AudioBridgeApp(root)
    root.mainloop()
