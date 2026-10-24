# Little Animal Identifier 🐾 — Cat Detective v2

A browser-only animal identifier for GitHub Pages, with two modes:

- **Cat Detective:** detects cats in photos using [TensorFlow.js COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) with a lightweight MobileNet v2 backbone. Draws boxes around possible cats. Scores at least 0.70 display **Cat detected**; scores 0.40–0.69 display **Possible cat — uncertain**; otherwise displays **No cat detected** (which does **not** rule out a cat). Thresholds are uncalibrated starting points, not measured precision values.
- **Identify anything:** preserves the original [MobileNet v2](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) top-five ImageNet predictions.

Models load on demand after choosing an image, with no API key and no server-side photo upload. Network access is needed to fetch JavaScript libraries and the model weights. External providers may log normal download request metadata.

## Live website

https://maplewashere00.github.io/little-animal-identifier/

## Run locally

Serve the project folder with `python3 -m http.server 8000`, then open `http://localhost:8000`. Select a JPG, PNG, or WebP photo under 10MB.

## Run offline logic tests

`node --test tests/cat-logic.test.js`

These tests check decision thresholds and edge cases using *synthetic model predictions*. They do not establish real-world cat recognition accuracy.

## Evaluate reliability before claiming high accuracy

Collect consented, correctly labeled, diverse test photos that were **not used for tuning**: cats of different breeds/ages/lighting/poses, cats mixed with dogs, distant cats, dogs, stuffed animals, foxes, frogs, and pictures without animals. Score **precision** (of photos labeled 'Cat detected', what fraction actually contain cats), **recall** (of photos with cats, what fraction are detected), false positive/false negative counts, plus phone performance. Include ambiguous cases and do not cherry-pick examples. Tune the two cat thresholds only using a *separate* development set, and retest on the untouched evaluation set.

See [EVALUATION.md](EVALUATION.md) for a simple testing worksheet and metric definitions.

If the detector is not good enough, evaluate a fine-tuned cat vs. non-cat model. No model can be honestly advertised as 100% accurate on all images.

## Safety, privacy, and limitations

- Scores are detector confidence values, **not** the percentage chance that the prediction is correct.
- Nothing is guaranteed, especially small/occluded cats and photographs outside the model's training distribution.
- This is a fun educational project, not a professional species identification or safety tool.
- The model's weights and TF.js libraries load from third-party CDNs, so a connection is needed for the first load.

## License

MIT — see LICENSE.
