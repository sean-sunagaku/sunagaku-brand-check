# Sunagaku Brand Check

人が定めたブランド基準と、OpenAI Decisions / TypeSafe Jevそれぞれの評価を分けて比較する、小さなOSSアプリです。

**ブランド基準：面白い実践・学び × 仕事で頼れる専門性。** 女性キャラクターの登場だけで減点せず、日常の投稿に専門性を強要しません。

## Run locally

Node.js 22以上。

```sh
npm ci
npm run check
# 自分のキーをローカル環境変数へ設定。ソースへ記載しない。
export OPENAI_API_KEY=...
export TYPESAFE_API_KEY=...
npm run dev
```

`http://127.0.0.1:4300` を開きます。ローカルdemoはループバックだけにbindします。インターネット公開する場合は、必ずOrigin制限、利用枠、タイムアウト、Secret管理を備えたサーバーadapterを使用してください。

## Reproduce comparisons

```sh
npm run eval
# または秘密設定ファイル（Git対象外）から読み込む
BRAND_ENV_FILE=/absolute/path/.env npm run eval
```

6つの公開用合成例 × 2評価器 × 指示A/B（24回上限）。結果を `reports/latest.json` へ保存します。実行にはAPI料金がかかります。APIキーがない評価器は「未設定」、拒否や壊れた応答は「失敗」として残します。成功扱いへの置換や自動再試行はしません。

比較に利用者の投稿は自動収集しません。サンプルの期待値は作成者が付けたもので、一般のブランド評価精度を保証しません。raw confidenceは提供者間で比較できる校正済み確率ではありません。

## Modules

- `src/core.ts`: 基準、公開指示、入力・出力schema、集約
- `src/providers.ts`: 独立したDecisionsとJev adapter
- `src/ui.tsx`, `src/style.css`: Reactの入力、基準、独立結果、比較レポート表示
- `scripts/evaluate.ts`, `tests/cases.ts`: 再現可能な実API比較
- `docs/design.md`: 設計と範囲

アプリを組み込むホストは広告・規約・認証・利用枠を提供します。Sunagaku Siteは固定したGit commitのパッケージを使用し、独自のAPI・広告・共通規約を接続します。

OpenAI [Decisions API](https://developers.openai.com/api/docs/guides/decisions) / [TypeSafe SDK](https://www.npmjs.com/package/@typesafe-ai/sdk)

MIT © Sunagaku
