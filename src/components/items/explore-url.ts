/** Parâmetros de /explorar como aparecem na URL. */
export type ExploreParams = {
  q?: string;
  cat?: string;
  cond?: string;
  status?: string;
  sort?: string;
  page?: number;
};

/** Monta /explorar?... omitindo valores vazios e os padrões (sort=recentes, page=1). */
export function exploreHref(params: ExploreParams, changes: Partial<ExploreParams> = {}) {
  const merged = { ...params, ...changes };
  const sp = new URLSearchParams();
  if (merged.q) sp.set("q", merged.q);
  if (merged.cat) sp.set("cat", merged.cat);
  if (merged.cond) sp.set("cond", merged.cond);
  if (merged.status) sp.set("status", merged.status);
  if (merged.sort && merged.sort !== "recentes") sp.set("sort", merged.sort);
  if (merged.page && merged.page > 1) sp.set("page", String(merged.page));
  const qs = sp.toString();
  return qs ? `/explorar?${qs}` : "/explorar";
}
