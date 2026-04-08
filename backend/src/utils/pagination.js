export function normalizePaginationQuery(query = {}, defaults = {}) {
  const page = Math.max(Number(query.page || defaults.page || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(query.pageSize || defaults.pageSize || 10), 1),
    Number(defaults.maxPageSize || 100)
  );

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function buildPaginatedResult(items, total, page, pageSize) {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}
