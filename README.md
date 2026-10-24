# Little Animal Identifier 🐾 — enhanced cat appearance analysis

Our original [MobileNet v2](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) animal classifier is the **default** again. It identifies many animal categories, and when it sees domestic-cat labels it performs two extra views (a horizontal flip and a small center crop) to compare appearance guesses.

## Live website

https://maplewashere00.github.io/little-animal-identifier/

## What changed

- **Identify animal + cat type (default):** keeps the original top-five general-animal predictions, requests the model's top 15 internal categories, and combines related cat labels (such as `tabby` and `tiger cat`) to assess cat appearances. If cat-category support is at least 8% on the original view, it also evaluates a flipped view and a small center crop.
- **Detect cat locations (optional):** keeps the experimental COCO-SSD cat-box detector from v2. It answers whether/where it sees cats, not their type.
- Shows the **original top guess and raw score** alongside combined cat-category support, average appearance score across views, and whether the views agree. Different views of the same photo are not independent evidence.

## Important limits

**We have not demonstrated an increase in real-world accuracy yet.** Combining cat categories may make the appearance information more useful, but it does not make the model better trained. The combined score is **not a calibrated probability** that a cat or breed identification is correct. We do not artificially boost confidence numbers.

The original model knows only a few cat appearance classes: tabby-patterned, Siamese-like, Persian-like, and an ImageNet class called “Egyptian cat” (shown as short-haired appearance). **Tabby is a coat pattern, not a breed.** Many cats cannot be reliably assigned a breed from a photo. The tool can return “unclear.” For true breed classification we'd need a specialized model trained and independently evaluated on appropriately labeled cat photos.

Photos are processed locally in the browser. The model and libraries download from third-party CDNs, so internet is required and those providers may receive normal download request metadata. No backend, API key, or paid service is needed.

## Run locally and test

Serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. Choose a JPG, PNG, or WebP photo under 10 MB.

Run the decision tests using Node.js:

```sh
node --test tests/cat-logic.test.js
```

These use synthetic predictions; they cannot establish real-photo accuracy. See [EVALUATION.md](EVALUATION.md) for precision, recall, and held-out evaluation guidance.

## License

MIT — see [LICENSE](LICENSE).
