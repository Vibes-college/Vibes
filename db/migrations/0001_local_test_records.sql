-- 命令验收专用表；网站目前仍从 src/data/works.json 读取内容。
CREATE TABLE local_test_records (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);
