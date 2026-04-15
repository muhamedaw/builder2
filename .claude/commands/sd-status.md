# /sd-status — Check Stable Diffusion Status

Check if a local Stable Diffusion WebUI (AUTOMATIC1111) is running and reachable.

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:7860/sdapi/v1/options
```

Then report:
- 🟢 **Online** — SD is running at http://127.0.0.1:7860 — AI Studio will use it automatically
- 🔴 **Offline** — SD is not running

If offline, show instructions:
1. Download AUTOMATIC1111: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. Run `webui-user.bat` (Windows) or `webui.sh` (Mac/Linux)
3. Wait for it to start, then refresh PageCraft AI Studio
4. Or enter an OpenAI API key in AI Studio → ⚙ Settings as fallback
