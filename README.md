# Real-Time Chat Application (Serverless on AWS)

A minimal real-time chat app using **API Gateway (WebSocket)** + **AWS Lambda** + **DynamoDB**. Authentication is pluggable via **Cognito Hosted UI (OAuth2)** or any OIDC provider.

## Architecture
- API Gateway WebSocket routes: `$connect`, `$disconnect`, `sendMessage`
- Lambda handlers for each route
- DynamoDB tables: `Connections`, `Messages`
- CloudWatch Logs for monitoring

## Deploy (AWS SAM)
Prereqs: AWS CLI, SAM CLI, Node.js 18+.
```bash
sam build
sam deploy --guided
```
During deploy, note the `WebSocketUrl` output. Put it into `frontend/index.html` as `WS_URL`.

## Local quick test (after deploy)
Open `frontend/index.html` in two tabs, enter a nickname, and send messages.

## OAuth2 (optional)
- Create a Cognito User Pool and Hosted UI (Google or GitHub IdP works)
- Protect `sendMessage` with a Lambda authorizer (example stub included in comments)
- Pass ID token from frontend via `Sec-WebSocket-Protocol` or query param and verify inside handlers.

## Cleanup
```bash
sam delete
```

## Cost note
This stack stays comfortably in free/low tier for light testing (Lambda invocations, API Gateway msgs, DynamoDB on-demand).
