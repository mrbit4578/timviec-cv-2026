# itviec-cli

Tìm việc IT trên ITviec từ dòng lệnh. Không cần đăng nhập, không có dependency lúc chạy (chỉ cần `bun`).

```bash
bun run src/cli.ts search -q "python" -l "Hồ Chí Minh" --format table
bun run src/cli.ts detail ai-engineer-python-ai-apis-llms-forix-4550 --format plain
```

- `bun install` chỉ cài type cho TypeScript (dev).
- `bun run typecheck` / `bun test` - test chạy offline bằng fixture trong `tests/fixtures/`.
- URL pattern và các điểm neo khi parse HTML: xem `../url-reference.md`.

Chỉ dùng cá nhân, số lượng request thấp.
