export function success<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

export function error(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: { message, code: status } }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Response {
  return success({
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
