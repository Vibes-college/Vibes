// 使用纯字母固定长度唯一词，避免数字被搜索分词拆开后出现前缀命中。
export function scaleMarker(index: number): string {
  let value = index;
  let marker = '';
  for (let digit = 0; digit < 6; digit++) {
    marker = String.fromCharCode(97 + (value % 26)) + marker;
    value = Math.floor(value / 26);
  }
  return `scalemarker${marker}`;
}
