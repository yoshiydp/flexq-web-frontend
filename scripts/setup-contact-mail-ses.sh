#!/usr/bin/env bash
#
# お問い合わせフォーム（/contact）のメール送信を運営者アカウントの SES に切り替える。
#
# 行うこと（すべて運営者アカウント・AWS_PROFILE=flexq-ops）:
#   1. 送信専用 IAM ユーザー flexq-web-contact-mail を作成（既にあればそのまま使う）
#   2. ses:SendEmail / ses:SendRawEmail のみ・差出人 noreply@flexqstudio.com 限定のインラインポリシーを付与
#   3. アクセスキーを発行し、画面には出さずにファイル（chmod 600）へ保存
#   4. Vercel の Preview(staging) と Production に AWS_SES_* / CONTACT_FROM_EMAIL ほかを登録
#      （staging の CONTACT_TO_EMAIL は削除し、運営者宛が contact@flexqstudio.com に届くようにする）
#
# 実行後: 保存したキーのファイルをパスワードマネージャーに移して削除し、Vercel を再デプロイする。
# Claude Code からは IAM の作成・キー発行が安全判定で止まるため、開発者がターミナルで実行する。
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-flexq-ops}"
REGION="ap-northeast-1"
USER_NAME="flexq-web-contact-mail"
POLICY_NAME="ses-send-contact-mail"
FROM_ADDRESS="noreply@flexqstudio.com"
FROM_HEADER="FlexQ Contact <${FROM_ADDRESS}>"
KEY_FILE="${HOME}/.flexq-web-contact-mail-key.json"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

log() { printf '\n== %s\n' "$*"; }

log "運営者アカウントの確認"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
echo "account: ${ACCOUNT} (profile: ${AWS_PROFILE})"
if [ "${ACCOUNT}" != "195236889454" ]; then
  echo "想定外のアカウントです。AWS_PROFILE=flexq-ops になっているか確認してください" >&2
  exit 1
fi

log "SES の状態（東京）"
aws sesv2 get-account --region "${REGION}" \
  --query "{production:ProductionAccessEnabled,sending:SendingEnabled}" --output text
aws sesv2 get-email-identity --region "${REGION}" --email-identity flexqstudio.com \
  --query "VerifiedForSendingStatus" --output text | sed 's/^/flexqstudio.com verified: /'

log "IAM ユーザー ${USER_NAME}"
if aws iam get-user --user-name "${USER_NAME}" >/dev/null 2>&1; then
  echo "既に存在します（再利用）"
else
  aws iam create-user --user-name "${USER_NAME}" \
    --tags Key=Project,Value=flexq-web Key=Purpose,Value=contact-form-mail >/dev/null
  echo "作成しました"
fi

log "送信専用ポリシー ${POLICY_NAME}"
aws iam put-user-policy --user-name "${USER_NAME}" --policy-name "${POLICY_NAME}" \
  --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"SendContactMailOnly\",\"Effect\":\"Allow\",\"Action\":[\"ses:SendEmail\",\"ses:SendRawEmail\"],\"Resource\":\"*\",\"Condition\":{\"StringEquals\":{\"ses:FromAddress\":\"${FROM_ADDRESS}\"}}}]}"
aws iam get-user-policy --user-name "${USER_NAME}" --policy-name "${POLICY_NAME}" \
  --query "PolicyDocument.Statement[0].Condition" --output json

log "アクセスキーの発行"
EXISTING="$(aws iam list-access-keys --user-name "${USER_NAME}" --query 'length(AccessKeyMetadata)' --output text)"
if [ "${EXISTING}" -ge 2 ]; then
  echo "このユーザーには既にアクセスキーが 2 本あります。不要な方を削除してから再実行してください" >&2
  aws iam list-access-keys --user-name "${USER_NAME}" --output table >&2
  exit 1
fi
umask 077
aws iam create-access-key --user-name "${USER_NAME}" --output json > "${KEY_FILE}"
ACCESS_KEY_ID="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['AccessKey']['AccessKeyId'])" "${KEY_FILE}")"
SECRET="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['AccessKey']['SecretAccessKey'])" "${KEY_FILE}")"
echo "access key id: ${ACCESS_KEY_ID}"
echo "secret は ${KEY_FILE} にのみ保存しました（画面には出しません）"

# .env.local から Notion の値を読む（Production 用）
read_env() { grep -E "^$1=" "${ROOT}/.env.local" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
NOTION_TOKEN="$(read_env NOTION_TOKEN || true)"
NOTION_DS="$(read_env NOTION_CONTACT_DATA_SOURCE_ID || true)"
if [ -z "${NOTION_TOKEN}" ] || [ -z "${NOTION_DS}" ]; then
  echo ".env.local に NOTION_TOKEN / NOTION_CONTACT_DATA_SOURCE_ID が見つかりません" >&2
  exit 1
fi

cd "${ROOT}"
set_env() { # name value env [branch]
  local name="$1" value="$2" env="$3" branch="${4:-}"
  vercel env rm "${name}" "${env}" ${branch:+"${branch}"} --yes >/dev/null 2>&1 || true
  printf '%s' "${value}" | vercel env add "${name}" "${env}" ${branch:+"${branch}"} --sensitive >/dev/null
  echo "  ${env}${branch:+ (${branch})}: ${name}"
}

log "Vercel: Preview (staging) を運営者アカウントの SES に差し替え"
set_env AWS_SES_ACCESS_KEY_ID     "${ACCESS_KEY_ID}" preview staging
set_env AWS_SES_SECRET_ACCESS_KEY "${SECRET}"        preview staging
set_env CONTACT_FROM_EMAIL        "${FROM_HEADER}"   preview staging
vercel env rm CONTACT_TO_EMAIL preview staging --yes >/dev/null 2>&1 && echo "  preview (staging): CONTACT_TO_EMAIL を削除" || true

log "Vercel: Production に登録"
set_env CONTACT_MAIL_PROVIDER         "ses"                        production
set_env AWS_SES_REGION                "${REGION}"                  production
set_env AWS_SES_ACCESS_KEY_ID         "${ACCESS_KEY_ID}"           production
set_env AWS_SES_SECRET_ACCESS_KEY     "${SECRET}"                  production
set_env CONTACT_FROM_EMAIL            "${FROM_HEADER}"             production
set_env NOTION_TOKEN                  "${NOTION_TOKEN}"            production
set_env NOTION_CONTACT_DATA_SOURCE_ID "${NOTION_DS}"               production
set_env CONTACT_FORM_SECRET           "$(openssl rand -hex 32)"    production

log "完了。次にやること"
cat <<MSG
1. ${KEY_FILE} の内容をパスワードマネージャーに保存し、ファイルを削除する:
     rm "${KEY_FILE}"
2. Vercel を再デプロイして環境変数を反映する（環境変数は再デプロイまで反映されない）:
     vercel redeploy https://flexq-web-git-staging-flexq-web.vercel.app   # staging
     vercel redeploy https://flexq-web-frontend.vercel.app                # 本番（公開済み・キー再発行時は必須）
3. staging（公開後は本番も）の /contact から外部アドレス宛に送信し、差出人が ${FROM_ADDRESS} になることを確認する
MSG
