"use client";

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const HUB_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:5050";

let connection: HubConnection | null = null;

export function getNotificationConnection(): HubConnection {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(`${HUB_URL}/hubs/notifications`, {
        accessTokenFactory: () =>
          typeof window !== "undefined"
            ? (localStorage.getItem("access_token") ?? "")
            : "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onclose(() => {
      // Connection closed; auto-reconnect handles restart
    });

    connection.onreconnecting(() => {
      // Reconnecting in progress
    });

    connection.onreconnected(() => {
      // Connection restored
    });
  }

  return connection;
}

export async function startNotificationConnection(): Promise<void> {
  const conn = getNotificationConnection();
  if (
    conn.state === HubConnectionState.Disconnected ||
    conn.state === HubConnectionState.Disconnecting
  ) {
    try {
      await conn.start();
    } catch {
      // Silently fail; withAutomaticReconnect will retry
    }
  }
}

export async function stopNotificationConnection(): Promise<void> {
  if (
    connection &&
    connection.state !== HubConnectionState.Disconnected
  ) {
    await connection.stop();
  }
}
