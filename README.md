# 学びクエスト

既存の4年生の問題集と、はなまらいおんのステッカーを使った学習ゲームです。`index.html` は従来と同じあいことばで開ける、単独で動く暗号化HTMLです。

## 新しい冒険

- 帽子の仲間タセヌー（算数）・ヨメヌー（国語）と既存の問題を一緒に解きます。
- その教科の好きなセットを全問正解すると仲間になります。仲間の状態は取得ステッカーから判定するため、旧セーブ・QRでも引き継げます。間違えても失う記録はありません。
- 教科別XP、取得ステッカー、旧バトル記録は従来のQR形式で保持します。
- 仲間の絵・旗はSeth ByrdのCC0素材、雲と木はKenney Background Elements、ボタンはKenney UI Pack（ともにCC0）です。各assetsフォルダーのLICENSE.txt参照。
- QR画像保存と読み込み、端末への自動保存、旧じゅもんも引き続き使用できます。

## 開発

追加のソースは `src/`、同梱ライブラリは `vendor/`、敵の素材は `assets/monsters/` です。暗号化HTMLを読み解いて既存の問題集を残し、追加コードと素材をインラインに組み込んで再暗号化します。`index-2.html` は過去版としてそのまま残しています。

Node.js で `node --test tests/progress.cjs` を実行できます。

ビルドする際は環境変数 `MANABI_PASSWORD` に既存のあいことばを設定し、リポジトリ直下で `node scripts/build.cjs` を実行してください。パスワードはソース管理に保存しません。`--preview` を付けるとローカル確認用の復号済み `game.source.html` を出力します（Git管理対象外）。公開するのは `index.html` です。

## フリー素材・ライブラリ

- 敵の体・目・口：Kenney「Monster Builder Pack」、CC0。 https://kenney.nl/assets/monster-builder-pack （同梱 `assets/monsters/LICENSE.txt`）。敵はこれらのパーツを組み合わせて表示しています。
- QR生成：qrcode-generator 1.4.4、Kazuhiko Arase、MIT（`vendor/qrcode-LICENSE`）。
- QR読み取り：jsQR 1.4.0、Cozmo、Apache-2.0（`vendor/jsqr-LICENSE`）。
- はなまらいおんと学習問題：元のゲームの内容を継続利用。
