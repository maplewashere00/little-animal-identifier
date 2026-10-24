# Cat Coat Lab — experimental companion to Little Animal Identifier

An **experimental** browser-only prototype for classifying the **main visible fur color** and **dominant visible coat pattern** of a cat. Intended as a starting point for measurement, **not** as a verified high-accuracy classifier.

The existing [Little Animal Identifier](https://maplewashere00.github.io/little-animal-identifier/) stays unchanged while this prototype is evaluated.

## Approach

- Uses the documented [Transformers.js zero-shot-image-classification pipeline](https://huggingface.co/Xenova/clip-vit-base-patch32) and the pre-existing quantized [Xenova/clip-vit-base-patch32](https://huggingface.co/Xenova/clip-vit-base-patch32) model. This is not a coat-specific trained model.
- Runs locally in the browser. The first model download can be large (roughly 150 MB in one reference implementation); it may be slow or fail due to limited device memory. No inference API key is needed. Image files aren't sent to a server; library and model downloads contact CDNs and Hugging Face.
- Ranks a short list of descriptive prompts for **color** and a separate list for **pattern**. It also flags close decisions. Its percentages are *relative scores over the candidate prompts*, **not** a calibrated probability of correctness. Candidate wording can affect results.
- Assumes the photograph has **one domestic cat** and preferably shows a good amount of its coat. It does *not* independently confirm an animal is a cat. Color, pattern, and white markings can overlap; our simplified labels don't cover all combinations.
- Lets you optionally annotate the correct labels *before* analyzing, and export a **CSV of results only** for testing (photos and filenames aren't recorded). Results last only for the current tab/session.

## Run the prototype

The module-based site needs a local web server (not `file://`). From its folder:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000/ and upload a cat photo. The model needs internet access the first time. When added under `coat-lab/` in GitHub Pages, visit `/coat-lab/` for the preview.

## Test the decision logic

```sh
npm test
```

These are **synthetic decision-logic tests**, not a measured accuracy study of CLIP on cat images. We need actual labeled cat photos and non-cat/ambiguous cases before we can evaluate whether this approach is better than the original MobileNet classifier.

## Next research steps

1. Agree on ground-truth labels for Lucy and Neil and a small, diverse set of other cats. Use separate color and pattern labels; avoid guessing true breed from appearance.
2. Save the CSV of **unselected** test photos (not picked for favorable results). Include different cameras, lighting, poses, bicolor tabbies and mixed patterns.
3. Track exact-match color/pattern accuracy and confidence calibration **separately**. Small smoke tests can reveal bugs but cannot justify a 99% accuracy claim.
4. If CLIP isn't accurate enough, gather a sufficiently large, consented, licensed, human-reviewed dataset and fine-tune/evaluate a dedicated multi-label classifier. Do not use a dataset without checking licensing and label reliability.

Taxonomy references: [The International Cat Association](https://tica.org/what-color-is-my-cat/) and [Cat Fanciers' Association](https://cfa.org/coat-color-descriptions/). For example, **tabby** is a pattern rather than a breed, and **tuxedo** is a bicolor nickname.

No changes to existing production code are needed to test the prototype.