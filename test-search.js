const tests = [
  { title: "SSC CGL Tier 1 Mock", description: "This is a mock test", examCategory: "SSC CGL" }
];
const query = "ssc";
const lowerQuery = query.toLowerCase();
const filteredTests = tests.filter(
  (test) =>
    test.title.toLowerCase().includes(lowerQuery) ||
    (test.description && test.description.toLowerCase().includes(lowerQuery)) ||
    (test.examCategory && test.examCategory.toLowerCase().includes(lowerQuery))
).slice(0, 5);
console.log(filteredTests.length);
