// Simple test to verify the testing framework works
test('basic test works', () => {
  expect(1 + 1).toBe(2);
});

test('string operations work', () => {
  expect('hello world').toContain('world');
});

test('array operations work', () => {
  const arr = [1, 2, 3];
  expect(arr).toHaveLength(3);
  expect(arr).toContain(2);
});
