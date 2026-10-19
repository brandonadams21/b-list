import type { MovieSummary } from "@b-list/contracts";

export interface MovieProvider {
  readonly name: string;
  search(query: string, limit: number): Promise<MovieSummary[]>;
}

export class InMemoryMovieProvider implements MovieProvider {
  readonly name = "in-memory";

  constructor(private readonly catalog: readonly MovieSummary[] = []) {}

  async search(query: string, limit: number): Promise<MovieSummary[]> {
    const normalized = query.trim().toLocaleLowerCase();
    return this.catalog
      .filter((movie) => {
        const haystack = [movie.title, movie.overview ?? "", ...movie.genres]
          .join(" ")
          .toLocaleLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, limit);
  }
}
