# vietnamworks-cli

Tìm việc trên VietnamWorks từ dòng lệnh. Không cần đăng nhập, không có dependency lúc chạy (chỉ cần `bun`).

```bash
bun run src/cli.ts search -q "data analyst" -l "Hồ Chí Minh" --jobage 14 --format table
bun run src/cli.ts detail 2121927 --format plain
```

- `bun install` chỉ cài type cho TypeScript (dev).
- `bun run typecheck` / `bun test` - test chạy offline bằng fixture `tests/fixtures/search.json`.
- Endpoint và cách map field: xem `../url-reference.md`.

Chỉ dùng cá nhân, số lượng request thấp.
