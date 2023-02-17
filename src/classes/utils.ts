/**
 * Get the last object less than or equal to the value.
 */
export const search = <T, U extends keyof T>(objs: T[], key: U, value: T[U]) => {
  for (let min = 0, max = objs.length - 1; min <= max;) {
    // middle point
    const middle = Math.floor((min + max) / 2);

    // middle object and next object
    const a = objs[middle + 0];
    const b = objs[middle + 1];

    // binary search
    if (b && b[key] <= value) {
      if (a[key] < value) {
        min = middle + 1;
        continue;
      } else {
        min = middle + 1;
        max = middle + 1;
        continue;
      }
    } else {
      if (a[key] > value) {
        max = middle - 1;
        continue;
      }
    }

    return objs[middle];
  }
};
