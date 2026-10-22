# Little Animal Identifier 🐾

A beginner-friendly, static website that uses a pretrained **MobileNet v2** model to identify what's in a photo. It runs entirely in the browser after downloading TensorFlow.js and model weights; **no API key, backend, or paid service** is required.

## Try it locally

Open `index.html` in a browser with an internet connection, choose a JPG/PNG/WebP photo under 10 MB, and click **Identify animal**. If your browser blocks local model loading, serve the folder with `python3 -m http.server 8000` and visit `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a **public** repository named `little-animal-identifier`.
2. Upload the files in this folder to the repository root.
3. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. Wait for GitHub Pages to publish the site. GitHub will display its URL.

## What it actually does

MobileNet is trained on ImageNet's 1,000 classes. It may identify many kinds of animals, but **not every animal**. The app shows the top predicted class and four alternatives, with raw model scores. These scores are not calibrated probabilities. This is **not** a specially trained cat/dog/rabbit classifier or a species verification tool.

Photos are processed locally in the browser; this app does not upload them to a server. JavaScript libraries and model weights are downloaded from external CDNs. Those providers may receive ordinary network request metadata. The first model load needs internet access.

## Project files

- `index.html`: interface and model script loading
- `style.css`: layout and styling
- `app.js`: photo handling and predictions

## Limitations and future ideas

Predictions can be wrong, especially for unusual photos, multiple animals, and animals outside the model's training categories. Future versions could add an animal-only label mapping, a more specialized model, accessibility improvements, or tests. Do not rely on this project for safety decisions.

## License

MIT — see [LICENSE](LICENSE).
