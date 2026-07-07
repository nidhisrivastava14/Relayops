import { NextResponse } from 'next/server';

/**
 * Returns a type 1 PONG response.
 */
export function pongResponse() {
  return NextResponse.json({ type: 1 });
}

/**
 * Returns a type 5 DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE response.
 */
export function deferredResponse() {
  return NextResponse.json({ type: 5 });
}

/**
 * Returns a type 4 message response with optional components.
 */
export function channelMessageResponse(content: string, components?: unknown[]) {
  return NextResponse.json({
    type: 4,
    data: {
      content,
      ...(components ? { components } : {}),
    },
  });
}

/**
 * Returns a type 7 UPDATE_MESSAGE response (used for message components like button clicks).
 */
export function updateMessageResponse(content: string, components?: unknown[]) {
  return NextResponse.json({
    type: 7,
    data: {
      content,
      components: components || [],
    },
  });
}

/**
 * Returns a graceful type 4 error response.
 */
export function errorResponse(message: string) {
  return NextResponse.json({
    type: 4,
    data: {
      content: `⚠️ Error: ${message}`,
    },
  });
}
