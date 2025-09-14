import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_CONN = process.env.CONNECTIONS_TABLE;
const TABLE_MSG = process.env.MESSAGES_TABLE;

export const handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const text = body?.text?.toString() || "";
  const nick = (body?.nick || "anon").toString().slice(0, 20);
  const room = (body?.room || "general").toString().slice(0, 32);

  if (!text.trim()) return { statusCode: 400, body: "Empty message" };

  const endpoint = `https://${process.env.WS_API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_SAM_LOCAL ? "local" : process.env.StageName || "prod"}`;

  const api = new ApiGatewayManagementApiClient({ endpoint });

  const now = new Date().toISOString();
  await ddb.send(new PutCommand({
    TableName: TABLE_MSG,
    Item: { room, timestamp: now, nick, text }
  }));

  const conns = await ddb.send(new ScanCommand({ TableName: TABLE_CONN, ProjectionExpression: "connectionId" }));
  const payload = JSON.stringify({ nick, text, room, timestamp: now });

  const results = await Promise.allSettled(
    (conns.Items || []).map(c =>
      api.send(new PostToConnectionCommand({ ConnectionId: c.connectionId, Data: Buffer.from(payload) }))
    )
  );

  // Optionally: delete stale connections (410 Gone)
  return { statusCode: 200, body: JSON.stringify({ ok: true, sent: results.length }) };
};
