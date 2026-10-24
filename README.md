# Little Animal Identifier 🐾

Our original [MobileNet v2](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) animal classifier is the default again.

**Live website:** https://maplewashere00.github.io/little-animal-identifier/

## Current modes

- **🌎 Identify animal (default):** predicts the best animal/image category from the original full photo and shows its original model score, plus four alternatives. It also shows cat-appearance clues if MobileNet returned any known domestic-cat labels.
- **🔎 Also check a centered close-up (optional):** asks the same MobileNet model to classify a crop with 14% removed from each edge. Shows this as a **separate** result so we can compare background effects. It is not automatically more accurate; don't use it for off-center animals.
- **[Cat Coat Lab](coat-lab/):** earlier experimental coat color/pattern page retained for reference; not the default or a proven improvement.

## Accuracy and confidence

A model score is **not** the measured percentage of predictions it gets correct. We don't inflate scores or silently select the highest-scoring view. This update removes the separate cat-location detector and keeps the original animal classifier with a controlled crop comparison, **not** a trained accuracy upgrade. Improving real-world accuracy requires labeled photos, evaluation, and potentially a better trained model.

The original model has only a few domestic-cat appearance categories. Tabby is a pattern, not a breed. Coat color and most patterns are outside its supported label set.

Photos are processed in the browser. AI libraries and model weights are downloaded from third-party hosts; an internet connection is required.

## Tests

Run the offline decision tests with:

```sh
node --test tests/cat-logic.test.js
```

These tests check decision logic and regression cases, not image-recognition accuracy. See [EVALUATION.md](EVALUATION.md).

## License

MIT — see [LICENSE](LICENSE).

## Research direction

The next meaningful accuracy improvement is to collect labeled evaluation photos, then compare the baseline MobileNet with transfer learning from MobileNet embeddings. Use a held-out test set, not just photos used in development. Confidence calibration is a separate task and needs labeled validation examples; never boost percentages just to make the model look more certain.

References: [TensorFlow MobileNet documentation](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet), [TensorFlow transfer learning guide](https://www.tensorflow.org/tutorials/images/transfer_learning), and [Guo et al., calibration research](https://proceedings.mlr.press/v70/guo17a.html).
