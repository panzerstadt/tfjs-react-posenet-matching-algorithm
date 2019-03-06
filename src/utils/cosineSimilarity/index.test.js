import cosineSimilarity from "./index";

const test = [
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0]
];

it("correctly calculates cosine similarity", () => {
  expect(cosineSimilarity(test[0], test[1])).toEqual(0.14433756729740646);
});
