
export default function exampleTask({ value }) {
  let result = 0;

  for (let i = 0; i < value; i++) {
    result += i;
  }

  return result;
}
